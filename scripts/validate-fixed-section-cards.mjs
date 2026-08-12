import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const sectionPages = new Map([
  ['expatriates-property-management.html', ['request', 'my-properties', 'services', 'reports']],
  ['legal-consultant.html', ['legal-overview', 'consult', 'contracts', 'legal-faq']],
  ['property-value.html', ['request', 'value-factors', 'valuation-method', 'valuation-report']],
  ['request-reception.html', ['request', 'request-routes', 'workflow', 'professional-notice']]
]);

async function collectHtml(directory = '.') {
  const entries = await readdir(directory, { withFileTypes: true });
  const pages = [];

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.git')) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) pages.push(...await collectHtml(target));
    else if (entry.name.endsWith('.html')) pages.push(target.replace(/^\.\//, ''));
  }

  return pages;
}

const stylesheet = 'assets/css/fixed-section-cards.css';
const css = await readFile(stylesheet, 'utf8');

for (const marker of [
  'position: static',
  'grid-template-columns: repeat(4, minmax(0, 1fr))',
  'grid-template-columns: repeat(2, minmax(0, 1fr))'
]) {
  if (!css.includes(marker)) throw new Error(`تنسيق بطاقات الأقسام يفتقد: ${marker}`);
}

for (const expensiveRule of [
  'position: sticky',
  'position: fixed',
  'overflow-x',
  'scroll-snap',
  'backdrop-filter',
  'animation:',
  'box-shadow:'
]) {
  if (css.includes(expensiveRule)) throw new Error(`تنسيق بطاقات الأقسام يحتوي قاعدة غير مطلوبة: ${expensiveRule}`);
}

if (Buffer.byteLength(css) > 5_000) {
  throw new Error('ملف بطاقات الأقسام تجاوز الحد الخفيف المحدد (5KB).');
}

if (existsSync('assets/js/page-section-cards.js')) {
  throw new Error('ملف بطاقات الأقسام الديناميكي القديم ما زال موجوداً.');
}

const articleSource = await readFile('assets/js/articles.js', 'utf8');
if (articleSource.includes('page-section-cards')) {
  throw new Error('حزمة المقالات ما زالت تحمّل نظام بطاقات الأقسام القديم.');
}

const pages = await collectHtml();
let linkedPages = 0;

for (const page of pages) {
  const html = await readFile(page, 'utf8');
  const referencesStylesheet = html.includes('assets/css/fixed-section-cards.css');
  const hasCards = html.includes('class="fixed-section-card"');
  const expectedTargets = sectionPages.get(page);

  if (!expectedTargets) {
    if (referencesStylesheet || hasCards || html.includes('page-section-cards.js')) {
      throw new Error(`بطاقات الأقسام ظهرت خارج صفحات الخدمات المحددة: ${page}`);
    }
    continue;
  }

  if (!referencesStylesheet) throw new Error(`صفحة الخدمة لا تحمل التنسيق الخفيف: ${page}`);
  const cards = html.match(/class="fixed-section-card"/g) || [];
  if (cards.length !== expectedTargets.length) {
    throw new Error(`عدد بطاقات الأقسام غير صحيح في ${page}: ${cards.length}`);
  }

  for (const target of expectedTargets) {
    if (!html.includes(`href="#${target}"`)) throw new Error(`رابط القسم #${target} مفقود في ${page}`);
    if (!html.includes(`id="${target}"`)) throw new Error(`هدف القسم #${target} مفقود في ${page}`);
  }

  linkedPages += 1;
}

if (linkedPages !== sectionPages.size) {
  throw new Error(`عدد صفحات الخدمات المغطاة غير صحيح: ${linkedPages}`);
}

console.log(`نجح فحص بطاقات الأقسام الخفيفة وغير المثبتة في ${linkedPages} صفحات خدمات فقط.`);
