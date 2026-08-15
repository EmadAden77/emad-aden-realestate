from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = '  <script src="/assets/js/site-analytics.js?v=20260815" defer></script>\n'
EXCLUDED = {
    '404.html',
    'articles/404.html',
    'social-footer-preview.html',
    'google4592bd81ce202901.html',
}
LEGACY = (
    '<script async src="https://www.googletagmanager.com/gtag/js?id=G-17ZZZFR8HT"></script>\n'
    "<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-17ZZZFR8HT',{send_page_view:true});</script>\n"
)

changed = 0
covered = 0
for page in sorted(ROOT.rglob('*.html')):
    relative = page.relative_to(ROOT).as_posix()
    if relative.startswith(('node_modules/', '.git/')) or relative in EXCLUDED:
        continue
    source = page.read_text(encoding='utf-8')
    if '</head>' not in source:
        continue
    source = source.replace(LEGACY, '')
    if '/assets/js/site-analytics.js' not in source:
        source = source.replace('</head>', f'{SCRIPT}</head>', 1)
        page.write_text(source, encoding='utf-8')
        changed += 1
    elif source != page.read_text(encoding='utf-8'):
        page.write_text(source, encoding='utf-8')
        changed += 1
    covered += 1

print(f'analytics installed on {covered} pages; {changed} files changed')
