'use strict';
/* Focused real-browser regression for buying and editing quantities in product grids.
 * node scripts/card_cart_browser.cjs --base-url http://127.0.0.1:8765/ --screenshots
 * Uses the same script against the deployed GitHub Pages URL after publication. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {chromium,firefox,webkit}=require('playwright');
const args=process.argv.slice(2),arg=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const baseURL=arg('--base-url','http://127.0.0.1:8765/');
const output=arg('--output','/tmp/sdm-card-cart-qa');
const engines=arg('--engines','chromium,firefox,webkit').split(',');
const screenshots=args.includes('--screenshots');
const model={};vm.createContext(model);vm.runInContext(fs.readFileSync(path.join(__dirname,'../products.js'),'utf8')+';this.products=PRODUCTS;',model);
const products=JSON.parse(JSON.stringify(model.products));
const primary=products.find(p=>p.id==='25271'),second=products.find(p=>p.id!==primary.id),storage=products.find(p=>p.cat==='Хранение');
fs.mkdirSync(output,{recursive:true});
const report={baseURL,physicalDevices:false,startedAt:new Date().toISOString(),engines:{}};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const money=text=>Number(text.replace(/[^0-9]/g,''));
async function run(engine){
 const result=report.engines[engine]={checks:[],errors:[],httpFailures:[],screenshots:[]};
 let browser,page;
 try{
  browser=await({chromium,firefox,webkit}[engine]).launch({headless:true,executablePath:engine==='webkit'?process.env.SDM_WEBKIT_EXECUTABLE||undefined:engine==='firefox'?process.env.SDM_FIREFOX_EXECUTABLE||undefined:undefined,args:engine==='chromium'?['--no-sandbox']:[]});
  result.version=browser.version();
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});page=await context.newPage();
  page.on('pageerror',error=>result.errors.push(error.message));page.on('console',message=>{if(message.type()==='error')result.errors.push(message.text())});
  page.on('response',response=>{if(response.status()>=400)result.httpFailures.push({url:response.url(),status:response.status()})});
  const shown=async view=>{await page.locator(`[data-view="${view}"]`).waitFor({state:'visible'});if(engine==='webkit')await pause(120);};
  const nav=async view=>{await page.locator(`.menu [data-go="${view}"]`).click();await shown(view);};
  const catalog=async()=>{await nav('catalog');await page.locator('[data-view="catalog"] [data-reset="filters"]').first().click();if(engine==='webkit')await pause(120);};
  const box=(id,scope='#catalogGrid')=>page.locator(`${scope} [data-card-cart="${id}"]`);
  const input=(id,scope='#catalogGrid')=>box(id,scope).locator('[data-card-input]');
  const step=(id,delta,scope='#catalogGrid')=>box(id,scope).locator(`[data-card-step][data-delta="${delta}"]`);
  const add=(id,scope='#catalogGrid')=>box(id,scope).locator('[data-card-add]');
  const samePage=async(url,palette)=>{assert.equal(page.url(),url,'Card purchase controls cannot navigate');assert.equal(await page.locator('#site').getAttribute('data-theme'),palette,'Card controls cannot select themes');};
  const copies=async(id,qty)=>{
   const values=await page.locator(`[data-card-cart="${id}"]`).evaluateAll(elements=>elements.map(el=>({addHidden:el.querySelector('[data-card-add]').hidden,stepHidden:el.querySelector('.card-stepper').hidden,value:el.querySelector('[data-card-input]').value})));
   assert.ok(values.length>0,'Rendered card copies exist');for(const value of values){assert.equal(value.addHidden,qty>0);assert.equal(value.stepHidden,qty===0);if(qty>0)assert.equal(Number(value.value),qty,'All rendered copies stay in sync');}
  };
  const overflow=async(label)=>{
   const data=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth}));assert.ok(data.document<=data.width+1&&data.body<=data.width+1,`${label}: page overflow ${JSON.stringify(data)}`);
   const controls=await page.locator('[data-view]:visible [data-card-cart]').evaluateAll(els=>els.map(el=>({id:el.dataset.cardCart,width:el.clientWidth,content:el.scrollWidth})));for(const control of controls)assert.ok(control.content<=control.width+1,`${label}: quantity controls overflow card ${JSON.stringify(control)}`);
  };
  const capture=async name=>{if(!screenshots)return;for(const image of await page.locator('[data-view]:visible img').all()){await image.scrollIntoViewIfNeeded();await image.evaluate(el=>el.decode());}await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});result.screenshots.push(name+'.png');};
  await page.goto(baseURL,{waitUntil:'networkidle'});await shown('home');assert.equal(await page.locator('#site').getAttribute('data-theme'),'petrol');
  for(const palette of ['petrol','olive']){
   await page.locator(`.theme-btn[data-theme="${palette}"]`).click();
   await nav('cart');while(await page.locator('[data-remove]').count())await page.locator('[data-remove]').first().click();
   await catalog();const url=page.url();
   await add(primary.id).click();await samePage(url,palette);await copies(primary.id,1);assert.equal(await page.locator('#cartBadge').textContent(),'1');
   assert.deepEqual(await page.evaluate(()=>({id:document.activeElement?.dataset.cardStep,delta:document.activeElement?.dataset.delta,isInput:document.activeElement?.matches('input')})),{id:primary.id,delta:'1',isInput:false},'Adding focuses plus without opening numeric input');
   await page.keyboard.press('Enter');await copies(primary.id,2);
   await input(primary.id).fill('3');await copies(primary.id,3);assert.equal(await page.locator('#cartBadge').textContent(),'3');
   // The click blurs the input. It must still reach the plus button exactly once.
   await step(primary.id,1).click();await copies(primary.id,4);await samePage(url,palette);
   await step(primary.id,1).dblclick({delay:40});await copies(primary.id,6);
   for(let count=6;count>0;count--)await step(primary.id,-1).click();
   await copies(primary.id,0);assert.ok(await add(primary.id).isVisible());assert.equal(await page.locator('#cartBadge').textContent(),'0');
   assert.equal(await page.evaluate(()=>document.activeElement?.dataset.cardAdd),primary.id,'Removing the last unit restores focus to add');
   await add(primary.id).dblclick({delay:40});await copies(primary.id,1);
   await step(primary.id,-1).dblclick({delay:40});await copies(primary.id,0);assert.ok(await add(primary.id).isVisible(),'Fast minus at one must not re-add the item');
   result.checks.push(`${palette}: add without navigation/theme interception, plus, manual 3, blur plus, keyboard Enter on plus, fast plus/add/minus double clicks, decrement-to-zero and focus`);
   await add(primary.id).click();
   await page.locator('.logo').first().click();await shown('home');await copies(primary.id,1);
   await step(primary.id,1,'#featuredGrid').click();await copies(primary.id,2);
   await nav('collections');
   const collection=Array.isArray(primary.col)?primary.col[0]:primary.col;await page.locator(`[data-choose-collection="${collection}"]`).click();
   await input(primary.id,'#collectionGrid').fill('3');await step(primary.id,1,'#collectionGrid').click();await copies(primary.id,4);
   await nav('categories');await page.locator(`#categoryTiles [data-browse-cat=${JSON.stringify(storage.cat)}]`).click();await shown('catalog');
   await add(storage.id).click();await copies(storage.id,1);await input(storage.id).fill('2');await copies(storage.id,2);
   await nav('cart');assert.equal(await page.locator('[data-cart-row]').count(),2);assert.equal(money(await page.locator('#cartTotal').textContent()),4*primary.price+2*storage.price);
   await page.locator(`[data-cart-input="${primary.id}"]`).fill('5');assert.equal(money(await page.locator('#cartTotal').textContent()),5*primary.price+2*storage.price);
   await catalog();await copies(primary.id,5);await copies(storage.id,2);
   await page.reload({waitUntil:'networkidle'});await shown('catalog');await copies(primary.id,5);await copies(storage.id,2);assert.equal(await page.locator('#cartBadge').textContent(),'7');assert.equal(await page.locator('#site').getAttribute('data-theme'),palette);
   result.checks.push(`${palette}: shared quantity across home/catalog/collections/storage, two-SKU totals, cart edit back to catalog and reload persistence`);
   await input(primary.id).fill('999');await input(primary.id).blur();assert.ok(await step(primary.id,1).isDisabled());await copies(primary.id,999);
   await input(primary.id).fill('5');await input(primary.id).blur();
   // A keyboard action makes :focus-visible applicable; the outline must remain visible.
   await input(primary.id).focus();await page.keyboard.press('ArrowRight');
   const focus=await input(primary.id).evaluate(el=>({focused:document.activeElement===el,visible:el.matches(':focus-visible'),outline:getComputedStyle(el).outlineStyle,width:parseFloat(getComputedStyle(el).outlineWidth)}));assert.ok(focus.focused&&focus.visible&&focus.outline!=='none'&&focus.width>=1,'Visible keyboard focus on quantity');
   for(const width of [320,390,820,1440]){
    await page.setViewportSize({width,height:width<600?844:1000});
    for(const view of ['home','catalog','collections','storage','cart']){
     if(view==='home'){await page.locator('.logo').first().click();await shown('home');}
     else if(view==='catalog')await catalog();
     else if(view==='storage'){await nav('categories');await page.locator(`#categoryTiles [data-browse-cat=${JSON.stringify(storage.cat)}]`).click();await shown('catalog');}
     else await nav(view);
     await overflow(`${engine}/${palette}/${width}/${view}`);
     if(['catalog','home','collections'].includes(view)){
      const scope=view==='catalog'?'#catalogGrid':view==='home'?'#featuredGrid':'#collectionGrid';
      await copies(primary.id,5);assert.equal(await input(primary.id,scope).inputValue(),'5');
     }
     if(['catalog','cart'].includes(view))await capture(`${engine}-${palette}-${width}-${view}`);
    }
   }
   await page.setViewportSize({width:1440,height:1000});result.checks.push(`${palette}: max quantity, visible keyboard focus, card-contained controls and no page overflow at 320/390/820/1440 across five views`);
  }
  assert.deepEqual(result.errors,[],'No JS or console errors');assert.deepEqual(result.httpFailures,[],'No failed HTTP resources');result.status='PASS';
 }catch(error){result.status='FAIL';result.failure=error.stack;if(page&&!page.isClosed()){result.lastURL=page.url();await page.screenshot({path:path.join(output,engine+'-failure.png'),fullPage:true}).catch(()=>{})}console.error(engine,error.stack)}
 finally{if(browser)await browser.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n')}
 console.log(`${engine}: ${result.status}`);
}
(async()=>{for(const engine of engines)await run(engine);report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');if(Object.values(report.engines).some(result=>result.status!=='PASS'))process.exitCode=1})().catch(error=>{console.error(error);process.exitCode=1});
