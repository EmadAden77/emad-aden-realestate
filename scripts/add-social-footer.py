from pathlib import Path

path = Path('index.html')
html = path.read_text(encoding='utf-8')

marker = '<footer class="footer"><div class="container">'
if marker not in html:
    raise SystemExit('Footer marker not found')

if 'id="officeSocialLinks"' in html:
    print('Social footer already exists')
    raise SystemExit(0)

styles = '.office-social{margin:0 0 30px;padding:24px;border-radius:24px;background:linear-gradient(135deg,rgba(229,192,123,.12),rgba(255,255,255,.025));border:1px solid var(--line);text-align:center}.office-social h3{margin:0 0 6px;color:#fff;font-size:clamp(1.25rem,3vw,1.7rem)}.office-social p{margin:0 0 18px;color:var(--muted)}.office-social-links{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.office-social-link{display:flex;align-items:center;justify-content:center;gap:10px;min-height:58px;padding:12px 16px;border-radius:16px;border:1px solid rgba(229,192,123,.24);background:rgba(0,0,0,.32);color:#fff!important;font-weight:900;transition:.25s}.office-social-link i{font-size:1.25rem;color:var(--gold)}.office-social-link:hover{transform:translateY(-3px);background:rgba(229,192,123,.1);border-color:rgba(229,192,123,.5);box-shadow:0 12px 28px rgba(0,0,0,.25)}@media(max-width:680px){.office-social{padding:20px 14px}.office-social-links{grid-template-columns:1fr}.office-social-link{min-height:54px}}'
html = html.replace('</style>', styles + '</style>', 1)

block = '<section class="office-social" id="officeSocialLinks" aria-labelledby="officeSocialTitle"><h3 id="officeSocialTitle">تابع مكتب عماد عدن العقاري</h3><p>تابع آخر الأخبار والأدلة والتحديثات العقارية عبر حسابات المكتب الرسمية</p><div class="office-social-links"><a class="office-social-link" href="https://x.com/aleimad7aden" target="_blank" rel="noopener noreferrer" aria-label="متابعة مكتب عماد عدن العقاري على منصة X"><i class="fa-brands fa-x-twitter" aria-hidden="true"></i><span>منصة X</span></a><a class="office-social-link" href="https://www.instagram.com/p/DQVHj_FiCQS/" target="_blank" rel="noopener noreferrer" aria-label="متابعة مكتب عماد عدن العقاري على إنستغرام"><i class="fa-brands fa-instagram" aria-hidden="true"></i><span>إنستغرام</span></a><a class="office-social-link" href="https://www.facebook.com/aleimad7aden/" target="_blank" rel="noopener noreferrer" aria-label="متابعة مكتب عماد عدن العقاري على فيسبوك"><i class="fa-brands fa-facebook-f" aria-hidden="true"></i><span>فيسبوك</span></a></div></section>'
html = html.replace(marker, marker + block, 1)
path.write_text(html, encoding='utf-8')
