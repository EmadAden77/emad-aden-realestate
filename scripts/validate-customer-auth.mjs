import { readFileSync } from 'node:fs';

const requiredFiles = [
  'sign-in.html',
  'customer-account.html',
  'assets/css/customer-auth.css',
  'assets/js/clerk-auth.js',
  'assets/js/customer-portal.js',
  'property-management.html',
  'assets/css/property-management.css',
  'assets/js/property-management.js',
  'api/auth-config.js',
  'api/customer-session.js',
  'package.json'
];

let failed = false;
const contents = new Map();

for (const file of requiredFiles) {
  try {
    contents.set(file, readFileSync(file, 'utf8'));
  } catch {
    console.error(`الملف المطلوب غير موجود: ${file}`);
    failed = true;
  }
}

for (const page of ['sign-in.html', 'customer-account.html', 'property-management.html']) {
  const source = contents.get(page) || '';
  if (!/<html\b[^>]*lang="ar"[^>]*dir="rtl"/i.test(source)) {
    console.error(`${page}: يجب ضبط اللغة العربية واتجاه RTL.`);
    failed = true;
  }
  if (!/name="robots" content="noindex/i.test(source)) {
    console.error(`${page}: يجب منع فهرسة صفحات الحساب.`);
    failed = true;
  }
}

const clientSource = [contents.get('assets/js/clerk-auth.js'), contents.get('assets/js/customer-portal.js'), contents.get('assets/js/property-management.js'), contents.get('sign-in.html'), contents.get('customer-account.html'), contents.get('property-management.html')].join('\n');
if (/\bsk_(?:test|live)_/i.test(clientSource) || /CLERK_SECRET_KEY/.test(clientSource)) {
  console.error('عُثر على مفتاح سري أو مرجع سري في ملفات المتصفح.');
  failed = true;
}

const sessionApi = contents.get('api/customer-session.js') || '';
if (!sessionApi.includes('authenticateRequest') || !sessionApi.includes('authorizedParties')) {
  console.error('واجهة جلسة العميل لا تنفذ التحقق الخادمي المطلوب.');
  failed = true;
}

const configApi = contents.get('api/auth-config.js') || '';
if (!configApi.includes('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') || configApi.includes('sk_live_')) {
  console.error('إعداد واجهة المصادقة غير صالح.');
  failed = true;
}

const accountPage = contents.get('customer-account.html') || '';
const portalSource = contents.get('assets/js/customer-portal.js') || '';
for (const marker of ['newRequestForm', 'appointmentForm', 'requestsList', 'draftStatus', 'portalPreview', 'portalAccessModal', 'data-private-section']) {
  if (!accountPage.includes(marker)) {
    console.error(`customer-account.html: العنصر المطلوب غير موجود: ${marker}`);
    failed = true;
  }
}
if (!accountPage.includes('هذه البوابة خاصة بعملاء المكتب') || !accountPage.includes('getClerk, loadCustomerAccount')) {
  console.error('بوابة العملاء لا تتيح العرض العام مع إبقاء التفاصيل خلف تسجيل الدخول.');
  failed = true;
}
const homepage = readFileSync('index.html', 'utf8');
if (!homepage.includes('href="customer-account.html">بوابة العملاء</a>')) {
  console.error('رابط بوابة العملاء غير ظاهر بوضوح في الصفحة الرئيسية.');
  failed = true;
}
if (!portalSource.includes('localStorage') || !portalSource.includes('userId') || portalSource.includes('innerHTML')) {
  console.error('بوابة العميل لا تطبق الحفظ المحلي المعزول بالطريقة المطلوبة.');
  failed = true;
}
if (!portalSource.includes('wa.me') || !portalSource.includes('بانتظار تأكيد المكتب')) {
  console.error('بوابة العميل لا تنفذ إرسال الطلب ومتابعة حالته الأولية.');
  failed = true;
}

const managementPage = contents.get('property-management.html') || '';
const managementSource = contents.get('assets/js/property-management.js') || '';
for (const marker of ['propertyForm', 'tenantForm', 'rentForm', 'maintenanceForm', 'expenseForm', 'monthlyReport']) {
  if (!managementPage.includes(marker)) {
    console.error(`property-management.html: العنصر المطلوب غير موجود: ${marker}`);
    failed = true;
  }
}
if (!managementSource.includes('localStorage') || !managementSource.includes('userId') || managementSource.includes('innerHTML')) {
  console.error('تقارير إدارة الأملاك لا تطبق الحفظ المحلي المعزول بالطريقة المطلوبة.');
  failed = true;
}
if (!managementSource.includes('renderReport') || !managementSource.includes('window.print')) {
  console.error('إنشاء التقرير الشهري أو طباعته غير مكتمل.');
  failed = true;
}

for (const file of ['assets/js/clerk-auth.js', 'assets/js/customer-portal.js', 'assets/js/property-management.js', 'api/auth-config.js', 'api/customer-session.js']) {
  try { new Function(contents.get(file) || ''); } catch (error) {
    if (!/Cannot use import statement|Unexpected token 'export'/.test(error.message)) {
      console.error(`${file}: خطأ في JavaScript: ${error.message}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('نجح فحص تسجيل دخول العملاء وحماية الجلسة.');
