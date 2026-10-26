'use strict';
/* Real browser regression and responsive QA. Run locally and against Pages:
 * node scripts/browser_test.cjs --base-url http://127.0.0.1:8765/ --screenshots
 * Optional: --engines chromium,firefox,webkit --output /tmp/sdm-browser-qa
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {chromium,firefox,webkit} = require('playwright');
const args=process.argv.slice(2);
const arg=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const baseURL=arg('--base-url','http://127.0.0.1:8765/');
const output=arg('--output','/tmp/sdm-browser-qa');
const engines=arg('--engines','chromium,firefox,webkit').split(',');
const screenshots=args.includes('--screenshots');
fs.mkdirSync(output,{recursive:true});
const data={};vm.createContext(data);vm.runInContext(fs.readFileSync(path.join(__dirname,'../products.js'),'utf8')+';this.products=PRODUCTS;',data);
const products=JSON.parse(JSON.stringify(data.products));
const report={baseURL,startedAt:new Date().toISOString(),physicalDevices:false,engines:{}};
const slug=s=>s.replace(/[^a-z0-9-]/gi,'_');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
let activeEngine='';
// WebKit guards History API calls at 100/10s. Keep real navigation assertions,
// while avoiding an automation-only burst faster than human interaction.
const actionPace=()=>activeEngine==='webkit'?delay(120):Promise.resolve();
async function visible(page,view){await page.locator(`[data-view="${view}"]`).waitFor({state:'visible'});await actionPace();}
async function nav(page,view){await page.locator(`.menu [data-go="${view}"]`).click();await visible(page,view);}
async function theme(page,name){await page.locator(`.theme-btn[data-theme="${name}"]`).click();assert.equal(await page.locator('#site').getAttribute('data-theme'),name);}
async function reset(page){await page.locator('[data-view="catalog"] [data-reset="filters"]').first().click();await actionPace();assert.equal(await page.locator('#catalogGrid .product-card').count(),20);}
async function cardIds(page){return page.locator('#catalogGrid .product-photo-link').evaluateAll(els=>els.map(e=>e.dataset.openProduct));}
async function money(page,selector){return Number((await page.locator(selector).textContent()).replace(/[^0-9]/g,''));}
async function open(page,p){await nav(page,'catalog');await reset(page);await page.locator(`#catalogGrid .product-photo-link[data-open-product="${p.id}"]`).click();await visible(page,'product');assert.match(await page.locator('#detailSku').textContent(),new RegExp(p.sku));}
async function checkImages(page){
 const images=page.locator('[data-view]:visible img');
 for(let i=0;i<await images.count();i++){
  const img=images.nth(i);await img.scrollIntoViewIfNeeded();
  await img.evaluate(el=>el.complete?null:new Promise((resolve,reject)=>{el.addEventListener('load',resolve,{once:true});el.addEventListener('error',()=>reject(new Error(el.src)),{once:true});}));
  assert.ok(await img.evaluate(el=>el.naturalWidth>100),'Loaded nonempty image '+await img.getAttribute('src'));
 }
}
async function overflow(page,label){
 const dimensions=await page.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
 assert.ok(dimensions.doc<=dimensions.width+1&&dimensions.body<=dimensions.width+1,`${label}: page overflow ${JSON.stringify(dimensions)}`);
}
async function snapshot(page,name){if(screenshots){await checkImages(page);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});}}
async function filter(page,key,value){await page.locator(`[data-filter="${key}"][data-value=${JSON.stringify(value)}]`).click();await actionPace();}
async function main(){
 for(const name of engines){
  activeEngine=name;
  const result=report.engines[name]={checks:[],errors:[],requests:[],screenshots:[]};
  let browser,page;
  try{
   browser=await ({chromium,firefox,webkit}[name]).launch({headless:true,executablePath:name==='webkit'?process.env.SDM_WEBKIT_EXECUTABLE||undefined:name==='firefox'?process.env.SDM_FIREFOX_EXECUTABLE||undefined:undefined,args:name==='chromium'?['--no-sandbox']:[]});
   result.version=browser.version();result.actionPacingMs=name==='webkit'?120:0;
   const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
   page=await context.newPage();
   page.on('pageerror',error=>result.errors.push(error.message));
   page.on('console',message=>{if(message.type()==='error')result.errors.push(message.text());});
   page.on('response',response=>{if(response.status()>=400)result.requests.push({status:response.status(),url:response.url()});});
   page.on('requestfailed',request=>result.requests.push({url:request.url(),failure:request.failure()}));
   await page.goto(baseURL,{waitUntil:'networkidle'});await visible(page,'home');
   assert.equal(await page.locator('#site').getAttribute('data-theme'),'petrol');
   assert.deepEqual(await page.locator('.theme-btn').evaluateAll(es=>es.map(e=>e.dataset.theme)),['petrol','olive']);
   await page.locator('.skip-link').focus();const initialHash=new URL(page.url()).hash;await page.keyboard.press('Enter');assert.equal(new URL(page.url()).hash,initialHash);assert.equal(await page.evaluate(()=>document.activeElement.id),'main');
   result.checks.push('skip link preserves route and focuses main; clean session, default petrol, theme order, initial JS execution');
   for(const palette of ['olive','petrol']){
    await theme(page,palette);
    for(const view of ['catalog','categories','collections','journal','concept','cart']){
     const menu=page.locator(`.menu [data-go="${view}"]`);
     if(await menu.count())await nav(page,view);
     else {const button=page.locator(`[data-go="${view}"]`).first();assert.ok(await button.count(),'Missing navigation '+view);await button.click();await visible(page,view);}
     assert.equal(await page.locator('#site').getAttribute('data-theme'),palette,'Menu click must not select a theme');
    }
    await page.locator('.logo').first().click();await visible(page,'home');
    await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('#site').getAttribute('data-theme'),palette);
   }
   result.checks.push('both themes persist; menus, logo, distinct editorial routes; no theme click interception');
   await nav(page,'catalog');await reset(page);
   assert.deepEqual((await cardIds(page)).sort(),products.map(p=>p.id).sort());
   await checkImages(page);
   for(const p of products){
    const card=page.locator('#catalogGrid .product-card').filter({has:page.locator(`[data-open-product="${p.id}"]`)});
    assert.ok((await card.textContent()).includes(p.sku),'Card official SKU '+p.sku);
    const image=card.locator('img');assert.equal((await image.getAttribute('src')).split('?')[0],p.photo);
   }
   const nameProduct=products[0];await page.locator(`#catalogGrid .name[data-open-product="${nameProduct.id}"]`).click();await visible(page,'product');assert.ok((await page.locator('#detailName').textContent()).includes(nameProduct.name));
   await page.locator('.logo').first().click();await visible(page,'home');await page.locator('[data-view="home"] [data-go="catalog"]').first().click();await visible(page,'catalog');await reset(page);
   result.checks.push('name/photo links and hero catalog CTA; 20 distinct official SKU cards, source-data image mapping and loaded photographs');
   const chosen=products.find(p=>p.sub && products.filter(x=>x.cat===p.cat).length>1);
   await page.locator('.menu [data-go="categories"]').click();await visible(page,'categories');
   await page.locator(`#categoryTiles [data-browse-cat=${JSON.stringify(chosen.cat)}]`).click();await visible(page,'category');
   assert.ok((await page.locator('#categoryTitle').textContent()).includes(chosen.cat));
   await page.locator(`#subcategoryTiles [data-browse-sub=${JSON.stringify(chosen.sub)}]`).click();await visible(page,'catalog');
   assert.deepEqual((await cardIds(page)).sort(),products.filter(p=>p.cat===chosen.cat&&p.sub===chosen.sub).map(p=>p.id).sort());
   await reset(page);
   await filter(page,'cat',chosen.cat);
   assert.deepEqual((await cardIds(page)).sort(),products.filter(p=>p.cat===chosen.cat).map(p=>p.id).sort());
   await filter(page,'sub',chosen.sub);
   const expected=products.filter(p=>p.cat===chosen.cat&&p.sub===chosen.sub);
   assert.deepEqual((await cardIds(page)).sort(),expected.map(p=>p.id).sort());
   const mat=(chosen.mats||[chosen.mat])[0];
   await filter(page,'mat',mat);
   const expectedMat=expected.filter(p=>(p.mats||[p.mat]).includes(mat));
   assert.deepEqual((await cardIds(page)).sort(),expectedMat.map(p=>p.id).sort());
   const collection=Array.isArray(chosen.col)?chosen.col[0]:chosen.col;
   await filter(page,'col',collection);
   assert.deepEqual((await cardIds(page)).sort(),expectedMat.filter(p=>(Array.isArray(p.col)?p.col:[p.col]).includes(collection)).map(p=>p.id).sort());
   const beforeURL=page.url(), before=await cardIds(page);
   await page.locator('#catalogGrid .product-photo-link').first().click();await visible(page,'product');
   const detailURL=page.url();
   await page.reload({waitUntil:'networkidle'});await visible(page,'product');
   await page.locator('[data-return-catalog]').click();await visible(page,'catalog');
   assert.deepEqual(await cardIds(page),before);
   await page.goBack();await visible(page,'product');
   await page.goBack();await visible(page,'catalog');
   assert.deepEqual(await cardIds(page),before);assert.equal(page.url(),beforeURL);
   await page.goForward();await visible(page,'product');assert.equal(page.url(),detailURL);
   // The product's own category/subcategory pills must navigate without opening it again.
   const detailPill=page.locator('#detailCategory button').last();
   if(await detailPill.count()){await detailPill.click();await visible(page,'catalog');}
   await nav(page,'catalog');await reset(page);
   await page.locator('#sortSelect').selectOption('low');
   const sorted=await cardIds(page), lookup=new Map(products.map(p=>[p.id,p.price]));
   assert.ok(sorted.every((id,i)=>i===0||lookup.get(sorted[i-1])<=lookup.get(id)));
   await page.locator('#sortSelect').selectOption('high');
   const descending=await cardIds(page);assert.ok(descending.every((id,i)=>i===0||lookup.get(descending[i-1])>=lookup.get(id)));
   // Find a real material/category combination with an empty intersection.
   const mats=[...new Set(products.flatMap(p=>p.mats||[p.mat]))];
   const pair=products.flatMap(p=>mats.map(m=>({cat:p.cat,mat:m}))).find(x=>!products.some(p=>p.cat===x.cat&&(p.mats||[p.mat]).includes(x.mat)));
   if(pair){await reset(page);await filter(page,'mat',pair.mat);await filter(page,'cat',pair.cat);assert.equal(await page.locator('#catalogGrid .product-card').count(),0);assert.match(await page.locator('#catalogGrid').textContent(),/нет|найден|подобрать|параметр/i);}
   await reset(page);
   const gridPill=page.locator('#catalogGrid .category-pill[data-browse-sub]').first();const pillSub=await gridPill.getAttribute('data-browse-sub');
   await gridPill.click();await visible(page,'catalog');assert.deepEqual((await cardIds(page)).sort(),products.filter(p=>p.sub===pillSub).map(p=>p.id).sort());await reset(page);
   result.checks.push('category/subcategory/material intersection, empty state, reset, price sorting, hash reload and browser back/forward');
   // Every product page must show its own official SKU and main frame.
   for(const p of products){await page.locator(`#catalogGrid .product-photo-link[data-open-product="${p.id}"]`).click();await visible(page,'product');assert.ok((await page.locator('#detailSku').textContent()).includes(p.sku));const img=page.locator('#detailImage img').first();assert.equal((await img.getAttribute('src')).split('?')[0],p.photo);await checkImages(page);await nav(page,'catalog');}
   const multi=products.find(p=>(p.photos||[]).length>1),single=products.find(p=>(p.photos||[]).length===1);
   assert.ok(multi,'Need a real multiframework gallery to verify swipe');
   await open(page,multi);
   let current=await page.locator('#detailImage img').first().getAttribute('src');
   const next=page.locator('[data-gallery-step="1"]');await next.click();
   assert.notEqual(await page.locator('#detailImage img').first().getAttribute('src'),current);
   await page.locator('.gallery-stage').focus();await page.keyboard.press('ArrowLeft');
   assert.equal(await page.locator('#detailImage img').first().getAttribute('src'),current);
   if(single){await open(page,single);assert.equal(await page.locator('[data-gallery-step]:visible').count(),0);}
   result.checks.push('all 20 product pages, matching SKU/main frame, real gallery arrows and keyboard, no false single-frame controls');
   // Clear basket through UI, then add two distinct products.
   await nav(page,'cart');while(await page.locator('[data-remove]').count())await page.locator('[data-remove]').first().click();
   await page.locator('#cartDemoButton').click();
   const demoProduct=products[0];
   assert.equal(await page.locator('[data-cart-row]').count(),1,'Demo button renders an empty basket');
   assert.equal(await page.locator(`[data-cart-input="${demoProduct.id}"]`).inputValue(),'2');
   await page.locator(`[data-cart-input="${demoProduct.id}"]`).fill('1');
   await page.locator('#cartDemoButton').click();
   assert.equal(await page.locator(`[data-cart-input="${demoProduct.id}"]`).inputValue(),'2','Demo updates both visible input and totals');
   await page.locator(`[data-cart-row="${demoProduct.id}"] [data-open-product]`).first().click();await visible(page,'product');
   await page.locator('[data-return-catalog]').click();await visible(page,'cart');
   assert.equal(await page.locator(`[data-cart-input="${demoProduct.id}"]`).inputValue(),'2','Basket product returns to basket');
   while(await page.locator('[data-remove]').count())await page.locator('[data-remove]').first().click();
   for(const p of products.slice(0,2)){await open(page,p);await page.locator('#addToCart').click();}
   await nav(page,'cart');assert.equal(await page.locator('#cartBadge').textContent(),'2');
   const a=products[0],b=products[1];await page.locator(`[data-cart-input="${a.id}"]`).fill('2');
   assert.equal(await page.locator('#cartUnits').textContent(),'3');assert.equal(await money(page,'#cartTotal'),2*a.price+b.price);assert.equal(await money(page,`[data-row-total="${a.id}"]`),2*a.price);
   await page.locator(`[data-cart-input="${a.id}"]`).blur();await page.reload({waitUntil:'networkidle'});await visible(page,'cart');assert.equal(await money(page,'#cartTotal'),2*a.price+b.price);
   await page.locator(`[data-cart-step="${a.id}"][data-delta="1"]`).click();assert.equal(await money(page,'#cartTotal'),3*a.price+b.price);
   await page.locator(`[data-cart-step="${a.id}"][data-delta="-1"]`).click();assert.equal(await money(page,'#cartTotal'),2*a.price+b.price);
   result.checks.push('basket demo empty-to-row and input sync, basket-to-product return, two SKU basket, manual quantity 1-to-2 updates line/total/badge, +/- controls and reload persistence');
   // Old automatically persisted olive must migrate without losing a surviving SKU.
   await page.evaluate(sku=>localStorage.setItem('sm-demo-state',JSON.stringify({theme:'olive',cart:{[sku]:2}})),a.id);
   await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('#site').getAttribute('data-theme'),'petrol');await nav(page,'cart');assert.equal(await page.locator('#cartBadge').textContent(),'2');
   await theme(page,'olive');await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('#site').getAttribute('data-theme'),'olive');
   result.checks.push('legacy olive migration, preserved basket, conscious theme persistence');
   // Responsive sweep through every requested and intermediate width, both palettes.
   const widths=[320,360,375,390,430,511,600,768,820,913,1024,1280,1440,1920,2560];
   for(const palette of ['petrol','olive']){
    await theme(page,palette);
    await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.activeElement!==document.body),'Keyboard focus remains usable');
    for(const width of widths){
     result.step={palette,width};console.log(name,'responsive',palette,width);
     await page.setViewportSize({width,height:width<600?844:1024});
     for(const view of ['home','catalog','categories','category','collections','product','journal','concept','cart']){
      result.step.view=view;
      if(view==='home'){await page.locator('.logo').first().click();await visible(page,view);}
      else if(view==='product')await open(page,multi);
      else if(view==='category'){await nav(page,'categories');await page.locator('#categoryTiles [data-browse-cat]').first().click();await visible(page,'category');}
      else await nav(page,view);
      await overflow(page,`${name}/${palette}/${width}/${view}`);
      if([390,820,1440].includes(width)&&['home','catalog','product','cart'].includes(view))await snapshot(page,`${name}-${palette}-${width}-${view}`);
     }
     if([390,820,1440].includes(width)){await open(page,multi);await page.locator('[data-gallery-step="1"]').click();await snapshot(page,`${name}-${palette}-${width}-gallery`);}
    }
   }
   // Large text and landscape remain usable.
   for(const size of [{width:844,height:390},{width:1024,height:768},{width:768,height:1024}]){await page.setViewportSize(size);await nav(page,'catalog');await page.addStyleTag({content:'html {font-size: 24px !important}'});await overflow(page,`${name}/large-text/${size.width}`);}
   result.checks.push('both palettes: all 13 required widths + intermediate widths; home/catalog/PDP/cart; all screens without overflow; phone/tablet/desktop screenshots; landscape and large text');
   await context.close();
   // Emulated touch sequence tests horizontal gallery change and vertical no-change.
   const mobile=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:name!=='firefox'});
   const touch=await mobile.newPage();await touch.goto(baseURL,{waitUntil:'networkidle'});await open(touch,multi);
   const gallery=touch.locator('.gallery-stage');const old=await gallery.locator('img').first().getAttribute('src');
   await gallery.dispatchEvent('touchstart',{touches:[{identifier:1,clientX:290,clientY:250}]});
   await gallery.dispatchEvent('touchend',{changedTouches:[{identifier:1,clientX:80,clientY:252}]});
   assert.notEqual(await gallery.locator('img').first().getAttribute('src'),old,'Horizontal touch swipe changes photo');
   const after=await gallery.locator('img').first().getAttribute('src');
   await gallery.dispatchEvent('touchstart',{touches:[{identifier:2,clientX:180,clientY:250}]});await gallery.dispatchEvent('touchend',{changedTouches:[{identifier:2,clientX:185,clientY:400}]});assert.equal(await gallery.locator('img').first().getAttribute('src'),after,'Vertical touch movement leaves gallery unchanged');
   result.checks.push('emulated touch swipe changes image; vertical gesture leaves gallery unchanged');await mobile.close();
   // Slow resources in a fresh context. This is latency emulation, no physical network claim.
   const slow=await browser.newContext({viewport:{width:390,height:844}});const slowPage=await slow.newPage();
   await slowPage.route('**/*',async route=>{await delay(route.request().resourceType()==='image'?150:75);await route.continue();});
   await slowPage.goto(baseURL,{waitUntil:'networkidle'});await visible(slowPage,'home');await nav(slowPage,'catalog');await checkImages(slowPage);await slow.close();result.checks.push('clean session with resource latency and lazy image loading');
   assert.deepEqual(result.errors,[],'No console/page errors');assert.deepEqual(result.requests,[],'No broken requests');
   fs.rmSync(path.join(output,name+'-failure.png'),{force:true});
   result.screenshots=fs.readdirSync(output).filter(file=>file.startsWith(name+'-')&&file.endsWith('.png'));
   result.status='PASS';
  }catch(error){result.status='FAIL';result.failure=error.stack;if(page&&!page.isClosed()){result.lastURL=page.url();result.lastVisible=await page.locator('[data-view]:visible').getAttribute('data-view').catch(()=>null);await page.screenshot({path:path.join(output,name+'-failure.png'),fullPage:true}).catch(()=>{});}console.error(name,error.stack);}
  finally{if(browser)await browser.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
  console.log(`${name}: ${result.status} (${result.checks.length} check groups)`);
 }
 report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
 if(Object.values(report.engines).some(r=>r.status!=='PASS'))process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1;});
