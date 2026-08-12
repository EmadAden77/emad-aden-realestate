import { readFile } from 'node:fs/promises';

const [home, navigation, enhancements, worker] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('assets/js/luxury-home.js', 'utf8'),
  readFile('assets/css/luxury-enhancements.css', 'utf8'),
  readFile('sw.js', 'utf8')
]);

const assetVersion = 'v=20260812-2';

if (!home.includes(`assets/js/luxury-home.js?${assetVersion}`)) {
  throw new Error('الصفحة الرئيسية لا تطلب نسخة التنقل الجديدة.');
}

if (!home.includes('html body.page-leaving{opacity:1!important;transform:none!important}')) {
  throw new Error('حماية الصفحة من الإخفاء القديم غير موجودة.');
}

for (const obsoleteBehavior of [
  "body.classList.add('page-leaving')",
  'setTimeout(()=>location.href',
  'body.page-leaving{opacity:0'
]) {
  if (navigation.includes(obsoleteBehavior) || enhancements.includes(obsoleteBehavior)) {
    throw new Error(`ما زال سلوك الانتقال المسبب للاختفاء موجوداً: ${obsoleteBehavior}`);
  }
}

if (!navigation.includes(`assets/css/luxury-enhancements.css?${assetVersion}`)) {
  throw new Error('تنسيق الصفحة المحسن لا يستخدم رقم النسخة الجديدة.');
}

if (!navigation.includes("navigator.serviceWorker.register('/sw.js'")) {
  throw new Error('الصفحة الرئيسية لا تطلب تحديث التخزين المؤقت.');
}

if (!worker.includes("const VERSION = 'emad-realestate-v9'")) {
  throw new Error('نسخة التخزين المؤقت لم تُحدّث.');
}

if (!worker.includes(`/assets/js/luxury-home.js?${assetVersion}`)) {
  throw new Error('عامل الخدمة لا يخزن ملف التنقل الجديد.');
}

if (!worker.includes("caches.match(request, { ignoreSearch: true })")) {
  throw new Error('الصفحات المحفوظة لا تظهر فوراً أثناء تحديث الشبكة.');
}

if (!enhancements.includes('/* رأس الموقع الاحترافي — خفيف، واضح، ولا يحجب المحتوى */')) {
  throw new Error('تنسيق رأس الموقع الاحترافي غير موجود.');
}

if (!enhancements.includes('.topbar.is-scrolled{transform:translateY(calc(-100% - 16px))')) {
  throw new Error('رأس الموقع لا يختفي عند النزول كما هو مطلوب.');
}

console.log('نجح فحص الرجوع من الأقسام ورأس الموقع الاحترافي دون شاشة سوداء.');
