#!/usr/bin/env python3
"""Validate or restore the current manifest's official media, without changing SKU selection.

Default: verify all existing images; download only missing images from the exact
recorded official URL. Existing bytes with a hash mismatch are never overwritten.
A changed remote source hash requires manual source/visual review, not fallback media.
Pillow is needed only to restore a missing image. Run from any working directory.
"""
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen
import hashlib
import io
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
manifest_path = ROOT / 'assets/products/manifest.json'
manifest = json.loads(manifest_path.read_text())
errors = []
changed = False
for sku, product in manifest.items():
    # The manifest is the reviewed assortment. Never replace it with a legacy hardcoded list.
    for frame in product.get('photos', []):
        filename = ROOT / frame['path'].removeprefix('./')
        if filename.is_file():
            payload = filename.read_bytes()
            if hashlib.sha256(payload).hexdigest() != frame['sha256']:
                errors.append(f'{sku}: checksum mismatch; original retained: {filename.name}')
            elif not (payload[:4] == b'RIFF' and payload[8:12] == b'WEBP'):
                errors.append(f'{sku}: invalid WebP: {filename.name}')
            else:
                print(f'Verified {sku}: {filename.name}')
            continue
        if frame.get('originReference') or frame.get('referenceRepository') or product.get('referenceRepository'):
            errors.append(f'{sku}: restore verified reference asset from git; external private reference requires source review')
            continue
        source = frame.get('source', '')
        if urlparse(source).netloc != 'secretdemaison.ru' or '/netcat_files/' not in source:
            errors.append(f'{sku}: not an official recorded image URL')
            continue
        try:
            request = Request(source, headers={'User-Agent': 'Mozilla/5.0', 'Referer': product['page']})
            with urlopen(request, timeout=40) as response:
                original = response.read(12 * 1024 * 1024 + 1)
            if len(original) > 12 * 1024 * 1024:
                raise ValueError('source exceeds media size limit')
            expected = frame.get('sourceSha256')
            if expected and hashlib.sha256(original).hexdigest() != expected:
                raise ValueError('official source changed; needs visual review before import')
            from PIL import Image
            with Image.open(io.BytesIO(original)) as image:
                image.load()
                if min(image.size) < 240:
                    raise ValueError('source resolution is insufficient')
                rgb = image.convert('RGB')
                rgb.thumbnail((1300, 1300), Image.Resampling.LANCZOS)
                filename.parent.mkdir(parents=True, exist_ok=True)
                temporary = filename.with_suffix('.tmp.webp')
                rgb.save(temporary, 'WEBP', quality=88, method=6)
                with Image.open(temporary) as verification:
                    verification.verify()
                temporary.replace(filename)
                frame.update(sha256=hashlib.sha256(filename.read_bytes()).hexdigest(), width=rgb.width, height=rgb.height)
                changed = True
                print(f'Restored from verified official source {sku}: {filename.name}')
        except Exception as exc:
            errors.append(f'{sku}: {exc}')
if changed and not errors:
    temporary = manifest_path.with_suffix('.tmp.json')
    temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(manifest_path)
if errors:
    print('\n'.join(errors), file=sys.stderr)
    raise SystemExit(1)
print(f'PASS: {len(manifest)} manifest entries; no invented sources or replacement models.')
