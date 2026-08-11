import { readFileSync } from 'node:fs';

const requiredFiles = [
  'sign-in.html',
  'customer-account.html',
  'assets/css/customer-auth.css',
  'assets/js/clerk-auth.js',
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

for (const page of ['sign-in.html', 'customer-account.html']) {
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

const clientSource = [contents.get('assets/js/clerk-auth.js'), contents.get('sign-in.html'), contents.get('customer-account.html')].join('\n');
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

for (const file of ['assets/js/clerk-auth.js', 'api/auth-config.js', 'api/customer-session.js']) {
  try { new Function(contents.get(file) || ''); } catch (error) {
    if (!/Cannot use import statement|Unexpected token 'export'/.test(error.message)) {
      console.error(`${file}: خطأ في JavaScript: ${error.message}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('نجح فحص تسجيل دخول العملاء وحماية الجلسة.');
