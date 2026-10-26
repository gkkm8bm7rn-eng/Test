'use strict';
/* Verify rendered product-card rows, wrapping and purchasing-state geometry.
 * Sequential browser engines avoid overloading the shared executor.
 * node scripts/card_layout_browser.cjs --base-url http://127.0.0.1:8765/ --screenshots
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,firefox,webkit}=require('playwright');
const args=process.argv.slice(2),arg=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const baseURL=arg('--base-url','http://127.0.0.1:8765/'),output=arg('--output','/tmp/sdm-card-layout-qa');
const engines=arg('--engines','chromium,firefox,webkit').split(','),screenshots=args.includes('--screenshots'),forceFallback=args.includes('--force-fallback');
const widths=arg('--widths','320,360,375,390,430,511,600,768,820,913,1024,1280,1440,1920,2560').split(',').map(Number);
fs.mkdirSync(output,{recursive:true});
const report={baseURL,forceFallback,physicalDevices:false,startedAt:new Date().toISOString(),textScales:[1,1.5,2],widths,engines:{}};
const roles=['photo','meta','name','price','sku','cart'];
const frames=async page=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))});
async function scaleText(page,scale){
 await page.evaluate(scale=>{
  for(const el of document.querySelectorAll('[data-qa-font]')){el.style.removeProperty('font-size');el.removeAttribute('data-qa-font')}
  document.documentElement.style.removeProperty('font-size');
  const nodes=[...document.querySelectorAll('[data-view]:not([hidden]) .product-card *')].filter(el=>el.matches('input')||[...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim()));
  const sizes=nodes.map(el=>({el,size:parseFloat(getComputedStyle(el).fontSize)}));
  if(scale!==1){document.documentElement.style.fontSize=16*scale+'px';for(const {el,size} of sizes){el.style.setProperty('font-size',size*scale+'px','important');el.setAttribute('data-qa-font','true')}}
 },scale);await frames(page);
}
async function geometry(page,selector){
 return page.locator(selector).evaluate(grid=>{
  const failures=[],slots=['photo','meta','name','price','sku','cart'],cards=[...grid.querySelectorAll(':scope > .product-card')],result=[];
  const rect=el=>{const r=el.getBoundingClientRect();return {top:r.top+scrollY,bottom:r.bottom+scrollY,left:r.left,right:r.right,width:r.width,height:r.height}};
  const visible=el=>el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  for(const card of cards){
   const id=card.dataset.sku,children=[...card.children],box=rect(card);if(children.length!==6){failures.push(id+': expected six direct slots');continue}
   const computed=getComputedStyle(card);ctx.clearRect(0,0,1,1);ctx.fillStyle=computed.backgroundColor;ctx.fillRect(0,0,1,1);const rgb=[...ctx.getImageData(0,0,1,1).data];
   if(rgb[3]<250||(rgb[0]+rgb[1]+rgb[2])/3<200)failures.push(id+': full card background must be opaque and pale: '+computed.backgroundColor);
   const rows=children.map(rect);result.push({id,box,slots:rows,background:computed.backgroundColor});
   if(card.scrollWidth>card.clientWidth+1)failures.push(id+': card horizontal overflow');
   const image=children[0].querySelector('img');if(!image||getComputedStyle(image).objectFit!=='contain')failures.push(id+': product photo is not contained');
   for(let i=0;i<children.length;i++){
    const el=children[i],b=rows[i];
    if(b.left<box.left-1||b.right>box.right+1||b.top<box.top-1||b.bottom>box.bottom+1)failures.push(id+': '+slots[i]+' escapes card bounds');
    if(i>0&&b.top<rows[i-1].bottom-1)failures.push(id+': '+slots[i]+' overlaps preceding slot');
    if(el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1)failures.push(id+': '+slots[i]+' content overflow');
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node;
    while(node=walker.nextNode()){
     if(!node.textContent.trim()||!visible(node.parentElement))continue;
     const range=document.createRange();range.selectNodeContents(node);
     for(const line of range.getClientRects()){
      if(line.width<.1||line.height<.1)continue;
      if(line.left<box.left-1.25||line.right>box.right+1.25||line.top+scrollY<box.top-1.25||line.bottom+scrollY>box.bottom+1.25)failures.push(id+': text leaves card: '+node.textContent.trim());
      for(let ancestor=node.parentElement;ancestor&&ancestor!==card;ancestor=ancestor.parentElement){const style=getComputedStyle(ancestor);if(/hidden|clip/.test(style.overflowX+' '+style.overflowY)){const clip=ancestor.getBoundingClientRect();if(line.left<clip.left-1.25||line.right>clip.right+1.25||line.top<clip.top-1.25||line.bottom>clip.bottom+1.25)failures.push(id+': text clipped by '+ancestor.className)}}
     }
    }
   }
   for(const control of card.querySelectorAll('[data-card-cart] button,[data-card-input]')){
    if(!visible(control))continue;const c=rect(control);if(control.tagName==='BUTTON'&&(c.width<43.5||c.height<43.5))failures.push(id+': purchase touch target below44px');
    if(control.matches('input')){const style=getComputedStyle(control);ctx.font=style.font||`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;const available=control.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);if(ctx.measureText(control.value).width>available+1)failures.push(id+': numeric value clipped: '+control.value)}
   }
  }
  const groups=[];for(const card of result){let group=groups.find(group=>Math.abs(group[0].slots[0].top-card.slots[0].top)<=1);if(!group){group=[];groups.push(group)}group.push(card)}
  let maxDelta=0;for(const group of groups){if(group.length<2)continue;for(let i=0;i<6;i++){for(const edge of ['top','bottom']){const values=group.map(card=>card.slots[i][edge]),delta=Math.max(...values)-Math.min(...values);maxDelta=Math.max(maxDelta,delta);if(delta>1.05)failures.push('row '+group.map(card=>card.id).join(',')+': '+slots[i]+'.'+edge+' spread '+delta.toFixed(3)+'px')}}}
  const pageWidth=innerWidth,pageOverflow=Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-pageWidth;if(pageOverflow>1)failures.push('page horizontal overflow '+pageOverflow+'px');
  return {cards:result,rows:groups.map(group=>group.map(card=>card.id)),maxDelta,failures:[...new Set(failures)],pageWidth};
 });
}
async function verify(page,selector,label,result){await frames(page);const data=await geometry(page,selector);assert.ok(data.cards.length>0,label+': no cards');assert.deepEqual(data.failures,[],label+'\n'+data.failures.join('\n'));result.measurements.push({label,cards:data.cards.length,rows:data.rows.length,maxDelta:data.maxDelta});return data}
function stableSlots(before,after,label){for(const card of before.cards){const current=after.cards.find(item=>item.id===card.id);assert.ok(current,label+': card missing');for(let i=0;i<6;i++)for(const edge of ['top','bottom'])assert.ok(Math.abs(card.slots[i][edge]-current.slots[i][edge])<=1.05,`${label}: ${card.id} ${roles[i]}.${edge} jumped`)}}
async function loadedImages(page,selector){for(const img of await page.locator(selector+' img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode())}await page.evaluate(()=>scrollTo(0,0))}
async function run(engine){
 const result=report.engines[engine]={measurements:[],checks:[],errors:[],httpFailures:[],screenshots:[]};let browser,page;
 try{
  browser=await({chromium,firefox,webkit}[engine]).launch({headless:true,executablePath:engine==='webkit'?process.env.SDM_WEBKIT_EXECUTABLE||undefined:engine==='firefox'?process.env.SDM_FIREFOX_EXECUTABLE||undefined:undefined,args:engine==='chromium'?['--no-sandbox']:[]});result.version=browser.version();
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  if(forceFallback){
   await context.addInitScript(()=>{const native=CSS.supports.bind(CSS);CSS.supports=(...args)=>args.length===2&&args[0]==='grid-template-rows'&&args[1]==='subgrid'?false:native(...args)});
   await context.route('**/styles.css*',async route=>{const response=await route.fetch(),body=await response.text();const transformed=body.replace(/@supports\s*\(\s*grid-template-rows\s*:\s*subgrid\s*\)/g,'@supports (grid-template-rows:__qa_unsupported_subgrid__)');assert.notEqual(transformed,body,'Actual subgrid feature query must be intercepted');await route.fulfill({response,body:transformed})});
  }
  page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)result.httpFailures.push({status:r.status(),url:r.url()})});
  const shown=async view=>{await page.locator(`[data-view="${view}"]`).waitFor({state:'visible'});if(engine==='webkit')await page.waitForTimeout(120)};
  const nav=async view=>{await scaleText(page,1);await page.locator(`.menu [data-go="${view}"]`).click();await shown(view)};
  const home=async()=>{await scaleText(page,1);await page.locator('.logo').first().click();await shown('home')};
  const catalog=async()=>{await nav('catalog');await page.locator('[data-view="catalog"] [data-reset="filters"]').first().click();await frames(page)};
  const storage=async()=>{await nav('categories');await page.locator('#categoryTiles [data-browse-cat="Хранение"]').click();await shown('catalog')};
  const capture=async(selector,name)=>{if(!screenshots)return;await loadedImages(page,selector);await page.locator(selector).screenshot({path:path.join(output,name+'.png')});result.screenshots.push(name+'.png')};
  await page.goto(baseURL,{waitUntil:'networkidle'});result.subgridSupported=await page.evaluate(()=>CSS.supports('grid-template-rows','subgrid'));assert.equal(result.subgridSupported,!forceFallback,'Expected native subgrid or explicitly forced fallback');if(forceFallback){await page.waitForFunction(()=>document.querySelector('#featuredGrid')?.dataset.cardRowFallback==='true');assert.equal(await page.locator('#featuredGrid .product-card').first().evaluate(el=>getComputedStyle(el).display),'flex');}
  for(const theme of ['petrol','olive']){
   await page.locator(`.theme-btn[data-theme="${theme}"]`).click();
   for(const width of widths){
    await scaleText(page,1);await page.setViewportSize({width,height:width<600?844:1000});
    for(const view of ['home','catalog','collections','storage']){
     let selector;if(view==='home'){await home();selector='#featuredGrid'}else if(view==='catalog'){await catalog();selector='#catalogGrid'}else if(view==='storage'){await storage();selector='#catalogGrid'}else{await nav('collections');selector='#collectionGrid'}
     for(const scale of [1,1.5,2]){await scaleText(page,scale);await verify(page,selector,`${engine}/${theme}/${width}/${view}/text${scale}`,result)}
     await scaleText(page,1);
     if(view==='home'&&[390,430].includes(width)){
      const natural=await verify(page,selector,`${engine}/${theme}/${width}/natural-user-pairs`,result);for(const pair of [['20606','10085'],['20462','25947']])assert.ok(natural.rows.some(row=>pair.every(id=>row.includes(id))),'User screenshot pair must share its natural home row: '+pair.join(','));await capture(selector,`${engine}-${theme}-${width}-home-user-pairs`);
     }
     if(view==='catalog'&&[320,820,1440].includes(width))await capture(selector,`${engine}-${theme}-${width}-catalog`);
    }
   }
   // Purchase changes may alter controls, but must not shift their row's typography.
   for(const width of [390,1440]){
    await page.setViewportSize({width,height:1000});await home();
    for(const scale of [1,2]){
     await scaleText(page,scale);const selector='#featuredGrid',first=page.locator(selector+' [data-card-cart]').first(),id=await first.getAttribute('data-card-cart');
     if(await first.locator('[data-card-add]').isHidden()){await first.locator('[data-card-input]').fill('1');await first.locator('[data-card-step][data-delta="-1"]').click()}
     const baseline=await verify(page,selector,`${engine}/${theme}/${width}/state/text${scale}/empty`,result);
     await first.locator('[data-card-add]').click();let current=await verify(page,selector,`${engine}/${theme}/${width}/state/text${scale}/added`,result);stableSlots(baseline,current,'Add');
     await first.locator('[data-card-input]').fill('999');await first.locator('[data-card-input]').blur();current=await verify(page,selector,`${engine}/${theme}/${width}/state/text${scale}/999`,result);stableSlots(baseline,current,'999');
     await first.locator('[data-card-input]').fill('3');await first.locator('[data-card-input]').blur();current=await verify(page,selector,`${engine}/${theme}/${width}/state/text${scale}/manual3`,result);stableSlots(baseline,current,'Manual3');
     await first.locator('[data-card-input]').fill('1');await first.locator('[data-card-step][data-delta="-1"]').click();await verify(page,selector,`${engine}/${theme}/${width}/state/text${scale}/removed`,result);assert.ok(await page.locator(selector+` [data-card-add="${id}"]`).isVisible());
    }
   }
   await scaleText(page,1);await catalog();await page.locator('#sortSelect').selectOption('low');await verify(page,'#catalogGrid',engine+'/'+theme+'/sorted-low',result);
   await page.locator('#catFilters [data-filter="cat"][data-value="Мягкая мебель"]').click();await verify(page,'#catalogGrid',engine+'/'+theme+'/filtered',result);
   await page.locator('#sortSelect').selectOption('high');await verify(page,'#catalogGrid',engine+'/'+theme+'/filtered-high',result);
   await home();const before=await verify(page,'#featuredGrid',engine+'/'+theme+'/fonts-ready',result);await frames(page);stableSlots(before,await geometry(page,'#featuredGrid'),'System fonts settle');
   const swap=await page.addStyleTag({content:'.product-card,.product-card * {font-family:"DejaVu Sans",Arial,sans-serif!important}'});await verify(page,'#featuredGrid',engine+'/'+theme+'/font-metrics-swap',result);await swap.evaluate(el=>el.remove());
   result.checks.push(theme+': natural product rows aligned in all contexts; 100/150/200% text; state changes and fonts/filter/sort verified');
  }
  assert.deepEqual(result.errors,[],'No JavaScript errors');assert.deepEqual(result.httpFailures,[],'No failed HTTP resources');fs.rmSync(path.join(output,engine+'-failure.png'),{force:true});result.status='PASS';
 }catch(e){result.status='FAIL';result.failure=e.stack;if(page&&!page.isClosed()){result.lastURL=page.url();await page.screenshot({path:path.join(output,engine+'-failure.png'),fullPage:true}).catch(()=>{})}console.error(engine,e.stack)}
 finally{if(browser)await browser.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n')}console.log(engine,result.status,'measurements',result.measurements.length);
}
(async()=>{for(const engine of engines)await run(engine);report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');if(Object.values(report.engines).some(e=>e.status!=='PASS'))process.exitCode=1})().catch(e=>{console.error(e);process.exitCode=1});
