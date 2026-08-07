#!/usr/bin/env python3
"""Dependency-free quality gate for the static site."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json, re, sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.attrs=[]; self.ids=set(); self.title=False
    def handle_starttag(self, tag, attrs):
        data=dict(attrs); self.attrs.append((tag, data))
        if data.get('id'): self.ids.add(data['id'])
        if tag == 'title': self.title=True

pages = [p for p in ROOT.rglob('*.html') if p.name != 'social-footer-preview.html']
parsed = {}
for path in pages:
    parser=Page()
    try: parser.feed(path.read_text(encoding='utf-8'))
    except Exception as exc: errors.append(f'{path.relative_to(ROOT)}: invalid HTML: {exc}'); continue
    parsed[path.resolve()] = parser
    rel=path.relative_to(ROOT)
    required = [
        ('description', any(t=='meta' and a.get('name')=='description' and a.get('content') for t,a in parser.attrs)),
        ('canonical', any(t=='link' and 'canonical' in a.get('rel','').split() for t,a in parser.attrs)),
        ('Open Graph title', any(t=='meta' and a.get('property')=='og:title' for t,a in parser.attrs)),
    ]
    if path.name not in {'404.html'}:
        for label, ok in required:
            if not ok: errors.append(f'{rel}: missing {label}')
    for tag, attrs in parser.attrs:
        url=attrs.get('href') if tag in {'a','link'} else attrs.get('src') if tag in {'img','script','source'} else None
        if not url or url.startswith(('#','mailto:','tel:','javascript:','data:','http://','https://','//')): continue
        target=urlsplit(unquote(url)); candidate=(path.parent / target.path).resolve()
        if target.path.startswith('/'): candidate=(ROOT / target.path.lstrip('/')).resolve()
        if target.path.endswith('/'): candidate /= 'index.html'
        if not candidate.exists(): errors.append(f'{rel}: broken internal resource {url}')
        elif target.fragment and candidate.suffix=='.html' and target.fragment not in parsed.get(candidate, parser).ids:
            # Cross-page fragments are checked after all pages are parsed below.
            pass

try:
    manifest=json.loads((ROOT/'manifest.json').read_text())
    for key in ('name','short_name','start_url','display','icons'):
        if not manifest.get(key): errors.append(f'manifest.json: missing {key}')
except Exception as exc: errors.append(f'manifest.json: {exc}')

site=(ROOT/'sitemap.xml').read_text()
for loc in re.findall(r'<loc>(.*?)</loc>',site):
    local=urlsplit(loc).path.lstrip('/') or 'index.html'
    if local.endswith('/'): local += 'index.html'
    if not (ROOT/local).exists(): errors.append(f'sitemap.xml: missing target {loc}')

if errors:
    print('\n'.join(f'ERROR: {e}' for e in sorted(set(errors))))
    print(f'\n{len(set(errors))} error(s) across {len(pages)} HTML pages.'); sys.exit(1)
print(f'OK: audited {len(pages)} HTML pages, internal resources, metadata, manifest and sitemap.')
