import { readFile } from 'node:fs/promises';

const printablePages = [
  'valuation-report.html',
  'document-checklist.html',
  'deal-safety-check.html',
  'investment-return-calculator.html',
  'property-management.html'
];

for (const path of printablePages) {
  const html = await readFile(path, 'utf8');
  if (!html.includes('assets/css/print-watermark.css')) throw new Error(`${path}: ملف العلامة المائية غير مربوط.`);
  if (!html.includes('assets/js/print-disclaimer.js')) throw new Error(`${path}: إخلاء مسؤولية المكتب غير مربوط.`);
}

const css = await readFile('assets/css/print-watermark.css', 'utf8');
if (!css.includes('مكتب عماد عدن العقاري') || !css.includes('@media print')) throw new Error('تنسيق العلامة المائية للطباعة غير مكتمل.');

const legal = await readFile('legal-consultant.html', 'utf8');
const occurrences = legal.match(/مكتب عماد عدن العقاري/g)?.length || 0;
if (!legal.includes('class="watermark"') || occurrences < 3) throw new Error('معاينة النماذج القانونية لا تحمل العلامة المائية المطلوبة.');
if (!legal.includes("form.action = '/api/legal-document'")) throw new Error('نماذج Word والطباعة غير مربوطة بخادم الحماية.');

const legalEndpoint = await readFile('api/legal-document.js', 'utf8');
if (!legalEndpoint.includes("const OFFICE_NAME = 'مكتب عماد عدن العقاري'") || !legalEndpoint.includes('إخلاء مسؤولية ${OFFICE_NAME}') || !legalEndpoint.includes('لا يستبعد هذا التنبيه أي مسؤولية يقررها القانون') || !legalEndpoint.includes('office-watermark')) throw new Error('حماية Word والطباعة من الخادم غير مكتملة.');

const disclaimer = await readFile('assets/js/print-disclaimer.js', 'utf8');
if (!disclaimer.includes('إخلاء مسؤولية مكتب عماد عدن العقاري') || !disclaimer.includes('لا يستبعد هذا التنبيه أي مسؤولية يقررها القانون')) throw new Error('صياغة إخلاء مسؤولية المكتب غير مكتملة.');

console.log(`OK: watermark protection validated for ${printablePages.length} printable tools and legal Word/PDF templates.`);
