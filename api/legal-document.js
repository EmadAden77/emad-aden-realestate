import { readFile } from 'node:fs/promises';
import {
  AlignmentType,
  BorderStyle,
  convertMillimetersToTwip,
  Document,
  Footer,
  Header,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  ImageRun,
  Packer,
  PageNumber,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  TextWrappingType,
  VerticalPositionAlign,
  VerticalPositionRelativeFrom,
  WidthType
} from 'docx';

const OFFICE_NAME = 'مكتب عماد عدن العقاري';
const OFFICE_TAGLINE = 'بيع • شراء • تثمين • استثمار';
const GOLD = '8A6418';
const DARK = '171717';
const MUTED = '5F6368';
const PALE_GOLD = 'F7F1E4';
const DISCLAIMER_TEXT = 'هذا النموذج استرشادي ومعدّ للتخصيص وفق بيانات المعاملة. لا يُعد توثيقاً رسمياً أو ضماناً لصحة الملكية أو المستندات أو سلامة الصفقة، ولا يغني عن مراجعة الأصول والجهات المختصة والاستشارة القانونية عند الحاجة. يتحمل المستخدم مسؤولية تعبئة النموذج واستعماله، ولا يستبعد هذا التنبيه أي مسؤولية يقررها القانون.';
const ASSET_PATHS = {
  logo: new URL('../IMG_5-header.jpg', import.meta.url),
  watermark: new URL('../assets/legal-watermark.png', import.meta.url)
};

let assetsPromise;
function getAssets() {
  assetsPromise ||= Promise.all([readFile(ASSET_PATHS.logo), readFile(ASSET_PATHS.watermark)]).then(([logo, watermark]) => ({ logo, watermark }));
  return assetsPromise;
}

function bodyOf(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') return Object.fromEntries(new URLSearchParams(request.body));
  return {};
}

function cleanName(value) {
  return String(value || 'نموذج-عقاري').replace(/\.txt$/i, '').replace(/[\\/:*?"<>|\r\n]+/g, '-').slice(0, 120);
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function cleanSource(value) {
  return decodeEntities(String(value || '')
    .slice(0, 180000)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|h1|h2|div|aside)>/gi, '\n')
    .replace(/<[^>]+>/g, ''))
    .replace(/\r\n?/g, '\n')
    .replace(/[\t ]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function splitDocument(source, fallbackName) {
  const lines = source.split('\n').map(line => line.trim());
  const titleIndex = lines.findIndex(Boolean);
  const fullTitle = titleIndex >= 0 ? lines[titleIndex] : fallbackName;
  const titleParts = fullTitle.split(/\s+[–—-]\s+/, 2);
  return {
    title: titleParts[0] || fallbackName,
    subtitle: titleParts[1] || 'نموذج عقاري استرشادي للجمهورية اليمنية',
    lines: lines.slice(titleIndex + 1)
  };
}

function lineKind(text) {
  if (/^(أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً|سابعاً|ثامناً|تاسعاً|عاشراً|حادي عشر|ثاني عشر):/.test(text)) return 'section';
  if (/^(تنبيه|لا تعتمد|المرفقات:|ملاحظة)/.test(text)) return 'notice';
  if (/^(اسم وتوقيع|توقيع|قبول وتوقيع|الشاهد|اسم الموثق|بيانات التوثيق)/.test(text)) return 'signature';
  if (/^\d+[-–]/.test(text)) return 'clause';
  return 'body';
}

function border(style = BorderStyle.SINGLE, color = 'D6B66E', size = 6) {
  return { style, color, size };
}

const noBorder = { style: BorderStyle.NONE, color: 'FFFFFF', size: 0 };
const noTableBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder };

function textRun(text, options = {}) {
  return new TextRun({
    text,
    font: 'Arial',
    size: options.size || 25,
    sizeComplexScript: options.size || 25,
    color: options.color || DARK,
    bold: options.bold,
    boldComplexScript: options.bold,
    rightToLeft: true,
    language: { bidirectional: 'ar-YE' }
  });
}

function documentHeader(logo, watermark) {
  return new Header({ children: [
    new Paragraph({
      children: [new ImageRun({
        type: 'png',
        data: watermark,
        transformation: { width: 620, height: 237 },
        floating: {
          horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, align: HorizontalPositionAlign.CENTER },
          verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, align: VerticalPositionAlign.CENTER },
          behindDocument: true,
          allowOverlap: true,
          wrap: { type: TextWrappingType.NONE }
        },
        altText: { title: OFFICE_NAME, description: 'علامة مائية باسم المكتب', name: 'office-watermark' }
      })]
    }),
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.RIGHT,
      border: { bottom: border(BorderStyle.SINGLE, GOLD, 12) },
      spacing: { after: 110 },
      children: [
        new ImageRun({ type: 'jpg', data: logo, transformation: { width: 52, height: 52 }, altText: { title: OFFICE_NAME, description: 'شعار المكتب', name: 'office-logo' } }),
        textRun(`   ${OFFICE_NAME}   |   ${OFFICE_TAGLINE}`, { size: 24, color: GOLD, bold: true })
      ]
    })
  ] });
}

function documentFooter() {
  return new Footer({ children: [new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.CENTER,
    border: { top: border(BorderStyle.SINGLE, 'D6B66E', 6) },
    spacing: { before: 100 },
    children: [
      textRun(`${OFFICE_NAME}  |  صفحة `, { size: 18, color: MUTED }),
      new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: MUTED }),
      textRun(' من ', { size: 18, color: MUTED }),
      new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 18, color: MUTED })
    ]
  })] });
}

function titleBlock(title, subtitle) {
  return [
    new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, spacing: { before: 240, after: 100 }, keepNext: true, children: [textRun(title, { size: 48, color: DARK, bold: true })] }),
    new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, spacing: { after: 260 }, border: { bottom: border(BorderStyle.SINGLE, GOLD, 14) }, children: [textRun(subtitle, { size: 23, color: GOLD, bold: true })] }),
    new Table({
      width: { size: 9360, type: WidthType.DXA }, columnWidths: [4680, 4680], visuallyRightToLeft: true, borders: noTableBorders,
      margins: { top: 150, bottom: 150, start: 180, end: 180 },
      rows: [new TableRow({ children: [
        new TableCell({ width: { size: 4680, type: WidthType.DXA }, shading: { fill: PALE_GOLD }, verticalAlign: 'center', children: [new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 0 }, children: [textRun('نوع الوثيقة: نموذج قابل للتعبئة', { size: 20, color: DARK, bold: true })] })] }),
        new TableCell({ width: { size: 4680, type: WidthType.DXA }, shading: { fill: PALE_GOLD }, verticalAlign: 'center', children: [new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 0 }, children: [textRun(`إعداد وتنسيق: ${OFFICE_NAME}`, { size: 20, color: DARK, bold: true })] })] })
      ] })]
    }),
    new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, spacing: { before: 130, after: 260 }, children: [textRun('يُرجى استكمال جميع البيانات ومراجعة المستندات قبل التوقيع أو التوثيق', { size: 19, color: MUTED })] })
  ];
}

function paragraphForLine(text, nextText = '') {
  const kind = lineKind(text);
  if (kind === 'section') {
    return new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, keepNext: true, keepLines: true, spacing: { before: 280, after: 130 }, border: { bottom: border(BorderStyle.SINGLE, 'D6B66E', 8) }, children: [textRun(text, { size: 31, color: GOLD, bold: true })] });
  }
  if (kind === 'notice') {
    return new Paragraph({ bidirectional: true, alignment: AlignmentType.JUSTIFIED, keepLines: true, shading: { fill: 'FFF8E6' }, border: { top: border(), bottom: border(), left: border(), right: border(BorderStyle.SINGLE, GOLD, 18) }, spacing: { before: 150, after: 150, line: 380 }, indent: { start: 180, end: 180 }, children: [textRun(text, { size: 24, color: '4D3A12', bold: true })] });
  }
  if (kind === 'signature') {
    return new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, keepLines: true, keepNext: lineKind(nextText) === 'signature', spacing: { before: 120, after: 170, line: 380 }, children: [textRun(text, { size: 25, color: DARK, bold: true })] });
  }
  return new Paragraph({ bidirectional: true, alignment: AlignmentType.JUSTIFIED, keepLines: kind === 'clause', widowControl: true, spacing: { after: kind === 'clause' ? 120 : 140, line: 390 }, indent: kind === 'clause' ? { start: 120 } : undefined, children: [textRun(text, { size: 25, color: DARK })] });
}

function disclaimerBox() {
  return new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360], indent: { size: 120, type: WidthType.DXA },
    borders: { top: border(), bottom: border(), left: border(), right: border(BorderStyle.SINGLE, GOLD, 20), insideHorizontal: noBorder, insideVertical: noBorder },
    margins: { top: 180, bottom: 180, start: 220, end: 220 },
    rows: [new TableRow({ children: [new TableCell({ width: { size: 9360, type: WidthType.DXA }, shading: { fill: PALE_GOLD }, children: [
      new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 90 }, children: [textRun(`إخلاء مسؤولية ${OFFICE_NAME}`, { size: 22, color: GOLD, bold: true })] }),
      new Paragraph({ bidirectional: true, alignment: AlignmentType.JUSTIFIED, spacing: { after: 0, line: 340 }, children: [textRun(DISCLAIMER_TEXT, { size: 20, color: '3E3E3E' })] })
    ] })] })]
  });
}

function sectionFooters() {
  return { first: documentFooter(), default: documentFooter(), even: documentFooter() };
}

async function buildWordDocument(name, source) {
  const { logo, watermark } = await getAssets();
  const parsed = splitDocument(source, name);
  const bodyLines = parsed.lines.filter(Boolean);
  const children = [
    ...titleBlock(parsed.title, parsed.subtitle),
    ...bodyLines.map((line, index) => paragraphForLine(line, bodyLines[index + 1])),
    new Paragraph({ spacing: { before: 260 }, children: [] }),
    disclaimerBox()
  ];
  const document = new Document({
    creator: OFFICE_NAME,
    company: OFFICE_NAME,
    title: parsed.title,
    description: 'نموذج عقاري استرشادي منسق للطباعة والتعبئة',
    features: { updateFields: true },
    evenAndOddHeaderAndFooters: true,
    styles: { default: { document: { run: { font: 'Arial', size: 25, sizeComplexScript: 25, color: DARK, rightToLeft: true, language: { bidirectional: 'ar-YE' } }, paragraph: { bidirectional: true, spacing: { after: 140, line: 390 } } } } },
    sections: [{
      properties: {
        page: {
          size: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297), orientation: PageOrientation.PORTRAIT },
          margin: { top: convertMillimetersToTwip(27), right: convertMillimetersToTwip(18), bottom: convertMillimetersToTwip(22), left: convertMillimetersToTwip(18), header: convertMillimetersToTwip(7), footer: convertMillimetersToTwip(10) }
        }
      },
      headers: { default: documentHeader(logo, watermark), even: documentHeader(logo, watermark) },
      footers: sectionFooters(),
      children
    }]
  });
  return Packer.toBuffer(document);
}

function printBody(lines) {
  return lines.filter(Boolean).map(text => {
    const kind = lineKind(text);
    const safe = escapeHtml(text);
    if (kind === 'section') return `<h2>${safe}</h2>`;
    if (kind === 'notice') return `<p class="notice">${safe}</p>`;
    return `<p class="${kind}">${safe}</p>`;
  }).join('');
}

function printDocumentHtml(name, source) {
  const parsed = splitDocument(source, name);
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(parsed.title)}</title><style>
  @page{size:A4;margin:25mm 18mm 22mm}*{box-sizing:border-box}html,body{margin:0;direction:rtl;font-family:Arial,Tahoma,sans-serif;color:#171717;background:#e7e8eb}
  .toolbar{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:center;gap:12px;padding:12px;background:#111827;color:#fff}.toolbar button{border:0;border-radius:12px;padding:12px 18px;background:#e5c07b;color:#171717;font-weight:700;font-size:16px}.toolbar span{font-size:13px}
  .paper{position:relative;isolation:isolate;overflow:hidden;width:min(210mm,calc(100% - 24px));min-height:297mm;margin:18px auto;padding:14mm 18mm 20mm;background:#fff;box-shadow:0 8px 32px rgba(0,0,0,.16)}
  .watermark{position:fixed;inset:43% auto auto 50%;z-index:-1;width:170mm;transform:translate(-50%,-50%) rotate(-18deg);border:2px solid rgba(138,100,24,.07);border-radius:999px;padding:18px;color:rgba(107,77,20,.07);font-size:34pt;font-weight:800;text-align:center;white-space:nowrap}
  .brand-header{display:flex;align-items:center;gap:14px;padding-bottom:12px;border-bottom:3px solid #8a6418}.brand-header img{width:64px;height:64px;border-radius:15px}.brand-name{font-size:18pt;font-weight:800;color:#8a6418}.brand-tagline{margin-top:4px;font-size:10pt;font-weight:700;color:#5f6368}
  .title-block{text-align:center;padding:26px 0 20px}.title-block h1{margin:0 0 8px;font-size:27pt;line-height:1.45}.subtitle{margin:0;color:#8a6418;font-size:13pt;font-weight:700}.meta{display:grid;grid-template-columns:1fr 1fr;gap:1px;margin:12px 0 26px;background:#d6b66e;border:1px solid #d6b66e}.meta div{padding:10px 12px;background:#f7f1e4;font-size:10.5pt;font-weight:700}
  h2{margin:24pt 0 10pt;padding-bottom:6pt;border-bottom:1.5pt solid #d6b66e;color:#8a6418;font-size:16pt;line-height:1.5;break-after:avoid}p{margin:0 0 8pt;font-size:13pt;line-height:1.85;text-align:justify;white-space:pre-wrap;overflow-wrap:anywhere}.clause{padding-right:7pt}.signature{margin:10pt 0 14pt;font-weight:700}.notice{margin:14pt 0;padding:10pt 12pt;border:1px solid #d6b66e;border-right:4px solid #8a6418;background:#fff8e6;color:#4d3a12;font-weight:700;break-inside:avoid}
  .office-disclaimer{margin-top:24pt;padding:12pt;border:1px solid #d6b66e;border-right:5px solid #8a6418;background:#f7f1e4;color:#333;font-size:10pt;line-height:1.7;break-inside:avoid}.office-disclaimer strong{display:block;margin-bottom:5px;color:#8a6418;font-size:11pt}.page-footer{margin-top:20pt;padding-top:8pt;border-top:1px solid #d6b66e;text-align:center;color:#5f6368;font-size:9pt}
  @media(max-width:600px){.toolbar{flex-direction:column}.paper{width:100%;margin:0;padding:22px 18px;box-shadow:none}.brand-header img{width:54px;height:54px}.brand-name{font-size:20px}.title-block h1{font-size:27px}.meta{grid-template-columns:1fr}h2{font-size:21px}p{font-size:18px;line-height:1.9}}
  @media print{html,body{background:#fff}.toolbar{display:none}.paper{width:auto;min-height:auto;margin:0;padding:0;overflow:visible;box-shadow:none}.watermark{position:fixed;z-index:-1}.brand-header{break-inside:avoid}.title-block{break-inside:avoid}.page-footer{position:fixed;right:0;bottom:-14mm;left:0;margin:0}.office-disclaimer{break-inside:avoid}}
  </style></head><body><div class="toolbar"><button type="button" onclick="window.print()">طباعة أو حفظ PDF</button><span>إذا لم تفتح نافذة الطباعة تلقائيًا اضغط الزر.</span></div><main class="paper"><div class="watermark" aria-hidden="true">${OFFICE_NAME}</div><header class="brand-header"><img src="/IMG_5-header.jpg" alt="شعار المكتب"><div><div class="brand-name">${OFFICE_NAME}</div><div class="brand-tagline">${OFFICE_TAGLINE}</div></div></header><section class="title-block"><h1>${escapeHtml(parsed.title)}</h1><p class="subtitle">${escapeHtml(parsed.subtitle)}</p></section><div class="meta"><div>نوع الوثيقة: نموذج قابل للتعبئة</div><div>إعداد وتنسيق: ${OFFICE_NAME}</div></div>${printBody(parsed.lines)}<aside class="office-disclaimer"><strong>إخلاء مسؤولية ${OFFICE_NAME}</strong>${DISCLAIMER_TEXT}</aside><footer class="page-footer">${OFFICE_NAME} — وثيقة استرشادية معدّة للطباعة والتعبئة</footer></main><script>setTimeout(()=>window.print(),500)<\/script></body></html>`;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).send('Method not allowed');
  }
  const body = bodyOf(request);
  const name = cleanName(body.name);
  const source = cleanSource(body.source || body.content);
  if (!source) return response.status(400).send('Document content is required');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (body.format === 'print') {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    return response.status(200).send(`\ufeff${printDocumentHtml(name, source)}`);
  }
  try {
    const word = await buildWordDocument(name, source);
    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    response.setHeader('Content-Disposition', `attachment; filename="emad-aden-contract.docx"; filename*=UTF-8''${encodeURIComponent(name)}.docx`);
    response.setHeader('Content-Length', word.length);
    return response.status(200).send(word);
  } catch (error) {
    console.error('Failed to build legal document', error);
    return response.status(500).send('Unable to create the document');
  }
}
