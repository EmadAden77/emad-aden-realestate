const DISCLAIMER = '<aside class="office-disclaimer"><strong>إخلاء مسؤولية مكتب عماد عدن العقاري:</strong> هذا النموذج استرشادي ومعدّ للتخصيص وفق بيانات المعاملة. لا يُعد توثيقاً رسمياً أو ضماناً لصحة الملكية أو المستندات أو سلامة الصفقة، ولا يغني عن مراجعة الأصول والجهات المختصة والاستشارة القانونية عند الحاجة. يتحمل المستخدم مسؤولية تعبئة النموذج واستعماله، ولا يستبعد هذا التنبيه أي مسؤولية يقررها القانون.</aside>';

function bodyOf(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') return Object.fromEntries(new URLSearchParams(request.body));
  return {};
}

function cleanName(value) {
  return String(value || 'نموذج-عقاري').replace(/[\\/:*?"<>|\r\n]+/g, '-').slice(0, 120);
}

function safeDocument(value) {
  return String(value || '')
    .slice(0, 180000)
    .replace(/<\/?(?:script|style|iframe|object|embed|form|input|button|textarea|select|link|meta)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(?:href|src)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

function documentHtml(name, content, printMode) {
  const toolbar = printMode ? '<div class="toolbar"><button type="button" onclick="window.print()">طباعة أو حفظ PDF</button><span>إذا لم تفتح نافذة الطباعة تلقائيًا اضغط الزر.</span></div>' : '';
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name}</title><style>
  @page{size:A4;margin:16mm}*{box-sizing:border-box}html,body{margin:0;direction:rtl;font-family:Tahoma,Arial,sans-serif;color:#111;background:${printMode ? '#e7e8eb' : '#fff'}}
  .toolbar{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:center;gap:12px;padding:12px;background:#111827;color:#fff}.toolbar button{border:0;border-radius:12px;padding:12px 18px;background:#e5c07b;font-weight:bold;font-size:16px}.toolbar span{font-size:13px}
  .paper{position:relative;isolation:isolate;overflow:hidden;width:min(210mm,calc(100% - 24px));min-height:297mm;margin:18px auto;padding:18mm 16mm;background:#fff;box-shadow:${printMode ? '0 8px 32px rgba(0,0,0,.16)' : 'none'}}
  .watermark{position:absolute;top:45%;left:50%;z-index:0;width:135%;transform:translate(-50%,-50%) rotate(-32deg);color:rgba(116,86,27,.08);font-size:50pt;font-weight:bold;text-align:center;white-space:nowrap}.content{position:relative;z-index:1}
  h1{text-align:center;font-size:20pt;margin:0 0 20pt}h2{font-size:15pt;color:#7a5714;border-bottom:1pt solid #b8860b;padding-bottom:5pt;margin:18pt 0 8pt}p{font-size:12pt;line-height:1.8;margin:0 0 6pt}.notice{border-right:3pt solid #b8860b;background:#fff8e6;padding:9pt;font-weight:bold}.spacer{height:6pt}
  .office-disclaimer{margin-top:20pt;padding:8pt;border:1pt solid #999;border-right:3pt solid #76591e;background:#fff;color:#333;font-size:9pt;line-height:1.5;break-inside:avoid}.office-disclaimer strong{color:#5e4518}
  @media(max-width:600px){.toolbar{flex-direction:column}.paper{width:100%;margin:0;padding:24px 18px;box-shadow:none}}
  @media print{html,body{background:#fff}.toolbar{display:none}.paper{width:auto;min-height:auto;margin:0;padding:0;overflow:visible;box-shadow:none}.watermark{position:fixed;top:46%;font-size:58pt;color:rgba(55,55,55,.075)}}
  </style></head><body>${toolbar}<main class="paper"><div class="watermark">مكتب عماد عدن العقاري</div><div class="content">${content}${DISCLAIMER}</div></main>${printMode ? '<script>setTimeout(()=>window.print(),500)<\/script>' : ''}</body></html>`;
}

export default function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).send('Method not allowed');
  }
  const body = bodyOf(request);
  const name = cleanName(body.name);
  const content = safeDocument(body.content);
  if (!content) return response.status(400).send('Document content is required');
  const printMode = body.format === 'print';
  const html = `\ufeff${documentHtml(name, content, printMode)}`;
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Content-Type', printMode ? 'text/html; charset=utf-8' : 'application/msword; charset=utf-8');
  if (!printMode) response.setHeader('Content-Disposition', `attachment; filename="emad-aden-template.doc"; filename*=UTF-8''${encodeURIComponent(name)}.doc`);
  return response.status(200).send(html);
}
