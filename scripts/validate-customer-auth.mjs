import { readFileSync } from 'node:fs';

const requiredFiles = [
  'sign-in.html',
  'customer-account.html',
  'client-services.html',
  'assets/css/customer-auth.css',
  'assets/js/clerk-auth.js',
  'assets/js/customer-portal.js',
  'property-management.html',
  'expatriates-property-management.html',
  'assets/css/property-management.css',
  'assets/js/property-management.js',
  'api/auth-config.js',
  'api/customer-session.js',
  'api/customer-portal-state.js',
  'api/property-management-state.js',
  'api/_lib/customer-auth.js',
  'api/_lib/portal-state.js',
  'api/_lib/property-state.js',
  'api/_lib/supabase-rest.js',
  'supabase/customer-portal.sql',
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
const customerAuthApi = contents.get('api/_lib/customer-auth.js') || '';
if (!sessionApi.includes('authenticateCustomer') || !customerAuthApi.includes('authenticateRequest') || !customerAuthApi.includes('authorizedParties')) {
  console.error('واجهة جلسة العميل لا تنفذ التحقق الخادمي المطلوب.');
  failed = true;
}

const configApi = contents.get('api/auth-config.js') || '';
if (!configApi.includes('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') || configApi.includes('sk_live_')) {
  console.error('إعداد واجهة المصادقة غير صالح.');
  failed = true;
}
for (const marker of ['formFieldInputPlaceholder__emailAddress', 'أدخل بريدك الإلكتروني', 'customerLocalization']) {
  if (!configApi.includes(marker)) {
    console.error(`تعريب لوحة تسجيل الدخول غير مكتمل: ${marker}`);
    failed = true;
  }
}

const signInPage = contents.get('sign-in.html') || '';
const authStyles = contents.get('assets/css/customer-auth.css') || '';
const authClient = contents.get('assets/js/clerk-auth.js') || '';
for (const marker of ['auth-card-heading', 'auth-card-badge', 'auth-help', 'نموذج تسجيل دخول العملاء']) {
  if (!signInPage.includes(marker)) {
    console.error(`لوحة تسجيل الدخول الاحترافية غير مكتملة: ${marker}`);
    failed = true;
  }
}
if (!signInPage.includes('<body class="sign-in-page">') || !signInPage.includes('content="#191b1e"')) {
  console.error('صفحة تسجيل الدخول لا تستخدم هوية الأبيض والأسود المستقلة.');
  failed = true;
}
for (const marker of ['colorForeground', 'colorMutedForeground', 'colorInputForeground', 'colorPrimaryForeground']) {
  if (!authClient.includes(marker)) {
    console.error(`إعداد تباين Clerk الحديث غير موجود: ${marker}`);
    failed = true;
  }
}
if (!authClient.includes("clerkAppearance('monochrome')") || !authClient.includes("mode === 'monochrome'")) {
  console.error('نموذج تسجيل الدخول لا يستخدم مظهر Clerk الأحادي.');
  failed = true;
}
for (const marker of ['--clerk-color-foreground', '.cl-formFieldInput', '.auth-card-heading']) {
  if (!authStyles.includes(marker)) {
    console.error(`تنسيق لوحة تسجيل الدخول غير مكتمل: ${marker}`);
    failed = true;
  }
}
const loginStyles = authStyles.slice(
  authStyles.indexOf('/* لوحة تسجيل الدخول */'),
  authStyles.indexOf('/* بوابة العميل */')
).toLowerCase();
for (const accent of ['#d8b56c', '#efd99f', '#4ac58a', '#ef6b68', '#efd28b', '#d4a94f', '#baf1d6', '#ffc2c0', 'rgba(216,181,108', 'rgba(74,197,138', 'rgba(239,107,104', 'var(--gold', 'var(--green', 'var(--red']) {
  if (loginStyles.includes(accent)) {
    console.error(`عُثر على لون غير أحادي داخل صفحة تسجيل الدخول: ${accent}`);
    failed = true;
  }
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
for (const marker of ['header-portal-mini', 'href="customer-account.html"', 'aria-label="فتح بوابة العملاء"']) {
  if (!homepage.includes(marker)) {
    console.error(`بطاقة بوابة العملاء في رأس الصفحة غير مكتملة: ${marker}`);
    failed = true;
  }
}
if (homepage.includes('customer-portal-section') || homepage.includes('customer-portal-grid')) {
  console.error('يجب ألا يعود قسم بوابة العملاء الكبير إلى الصفحة الرئيسية.');
  failed = true;
}
if (homepage.includes('customerLoginModal') || homepage.includes('customer-login-trigger')) {
  console.error('تفاصيل العملاء يجب أن تفتح في صفحة البوابة المستقلة، لا في نافذة داخل الصفحة الرئيسية.');
  failed = true;
}
const serviceCenterPage = contents.get('client-services.html') || '';
if (!serviceCenterPage.includes('href="customer-account.html"') || serviceCenterPage.includes('index.html#customer-portal')) {
  console.error('مركز خدمات المتابعة لا يوجّه الزائر إلى صفحة بوابة العملاء المستقلة.');
  failed = true;
}
if (!portalSource.includes('localStorage') || !portalSource.includes('/api/customer-portal-state') || !portalSource.includes('getAuthToken') || portalSource.includes('innerHTML')) {
  console.error('بوابة العميل لا تطبق المزامنة المركزية مع النسخة المحلية الآمنة.');
  failed = true;
}
if (!portalSource.includes('wa.me') || !portalSource.includes('بانتظار تأكيد المكتب')) {
  console.error('بوابة العميل لا تنفذ إرسال الطلب ومتابعة حالته الأولية.');
  failed = true;
}

const managementPage = contents.get('property-management.html') || '';
const expatriatesPage = contents.get('expatriates-property-management.html') || '';
const managementSource = contents.get('assets/js/property-management.js') || '';
for (const marker of ['id="my-properties"', 'تابع أملاكك التي يديرها المكتب', 'redirect_url=%2Fproperty-management.html']) {
  if (!expatriatesPage.includes(marker)) {
    console.error(`صفحة إدارة أملاك المغتربين لا تحتوي مدخل العميل المطلوب: ${marker}`);
    failed = true;
  }
}
if (!managementPage.includes("loadCustomerAccount({ accountPath: '/property-management.html' })")) {
  console.error('صفحة إدارة الأملاك لا تعيد العميل إلى ملف أملاكه بعد تسجيل الدخول.');
  failed = true;
}
const clerkSource = contents.get('assets/js/clerk-auth.js') || '';
if (!clerkSource.includes('safeRedirectPath') || !clerkSource.includes('redirectPath')) {
  console.error('تسجيل الدخول لا يدعم إعادة التوجيه الآمنة إلى ملف إدارة الأملاك.');
  failed = true;
}
for (const marker of ['propertyForm', 'tenantForm', 'rentForm', 'maintenanceForm', 'expenseForm', 'monthlyReport']) {
  if (!managementPage.includes(marker)) {
    console.error(`property-management.html: العنصر المطلوب غير موجود: ${marker}`);
    failed = true;
  }
}
if (!managementSource.includes('localStorage') || !managementSource.includes('/api/property-management-state') || !managementSource.includes('getToken') || managementSource.includes('innerHTML')) {
  console.error('تقارير إدارة الأملاك لا تطبق المزامنة المركزية مع النسخة المحلية الآمنة.');
  failed = true;
}
if (!managementSource.includes('renderReport') || !managementSource.includes('window.print')) {
  console.error('إنشاء التقرير الشهري أو طباعته غير مكتمل.');
  failed = true;
}

const portalApi = contents.get('api/customer-portal-state.js') || '';
const propertyApi = contents.get('api/property-management-state.js') || '';
const storageApi = contents.get('api/_lib/supabase-rest.js') || '';
const storageSql = contents.get('supabase/customer-portal.sql') || '';
for (const [file, source, markers] of [
  ['api/customer-portal-state.js', portalApi, ['authenticateCustomer', 'sanitizePortalState', 'isTrustedMutation', 'MAX_BODY_BYTES']],
  ['api/property-management-state.js', propertyApi, ['authenticateCustomer', 'sanitizePropertyState', 'isTrustedMutation', 'MAX_BODY_BYTES']],
  ['api/_lib/supabase-rest.js', storageApi, ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY', 'Authorization', 'Bearer']]
]) {
  for (const marker of markers) {
    if (!source.includes(marker)) {
      console.error(`${file}: الحفظ المركزي يفتقد الحماية المطلوبة: ${marker}`);
      failed = true;
    }
  }
}
for (const marker of ['customer_portal_states', 'property_management_states', 'enable row level security', 'revoke all', 'service_role']) {
  if (!storageSql.toLowerCase().includes(marker.toLowerCase())) {
    console.error(`مخطط قاعدة البيانات يفتقد: ${marker}`);
    failed = true;
  }
}

for (const file of ['assets/js/clerk-auth.js', 'assets/js/customer-portal.js', 'assets/js/property-management.js', 'api/auth-config.js', 'api/customer-session.js', 'api/customer-portal-state.js', 'api/property-management-state.js', 'api/_lib/customer-auth.js', 'api/_lib/portal-state.js', 'api/_lib/property-state.js', 'api/_lib/supabase-rest.js']) {
  try { new Function(contents.get(file) || ''); } catch (error) {
    if (!/Cannot use import statement|Unexpected token 'export'/.test(error.message)) {
      console.error(`${file}: خطأ في JavaScript: ${error.message}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('نجح فحص تسجيل دخول العملاء وحماية الجلسة.');
