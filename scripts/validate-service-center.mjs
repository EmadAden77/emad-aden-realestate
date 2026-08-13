import { readFile } from 'node:fs/promises';
import { calculateInvestmentReturn } from '../assets/js/investment-return-core.js';
import reportVerificationHandler, { createVerificationCode, codeMatches } from '../api/report-verification.js';

const requiredFiles = [
  'client-services.html',
  'investment-return-calculator.html',
  'report-verification.html',
  'valuation-report.html',
  'service-complaints.html',
  'tenant-portal.html',
  'customer-account.html',
  'property-management.html'
];

const requiredFeatures = [
  'مركز متابعة الطلبات',
  'ملف العقار الرقمي',
  'بلاغات الصيانة',
  'غرفة الصفقة العقارية',
  'حاسبة صافي العائد',
  'التحقق من التقارير',
  'تقرير تثمين احترافي',
  'سجل المعاينات',
  'مركز التنبيهات',
  'بوابة المستأجر',
  'الشكاوى وضمان الخدمة'
];

const contents = new Map();
for (const path of requiredFiles) contents.set(path, await readFile(path, 'utf8'));
const directory = await readFile('site-upgrades.html', 'utf8');
for (const feature of requiredFeatures) {
  if (!directory.includes(feature)) throw new Error(`الإضافة غير موجودة في دليل الخدمات: ${feature}`);
}

const homepage = await readFile('index.html', 'utf8');
for (const path of ['client-services.html', 'investment-return-calculator.html', 'valuation-report.html', 'report-verification.html', 'tenant-portal.html', 'service-complaints.html']) {
  if (!homepage.includes(path)) throw new Error(`الرابط غير موجود في الصفحة الرئيسية: ${path}`);
}

const sitemap = await readFile('sitemap.xml', 'utf8');
for (const path of ['client-services.html', 'investment-return-calculator.html', 'report-verification.html', 'service-complaints.html']) {
  if (!sitemap.includes(path)) throw new Error(`الصفحة غير موجودة في خريطة الموقع: ${path}`);
}

const calculation = calculateInvestmentReturn({
  currency: 'SAR', purchasePrice: 100000, acquisitionCosts: 5000,
  monthlyRent: 1000, vacancyMonths: 1, maintenance: 500, management: 500, otherExpenses: 0
});
if (calculation.effectiveIncome !== 11000 || calculation.netIncome !== 10000 || calculation.totalInvestment !== 105000) {
  throw new Error('فشل اختبار حاسبة صافي العائد.');
}

const payload = { reportId: 'PM-202608-ALL-SAR', reportDate: '2026-08-12', reportType: 'PROPERTY-MANAGEMENT' };
const code = createVerificationCode(payload, 'validation-secret');
if (!codeMatches(payload, code, 'validation-secret') || codeMatches({ ...payload, reportDate: '2026-08-13' }, code, 'validation-secret')) {
  throw new Error('فشل اختبار رمز التحقق من التقرير.');
}

process.env.REPORT_SIGNING_SECRET = 'validation-secret';
let statusCode = 0;
let responseBody = null;
const response = {
  setHeader() {},
  status(value) { statusCode = value; return this; },
  json(value) { responseBody = value; return this; }
};
await reportVerificationHandler({
  method: 'POST', headers: {}, url: '/api/report-verification',
  body: { action: 'verify', ...payload, code }
}, response);
if (statusCode !== 200 || responseBody?.valid !== true) throw new Error('فشل اختبار واجهة التحقق من التقرير.');

console.log('نجح فحص الإضافات العشر وروابطها وحاسبة العائد وتوقيع التقارير.');
