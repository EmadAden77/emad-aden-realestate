import { access, readFile, stat } from 'node:fs/promises';

const failures = [];
const index = await readFile('index.html', 'utf8');
const manifest = await readFile('manifest.json', 'utf8');
const worker = await readFile('sw.js', 'utf8');
const vercel = await readFile('vercel.json', 'utf8');

if (!index.includes('rel="preload" as="style"')) failures.push('خطوط الصفحة الرئيسية ما زالت تحجب العرض الأول.');
if (!index.includes('IMG_5-social.jpg')) failures.push('صورة المشاركة الخفيفة غير مستخدمة في الصفحة الرئيسية.');
if (!manifest.includes('IMG_5-header.jpg')) failures.push('التطبيق لا يستخدم أيقونة الشعار الخفيفة.');
if (worker.includes("'/IMG_5.jpg'")) failures.push('عامل الخدمة ما زال يحمّل الشعار الأصلي الكبير مسبقًا.');
if (worker.includes("hit || fetch(request)")) failures.push('عامل الخدمة ما زال يستخدم cache-first لملفات JavaScript وCSS.');
if (!worker.includes("['style', 'script']")) failures.push('عامل الخدمة لا يطلب ملفات JavaScript وCSS من الشبكة أولًا.');
if (vercel.includes('max-age=31536000, immutable')) failures.push('ما زالت ملفات غير مبصومة محفوظة سنة كاملة دون تحقق.');

try {
  await access('aden-hero.mp4');
  failures.push('ملف الفيديو الكبير غير المستخدم ما زال موجودًا.');
} catch {}



const socialImage = await stat('IMG_5-social.jpg');
const primaryImage = await stat('IMG_5.jpg');
if (socialImage.size > 200_000) failures.push('صورة المشاركة أكبر من 200 كيلوبايت.');
if (primaryImage.size > 200_000) failures.push('ملف الشعار الأساسي أكبر من 200 كيلوبايت.');

if (failures.length) {
  console.error(failures.map(message => `ERROR: ${message}`).join('\n'));
  process.exit(1);
}

console.log(`OK: performance safeguards passed; primary image is ${Math.round(primaryImage.size / 1024)} KB and social image is ${Math.round(socialImage.size / 1024)} KB.`);
