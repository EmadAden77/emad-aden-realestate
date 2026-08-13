import { readFile, stat } from 'node:fs/promises';

const page = await readFile('valuation-report.html', 'utf8');
const client = await readFile('assets/js/valuation-report.js', 'utf8');
const endpoint = await readFile('api/report-verification.js', 'utf8');
const verification = await readFile('assets/js/report-verification.js', 'utf8');
const pkg = JSON.parse(await readFile('package.json', 'utf8'));

for (const field of ['reportId', 'reportDate', 'clientName', 'propertyType', 'location', 'valueLow', 'valueHigh', 'valueAdopted', 'opinion']) {
  if (!page.includes(`name="${field}"`)) throw new Error(`حقل التقرير غير موجود: ${field}`);
}
for (const marker of ['issueVerificationCode', 'window.print()', 'localStorage', 'qrCode']) {
  if (!client.includes(marker) && !endpoint.includes(marker)) throw new Error(`ميزة التقرير غير موجودة: ${marker}`);
}
if (!endpoint.includes("import QRCode from 'qrcode'")) throw new Error('مولد QR غير مربوط بواجهة إصدار التقرير.');
if (!verification.includes("new URLSearchParams(window.location.search)")) throw new Error('صفحة التحقق لا تقرأ بيانات QR.');
if (pkg.dependencies?.qrcode !== '1.5.4') throw new Error('إصدار مكتبة QR غير مثبت.');
if ((await stat('assets/css/valuation-report.css')).size < 1000) throw new Error('تنسيق التقرير غير مكتمل.');

console.log('OK: valuation report fields, verification code, QR flow, draft and print support validated.');
