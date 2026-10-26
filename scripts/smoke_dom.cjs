'use strict';
/* Exercise live UI behavior against the real HTML and app.js in a DOM emulator.
 * This catches event propagation, navigation, product, filter and cart regressions.
 * It does not replace visual browser checks on iOS. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const dom = new JSDOM(html, { url: 'https://example.test/', runScripts: 'outside-only' });
const window = dom.window;
const document = window.document;
window.scrollTo = () => {};
window.eval(js);

const find = selector => {
  const el = document.querySelector(selector);
  assert.ok(el, 'Missing element: ' + selector);
  return el;
};
const click = selector => find(selector).click();
const shown = view => assert.equal(find('[data-view="' + view + '"]').hidden, false, view + ' must be visible');

assert.equal(document.querySelectorAll('.theme-btn[data-theme]').length, 2);
assert.equal(document.querySelectorAll('.product-card').length, 4, 'Featured items');
click('.menu [data-go="catalog"]');
shown('catalog');
assert.match(find('#resultCount').textContent, /5 предметов/);
click('#catFilters [data-filter="cat"][data-value="Кресла"]');
assert.match(find('#resultCount').textContent, /1 предмет/);
click('#catalogGrid .product-photo-link[data-open-product="13167"]');
shown('product');
assert.match(find('#detailName').textContent, /Осло/);

click('#addToCart');
assert.equal(find('#cartBadge').textContent, '1');
click('.menu [data-go="cart"]');
shown('cart');
assert.equal(find('#cartUnits').textContent, '1');
const qty = find('[data-cart-input="13167"]');
qty.value = '2';
qty.dispatchEvent(new window.Event('input', { bubbles: true }));
assert.equal(find('#cartUnits').textContent, '2');
assert.equal(Number(find('#cartTotal').textContent.replace(/[^0-9]/g, '')), 76440);

click('.theme-btn[data-theme="petrol"]');
assert.equal(find('#site').dataset.theme, 'petrol');
assert.equal(find('.theme-btn[data-theme="petrol"]').getAttribute('aria-pressed'), 'true');
click('.menu [data-go="journal"]');
shown('journal');
click('.menu [data-go="concept"]');
shown('concept');
click('.menu [data-go="collections"]');
shown('collections');
assert.ok(document.querySelectorAll('#collectionGrid .product-card').length >= 1);

console.log('PASS: both themes, five real SKUs, main navigation, photo links, filters, product details, cart 1→2, collections and editorial pages');
window.close();
