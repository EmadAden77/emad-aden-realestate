import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';
import handler from '../api/legal-document.js';

const page = await readFile('legal-consultant.html', 'utf8');
if (page.includes('URL.createObjectURL') || page.includes('new Blob')) throw new Error('تحميل blob القديم ما زال موجودًا.');
if (!page.includes("form.action = '/api/legal-document'")) throw new Error('تحميل النماذج غير مربوط بالخادم.');
if (!page.includes("requestDocument(item, 'print')")) throw new Error('الطباعة المستقلة غير مربوطة.');
if (!page.includes("['source', item.content + legalDisclaimer]")) throw new Error('النص الأصلي للعقد لا يُرسل إلى مولد الوثائق.');

async function call(format, name = 'عقد إيجار', source = 'عقد إيجار عقار – نموذج استرشادي للجمهورية اليمنية\n\nأولاً: أطراف العقد\nالمؤجر: ............................\n\nتنبيه مهني: يجب التحقق من المستندات.') {
  let statusCode; const headers = {}; let output;
  const response = { setHeader(k,v){headers[k]=v}, status(v){statusCode=v;return this}, send(v){output=v;return this} };
  await handler({ method:'POST', body:{ name, source, format } }, response);
  return { statusCode, headers, output };
}

const word = await call('word');
if (word.statusCode !== 200 || !word.headers['Content-Disposition']?.includes('.docx') || word.headers['Content-Type'] !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || !Buffer.isBuffer(word.output) || word.output.subarray(0, 2).toString() !== 'PK') throw new Error('استجابة Word DOCX المباشرة غير صحيحة.');
const archive = await JSZip.loadAsync(word.output);
const documentXml = await archive.file('word/document.xml')?.async('string');
const headerXml = (await Promise.all(archive.file(/^word\/header\d+\.xml$/).map(file => file.async('string')))).join('\n');
const mediaFiles = Object.keys(archive.files).filter(path => path.startsWith('word/media/'));
if (!documentXml?.includes('إخلاء مسؤولية مكتب عماد عدن العقاري') || !documentXml.includes('أولاً: أطراف العقد') || !headerXml.includes('office-watermark') || !headerXml.includes('مكتب عماد عدن العقاري') || mediaFiles.length < 2) throw new Error('تصميم Word أو العلامة المائية أو نص العقد غير مكتمل.');
const print = await call('print');
if (print.statusCode !== 200 || print.headers['Content-Type'] !== 'text/html; charset=utf-8' || !print.output.includes('window.print()') || !print.output.includes('brand-header') || !print.output.includes('title-block')) throw new Error('صفحة الطباعة المستقلة غير صحيحة.');
if (!print.output.includes('إخلاء مسؤولية مكتب عماد عدن العقاري') || !print.output.includes('class="watermark"')) throw new Error('العلامة أو إخلاء المسؤولية غير موجودين.');

const templatePattern = /"[^"]+"\s*:\s*\{\s*"name"\s*:\s*("(?:\\.|[^"\\])*")\s*,\s*"content"\s*:\s*("(?:\\.|[^"\\])*")\s*\}/gs;
const templates = [...page.matchAll(templatePattern)].map(match => ({ name: JSON.parse(match[1]), source: JSON.parse(match[2]) }));
if (templates.length < 5) throw new Error('تعذر العثور على جميع النماذج القانونية لاختبارها.');
for (const template of templates) {
  const result = await call('word', template.name, template.source);
  if (result.statusCode !== 200 || !Buffer.isBuffer(result.output) || result.output.subarray(0, 2).toString() !== 'PK') throw new Error(`فشل إنشاء النموذج: ${template.name}`);
}

console.log(`OK: branded DOCX download and premium standalone print/PDF flow validated for ${templates.length} legal templates.`);
