#!/usr/bin/env python3
"""Pre-publish source/media invariants. Browser behavior is tested separately."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import hashlib
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
ERRORS = []
def must(ok, message):
    if not ok:
        ERRORS.append(message)

class Elements(HTMLParser):
    def __init__(self):
        super().__init__()
        self.resources, self.themes = [], []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('script', 'link', 'img'):
            src = a.get('src') or a.get('href')
            if src and not src.startswith(('http:', 'https:', '#', 'data:')):
                self.resources.append(src.split('?')[0].split('#')[0])
        if tag == 'button' and 'theme-btn' in a.get('class', '').split():
            self.themes.append(a.get('data-theme'))

html = (ROOT / 'index.html').read_text()
css = (ROOT / 'styles.css').read_text()
js = (ROOT / 'app.js').read_text()
parser = Elements()
parser.feed(html)
must(parser.themes == ['petrol', 'olive'], 'Theme buttons must be petrol first, olive second, exactly two')
must(not re.search(r"(?<!\$)\$\(['\"]\.theme-btn\[data-theme\]['\"]\)\.forEach", js), 'querySelector element cannot be iterated with forEach')
must("closest('[data-theme]')" not in js and 'closest("[data-theme]")' not in js, 'Generic theme delegation intercepts site navigation')
must('Secret de Maison' in html, 'Missing correct brand name')
must(not re.search(r'[\u2196-\u2199\u27a1\U0001f300-\U0001faff]', html + js), 'Emoji / Unicode arrow used as UI icon')
must('images.unsplash.com' not in html + js, 'Stock images cannot represent products')
must('object-fit:contain' in css.replace(' ', ''), 'Main product images need contain fit')
must('prefers-reduced-motion' in css, 'Missing reduced-motion support')
for filename in parser.resources:
    must((ROOT / filename).is_file(), 'Missing local HTML resource: ' + filename)
for color in ['#F3F1EC', '#4F6A6D', '#B5775C', '#C9B7A2', '#272A2D', '#F4EEDF', '#66705A', '#6B3E47', '#A7A59B', '#2D2623']:
    must(color.lower() in (html + css + js).lower(), 'Missing approved palette color: ' + color)

try:
    script = "const fs=require('node:fs'),vm=require('node:vm'); const c={}; vm.createContext(c); vm.runInContext(fs.readFileSync('products.js','utf8')+';this.result=PRODUCTS',c); process.stdout.write(JSON.stringify(c.result));"
    products = json.loads(subprocess.check_output(['node', '-e', script], cwd=ROOT, text=True))
except Exception as exc:
    products = []
    ERRORS.append('Cannot load products.js: ' + str(exc))
try:
    manifest = json.loads((ROOT / 'assets/products/manifest.json').read_text())
except Exception as exc:
    manifest = {}
    ERRORS.append('Cannot load photo manifest: ' + str(exc))
ids = [str(p.get('sku', '')) for p in products]
fixed = {'25271', '14318', '25115', '25442', '25186', '12828', '25090', '20606', '25015', '26065', '8301', '10085'}
must(len(products) == 20 and len(set(ids)) == 20, 'Expected exactly 20 unique official SKUs')
must(fixed <= set(ids), 'One of the first 12 fixed models has been replaced')
for p in products:
    sku = str(p.get('sku', ''))
    must(str(p.get('id')) == sku, 'Product id must use official SKU: ' + sku)
    must(p.get('name') and p.get('cat') and p.get('material') and p.get('finish'), 'Incomplete model/variant data: ' + sku)
    source = p.get('source', '')
    must(urlparse(source).netloc == 'secretdemaison.ru' and '/products/' in source, 'Nonofficial product source: ' + sku)
    must(isinstance(p.get('price'), (int, float)) and p['price'] > 0, 'Missing demonstrative calculation price: ' + sku)
    photos = p.get('photos') or [p.get('photo')]
    must(bool(photos) and p.get('photo') == photos[0], 'Main photo must be first gallery frame: ' + sku)
    record = manifest.get(sku, {})
    must(bool(record), 'Missing manifest record: ' + sku)
    must(source in json.dumps(record, ensure_ascii=False), 'Manifest does not identify official product page: ' + sku)
    seen = set()
    for photo in photos:
        filename = ROOT / str(photo).removeprefix('./')
        must(str(photo).startswith('./assets/products/') and filename.suffix == '.webp', 'Photo is not a local WebP: ' + sku)
        must(filename.is_file(), 'Missing photo: ' + str(photo))
        if not filename.is_file():
            continue
        data = filename.read_bytes()
        must(len(data) > 2000 and data[:4] == b'RIFF' and data[8:12] == b'WEBP', 'Invalid/empty WebP: ' + str(photo))
        digest = hashlib.sha256(data).hexdigest()
        must(digest not in seen, 'Duplicated gallery frame: ' + sku)
        seen.add(digest)
        evidence = json.dumps(record, ensure_ascii=False)
        must(str(photo).removeprefix('./') in evidence or filename.name in evidence, 'Manifest missing local photo mapping: ' + str(photo))
        must(digest in evidence, 'Manifest missing verified local photo hash: ' + str(photo))
    must('secretdemaison.ru/netcat_files/' in json.dumps(record), 'Manifest missing official image source: ' + sku)

print(f'Checked {len(products)} products, official SKU/source/media mappings, themes and local resources.')
if ERRORS:
    print('\n'.join('FAIL: ' + error for error in ERRORS))
    sys.exit(1)
print('PASS: source/media checks. This does not replace visual correspondence checks or browser QA.')
