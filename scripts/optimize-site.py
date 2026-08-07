#!/usr/bin/env python3
"""Apply consistent discoverability metadata and generate the sitemap."""
from pathlib import Path
from html import escape
import re

ROOT=Path(__file__).resolve().parents[1]; BASE='https://emad-aden-realestate.vercel.app'
OLD='https://www.instagram.com/p/'+'DQVHj_FiCQS/'; NEW='https://www.instagram.com/aleimad7aden/'
for path in ROOT.rglob('*'):
    if path.is_file() and path.suffix in {'.html','.py','.json'} and '.git' not in path.parts:
        text=path.read_text(encoding='utf-8'); text=text.replace(OLD,NEW)
        if path.suffix=='.html' and path.name!='404.html':
            rel=path.relative_to(ROOT).as_posix(); url=BASE+('/' if rel=='index.html' else '/'+rel)
            title=(re.search(r'<title>(.*?)</title>',text,re.I|re.S) or [None,'مكتب عماد عدن العقاري'])[1].strip()
            desc=(re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']',text,re.I|re.S) or [None,'خدمات ومعلومات عقارية موثوقة في عدن من مكتب عماد عدن العقاري.'])[1].strip()
            additions=[]
            checks=[('canonical',f'<link rel="canonical" href="{url}">'),('property="og:title"',f'<meta property="og:title" content="{escape(title,quote=True)}">'),('property="og:description"',f'<meta property="og:description" content="{escape(desc,quote=True)}">'),('property="og:type"','<meta property="og:type" content="website">'),('property="og:url"',f'<meta property="og:url" content="{url}">'),('property="og:image"',f'<meta property="og:image" content="{BASE}/IMG_5.jpg">'),('name="twitter:card"','<meta name="twitter:card" content="summary_large_image">'),('name="theme-color"','<meta name="theme-color" content="#E5C07B">')]
            for marker,tag in checks:
                if marker not in text: additions.append(tag)
            if additions: text=re.sub(r'</head>', '\n'+'\n'.join(additions)+'\n</head>',text,count=1,flags=re.I)
        path.write_text(text,encoding='utf-8')

urls=[]
excluded={'404.html','articles/404.html','social-footer-preview.html'}
for p in sorted(ROOT.rglob('*.html')):
    rel=p.relative_to(ROOT).as_posix()
    if rel in excluded: continue
    loc=BASE+('/' if rel=='index.html' else '/'+rel)
    priority='1.0' if rel=='index.html' else ('0.8' if rel in {'articles/index.html','about.html','contact.html'} else '0.6')
    urls.append(f'  <url><loc>{loc}</loc><lastmod>2026-08-07</lastmod><changefreq>weekly</changefreq><priority>{priority}</priority></url>')
(ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+'\n'.join(urls)+'\n</urlset>\n')
print(f'Optimized metadata and generated {len(urls)} sitemap entries.')
