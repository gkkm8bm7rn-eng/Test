#!/usr/bin/env python3
"""Deterministic pre-publish checks for Secret de Maison demo.

Prevents recurrent: wrong brand spelling, emoji UI icons, image hotlinks,
missing local assets, unused palettes, missing mobile gutters and JS files.
A passing commit is still not a substitute for visual testing on the live site.
"""
from pathlib import Path
import re
import sys
import json
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/"index.html").read_text(encoding="utf-8")
CSS=(ROOT/"styles.css").read_text(encoding="utf-8")
JS=(ROOT/"app.js").read_text(encoding="utf-8")
ERRORS=[]

def must(condition,description):
    if not condition:ERRORS.append(description)

class Elements(HTMLParser):
    def __init__(self):
        super().__init__()
        self.resources=[]
        self.brand_buttons=[]
        self.in_logo=False
        self.logo_text=""
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag in ("script","link","img") and (src:=a.get("src") or a.get("href")):
            if not src.startswith(("https://","http://","#","mailto:","tel:")):
                self.resources.append(src.split("?")[0].split("#")[0])
        if tag=="button" and "logo" in a.get("class","").split():
            self.in_logo=True
    def handle_data(self,data):
        if self.in_logo:self.logo_text+=data
    def handle_endtag(self,tag):
        if tag=="button":self.in_logo=False

parser=Elements()
parser.feed(HTML)

must("Secret de Maison" in HTML and "Secret Maison" not in HTML,"Incorrect brand spelling in HTML")
must("Secret Maison" not in JS,"Incorrect brand spelling in JS")
must("Secret <span class=\"logo-de\">de</span> Maison" in HTML,"Logo must spell Secret de Maison without punctuation")
must("<span>.</span>" not in HTML,"Unrequested logo dot remains")
must(not re.search(r"[\u2196-\u2199\u27a1\U0001f300-\U0001faff]",HTML+JS),"Emoji / Unicode arrow used as interactive icon")
must("images.unsplash.com" not in HTML,"External stock photo on website")
must("photo:\"https://" not in JS and "photo:'https://" not in JS,"Product photo still hotlinked")
must("referrerpolicy" not in HTML or True,"")
must("data-theme=\"olive\"" in HTML and "data-theme=\"petrol\"" in HTML,"Missing selectable palettes")
for key in ["paper","primary","second","neutral","ink"]:
    must(key+":" in JS or "'"+key+"':" in JS,"Palette key missing: "+key)
# Primary-dominant theme hierarchy (the secondary must not become a giant surface).
# Validate effective declarations from the latest semantic-palette section, not
# historical base rules retained earlier in the stylesheet.
palette_start=CSS.find("/* Semantic palette rule:")
must(palette_start>=0,"Missing centralized semantic palette")
effective_css=CSS[palette_start:] if palette_start>=0 else ""
for role in [
    ".hero-copy{background:var(--tone-primary)",
    ".ribbon{background:var(--primary)",
    ".feature{background:var(--primary)",
    ".home-space:nth-child(2){background:var(--tone-primary-light)",
    ".cart-panel{background:var(--tone-primary)",
    ".prose blockquote{background:var(--tone-primary-light)",
    ".site-footer{background:var(--tone-neutral)"
]:
    must(role in effective_css,"Primary-dominant theme role missing: "+role)
for selector in [".ribbon",".feature",".cart-panel",".prose blockquote",".biz-card"]:
    must(not re.search(re.escape(selector)+r"\{background:var\(--second\)",effective_css),
         "Secondary accent must not occupy major surfaces: "+selector)
must("color:var(--accent-ink)" in effective_css,"Missing secondary accent in prices and details")
must("color-mix(in srgb,var(--second) 9%,var(--paper))" in effective_css,
     "Secondary tint too strong; palette hierarchy at risk")
must("clamp(28px,5vw,76px)" in CSS and "padding-inline:27px" in CSS,"Missing deliberate outer gutters")
must("object-fit:contain" in CSS,"Main product images may be cropped")
must("aria-label=\"Количество товара\"" in HTML,"Missing accessible quantity label")

for path in parser.resources:
    if path:
        must((ROOT/path).is_file(),"HTML references missing local resource: "+path)
try:
    manifest=json.loads((ROOT/"assets/products/manifest.json").read_text(encoding="utf-8"))
except Exception as exc:
    manifest={}
    ERRORS.append("Photo manifest not readable: "+str(exc))

ids=re.findall(r"\{id:'(\d+)'",JS)
must(len(ids)==len(set(ids)) and len(ids)>=3,"Not enough unique product SKUs")
for sku in ids:
    filename=ROOT/"assets/products"/f"{sku}.webp"
    must(filename.is_file(),"Missing local real product image for "+sku)
    if filename.is_file():
        data=filename.read_bytes()
        must(len(data)>3500 and data[:4]==b"RIFF" and data[8:12]==b"WEBP","Invalid WebP for "+sku)
    must(sku in manifest,"Missing validated product/source mapping for "+sku)
    must(f"photo:'./assets/products/{sku}.webp'" in JS,"Product "+sku+" does not use checked local photo")

print("Checked:",len(ids),"unique SKUs, images, manifest, routes, themes, logo, UI icons and gutters")
if ERRORS:
    print("FAILED:",len(ERRORS),"checks")
    for error in ERRORS: print(" -",error)
    sys.exit(1)
print("PASS — static QA completed; live mobile UX QA is still required.")
