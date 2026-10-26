'use strict';
/* Fast DOM regression smoke; browser_test.cjs supplies actual engine coverage. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = ['products.js', 'app.js'].map(p => fs.readFileSync(path.join(root,p), 'utf8')).join('\n');
function demo(savedState, hash='') {
 const instance = new JSDOM(html, { url: 'https://example.test/Test/'+hash, runScripts: 'outside-only', pretendToBeVisual: true });
 const browser = instance.window;
 browser.scrollTo = () => {};
 browser.HTMLElement.prototype.scrollIntoView = () => {};
 browser.matchMedia = () => ({matches:false,addEventListener(){},removeEventListener(){}});
 if (savedState) browser.localStorage.setItem('sm-demo-state',savedState);
 browser.eval(scripts + '\nwindow.__products=PRODUCTS;');
 return instance;
}
const dom = demo();
const {window} = dom, {document} = window;
const products = window.__products;
const find = s => {const e=document.querySelector(s);assert.ok(e,'Missing '+s);return e;};
// JSDOM click() omits the browser's preceding focus transfer on a real click.
const click = s => { const element=find(s);element.focus();element.click(); };
const shown = v => assert.equal(find(`[data-view="${v}"]`).hidden,false,v+' visible');
const money = s => Number(find(s).textContent.replace(/[^0-9]/g,''));
const enter = (selector,value) => {
 const input=find(selector);
 input.focus();input.value=String(value);
 input.dispatchEvent(new window.Event('input',{bubbles:true}));
 input.dispatchEvent(new window.Event('change',{bubbles:true}));
 input.blur();
};
const saved = () => JSON.parse(window.localStorage.getItem('sm-demo-state'));
function copies(id,quantity) {
 const controls=Array.from(document.querySelectorAll(`[data-card-cart="${id}"]`));
 assert.ok(controls.length>0,'Card cart controls exist for '+id);
 for (const control of controls) {
  if (quantity) {
   assert.equal(control.querySelector(`[data-card-input="${id}"]`)?.value,String(quantity),'Every card copy shows current quantity');
   assert.equal(control.querySelector(`[data-card-add="${id}"]`)?.hidden,true,'Add button hides while item is in cart');
   assert.equal(control.querySelector('.card-stepper')?.hidden,false,'Quantity stepper is shown');
  } else {
   assert.equal(control.querySelector(`[data-card-add="${id}"]`)?.hidden,false,'Empty card cart shows add button');
   assert.equal(control.querySelector('.card-stepper')?.hidden,true,'Removed item hides quantity stepper');
  }
 }
}
assert.equal(products.length,20);
assert.equal(find('#site').dataset.theme,'petrol');
assert.deepEqual(Array.from(document.querySelectorAll('.theme-btn'),e=>e.dataset.theme),['petrol','olive']);
for(const theme of ['olive','petrol']){
 click(`.theme-btn[data-theme="${theme}"]`);
 assert.equal(find('#site').dataset.theme,theme);
 for(const view of ['catalog','collections','journal','concept','cart']){
  click(`.menu [data-go="${view}"]`);shown(view);
  assert.equal(find('#site').dataset.theme,theme,'Navigation cannot change theme');
 }
}
click('.menu [data-go="catalog"]');
click('[data-reset="filters"]');
assert.equal(document.querySelectorAll('#catalogGrid .product-card').length,20);
const first=products[0],second=products[1];
const initialRoute=window.location.hash,initialTheme=find('#site').dataset.theme;
find(`#catalogGrid [data-card-add="${first.id}"]`).focus();
click(`#catalogGrid [data-card-add="${first.id}"]`);
shown('catalog');
assert.equal(window.location.hash,initialRoute,'Quick add cannot open product or navigate');
assert.equal(find('#site').dataset.theme,initialTheme,'Quick add cannot change theme');
assert.equal(find('#cartBadge').textContent,'1');
copies(first.id,1);
assert.equal(document.activeElement.dataset.cardInput,first.id,'Add preserves keyboard focus on the revealed quantity');
assert.ok(document.querySelector(`#featuredGrid [data-card-input="${first.id}"]`),'Home card shares catalog quantity');
click(`#catalogGrid [data-card-step="${first.id}"][data-delta="1"]`);
copies(first.id,2);
enter(`#catalogGrid [data-card-input="${first.id}"]`,3);
copies(first.id,3);
assert.equal(saved().cart[first.id],3,'Manual card quantity is persisted');
click(`#catalogGrid [data-card-step="${first.id}"][data-delta="1"]`);
copies(first.id,4);
assert.equal(find('#cartBadge').textContent,'4','Plus still works immediately after input blur');
for(let quantity=3;quantity>=0;quantity--){
 find(`#catalogGrid [data-card-step="${first.id}"][data-delta="-1"]`).focus();
 click(`#catalogGrid [data-card-step="${first.id}"][data-delta="-1"]`);
 copies(first.id,quantity);
}
assert.equal(document.activeElement.dataset.cardAdd,first.id,'Removing last item moves focus to the add button');
assert.equal(find('#cartBadge').textContent,'0');
assert.equal(saved().cart[first.id],undefined,'Minus at one removes item');
for(const p of [first,second]){
 click(`#catalogGrid [data-card-add="${p.id}"]`);
 shown('catalog');copies(p.id,1);
}
const firstCollection=Array.isArray(first.col)?first.col[0]:first.col;
click('.menu [data-go="collections"]');
click(`[data-choose-collection="${firstCollection}"]`);
assert.ok(document.querySelector(`#collectionGrid [data-card-input="${first.id}"]`),'Collection card shows quantity added in catalog');
copies(first.id,1);
click('.menu [data-go="catalog"]');
for(const p of [first,second]){
 click(`#catalogGrid [data-open-product="${p.id}"]`);shown('product');
 assert.ok(find('#detailSku').textContent.includes(p.sku));
 click('#addToCart');copies(p.id,2);
 click('.menu [data-go="catalog"]');
 copies(p.id,2);
 click(`#catalogGrid [data-card-step="${p.id}"][data-delta="-1"]`);
 copies(p.id,1);
}
click('.menu [data-go="cart"]');
assert.equal(find('#cartBadge').textContent,'2');
const input=find(`[data-cart-input="${first.id}"]`);
input.value='2';input.dispatchEvent(new window.Event('input',{bubbles:true}));
assert.equal(find('#cartUnits').textContent,'3');
assert.equal(money('#cartTotal'),first.price*2+second.price);
assert.equal(money(`[data-row-total="${first.id}"]`),first.price*2);
copies(first.id,2);
enter(`[data-cart-input="${first.id}"]`,4);
assert.equal(money('#cartTotal'),first.price*4+second.price);
click('.menu [data-go="catalog"]');
copies(first.id,4);
assert.equal(find(`#catalogGrid [data-card-input="${first.id}"]`).value,'4','Cart edits survive returning to catalog');
click(`#catalogGrid [data-card-step="${first.id}"][data-delta="1"]`);
copies(first.id,5);
click('.menu [data-go="cart"]');
assert.equal(money('#cartTotal'),first.price*5+second.price,'Quick plus updates row and order sums');
assert.equal(money(`[data-row-total="${first.id}"]`),first.price*5);
const restored=demo(window.localStorage.getItem('sm-demo-state'),'#/catalog');
assert.equal(restored.window.document.querySelector(`[data-card-input="${first.id}"]`).value,'5','Card quantity survives reload');
assert.equal(restored.window.document.querySelector('#cartBadge').textContent,'6','Two SKU cart survives reload');
assert.equal(restored.window.document.querySelector('#site').dataset.theme,initialTheme,'Theme survives cart actions and reload');
restored.window.close();
click(`[data-remove="${first.id}"]`);
click(`[data-remove="${second.id}"]`);
assert.equal(find('#cartUnits').textContent,'0');
assert.equal(money('#cartTotal'),0);
copies(first.id,0);copies(second.id,0);
click('.menu [data-go="catalog"]');
click(`#catalogGrid [data-card-add="${first.id}"]`);
enter(`#catalogGrid [data-card-input="${first.id}"]`,999);
const maximumPlus=find(`#catalogGrid [data-card-step="${first.id}"][data-delta="1"]`);
assert.equal(maximumPlus.disabled,true,'Plus is disabled at the quantity limit');maximumPlus.click();
copies(first.id,999);
enter(`#catalogGrid [data-card-input="${first.id}"]`,1);
click(`#catalogGrid [data-card-step="${first.id}"][data-delta="-1"]`);
copies(first.id,0);
// The direct category route with a single storage group renders its own grid.
const storage=products.find(p=>!p.sub);
if(storage){
 const category=demo(null,'#/category?cat='+encodeURIComponent(storage.cat));
 const categoryDoc=category.window.document;
 const add=categoryDoc.querySelector(`#categoryGrid [data-card-add="${storage.id}"]`);
 assert.ok(add,'Single-group category grid offers quick add');add.click();
 assert.equal(categoryDoc.querySelector(`#categoryGrid [data-card-input="${storage.id}"]`).value,'1');
 assert.equal(categoryDoc.querySelector('#cartBadge').textContent,'1');category.window.close();
}
console.log('PASS: 20 products, two themes, menu and PDP navigation; card add/plus/manual/blur/minus-to-zero, synchronized home/catalog/collection/category controls; two SKU cart sums, manual 1-to-2, cart-to-catalog sync and reload persistence.');
window.close();
