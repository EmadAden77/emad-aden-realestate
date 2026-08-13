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
if (!legal.includes('class="watermark"') || !legal.includes('document-content') || occurrences < 5) throw new Error('نماذج Word والطباعة القانونية لا تحمل العلامة المائية المطلوبة.');
if (!legal.includes('officeDisclaimerHtml') || !legal.includes('لا يستبعد هذا التنبيه أي مسؤولية يقررها القانون')) throw new Error('إخلاء مسؤولية النماذج القانونية غير موجود.');

const disclaimer = await readFile('assets/js/print-disclaimer.js', 'utf8');
if (!disclaimer.includes('إخلاء مسؤولية مكتب عماد عدن العقاري') || !disclaimer.includes('لا يستبعد هذا التنبيه أي مسؤولية يقررها القانون')) throw new Error('صياغة إخلاء مسؤولية المكتب غير مكتملة.');

console.log(`OK: watermark protection validated for ${printablePages.length} printable tools and legal Word/PDF templates.`);
