import { readFile } from 'node:fs/promises';
import handler from '../api/legal-document.js';

const page = await readFile('legal-consultant.html', 'utf8');
if (page.includes('URL.createObjectURL') || page.includes('new Blob')) throw new Error('تحميل blob القديم ما زال موجودًا.');
if (!page.includes("form.action = '/api/legal-document'")) throw new Error('تحميل النماذج غير مربوط بالخادم.');
if (!page.includes("requestDocument(item, documentBody, 'print')")) throw new Error('الطباعة المستقلة غير مربوطة.');

async function call(format) {
  let statusCode; const headers = {}; let output;
  const response = { setHeader(k,v){headers[k]=v}, status(v){statusCode=v;return this}, send(v){output=v;return this} };
  handler({ method:'POST', body:{ name:'عقد إيجار', content:'<h1>عقد إيجار</h1><p>نموذج اختبار</p>', format } }, response);
  return { statusCode, headers, output };
}

const word = await call('word');
if (word.statusCode !== 200 || !word.headers['Content-Disposition']?.includes('attachment') || !word.output.includes('مكتب عماد عدن العقاري')) throw new Error('استجابة Word المباشرة غير صحيحة.');
const print = await call('print');
if (print.statusCode !== 200 || print.headers['Content-Type'] !== 'text/html; charset=utf-8' || !print.output.includes('window.print()')) throw new Error('صفحة الطباعة المستقلة غير صحيحة.');
if (!word.output.includes('إخلاء مسؤولية مكتب عماد عدن العقاري') || !print.output.includes('إخلاء مسؤولية مكتب عماد عدن العقاري')) throw new Error('العلامة أو إخلاء المسؤولية غير موجودين.');

console.log('OK: direct mobile Word download and standalone print/PDF flow validated.');
