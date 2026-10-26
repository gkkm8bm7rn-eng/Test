'use strict';
/* Fast DOM regression smoke; browser_test.cjs supplies actual engine coverage. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = ['products.js', 'app.js'].map(p => fs.readFileSync(path.join(root,p), 'utf8')).join('\n');
const dom = new JSDOM(html, { url: 'https://example.test/Test/', runScripts: 'outside-only', pretendToBeVisual: true });
const {window} = dom, {document} = window;
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};
window.matchMedia = () => ({matches:false,addEventListener(){},removeEventListener(){}});
window.eval(scripts + '\nwindow.__products=PRODUCTS;');
const products = window.__products;
const find = s => {const e=document.querySelector(s);assert.ok(e,'Missing '+s);return e;};
const click = s => find(s).click();
const shown = v => assert.equal(find(`[data-view="${v}"]`).hidden,false,v+' visible');
const money = s => Number(find(s).textContent.replace(/[^0-9]/g,''));
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
for(const p of products.slice(0,2)){
 click(`#catalogGrid [data-open-product="${p.id}"]`);shown('product');
 assert.ok(find('#detailSku').textContent.includes(p.sku));
 click('#addToCart');
 click('.menu [data-go="catalog"]');
}
click('.menu [data-go="cart"]');
assert.equal(find('#cartBadge').textContent,'2');
const first=products[0],second=products[1];
const input=find(`[data-cart-input="${first.id}"]`);
input.value='2';input.dispatchEvent(new window.Event('input',{bubbles:true}));
assert.equal(find('#cartUnits').textContent,'3');
assert.equal(money('#cartTotal'),first.price*2+second.price);
assert.equal(money(`[data-row-total="${first.id}"]`),first.price*2);
click(`[data-remove="${first.id}"]`);
click(`[data-remove="${second.id}"]`);
assert.equal(find('#cartUnits').textContent,'0');
assert.equal(money('#cartTotal'),0);
console.log('PASS: 20 products, two themes, actual menu clicks, PDP SKU, cart two SKU and manual 1-to-2 totals.');
window.close();
