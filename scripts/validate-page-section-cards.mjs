import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const ignoredPages = new Set([
  '404.html',
  'articles/404.html',
  'google459ba0509d67c358.html',
  'social-footer-preview.html'
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

const source = await readFile('assets/js/page-section-cards.js', 'utf8');
for (const marker of [
  'محتويات هذه الصفحة',
  'page-section-directory__list',
  'scroll-snap-type',
  'role="tablist"',
  'IntersectionObserver',
  'prefers-reduced-motion'
]) {
  if (!source.includes(marker)) throw new Error(`مكوّن بطاقات الأقسام يفتقد: ${marker}`);
}

const articleSource = await readFile('assets/js/articles.js', 'utf8');
if (!articleSource.includes('page-section-cards.js')) {
  throw new Error('صفحات المقالات لا تحمّل بطاقات محتويات الصفحة.');
}

const pages = await collectHtml();
let covered = 0;
for (const page of pages) {
  if (ignoredPages.has(page)) continue;
  const html = await readFile(page, 'utf8');
  if (/http-equiv=["']refresh["']/i.test(html)) continue;
  const references = (html.match(/page-section-cards\.js/g) || []).length;
  const usesArticleBundle = /assets\/js\/articles\.js/.test(html);
  if (!references && !usesArticleBundle) {
    throw new Error(`الصفحة غير مشمولة ببطاقات المحتويات: ${page}`);
  }
  if (references > 1) throw new Error(`تحميل مكرر لبطاقات المحتويات: ${page}`);
  covered += 1;
}

if (covered < 190) throw new Error(`تغطية الصفحات غير كافية: ${covered}`);
console.log(`نجح فحص بطاقات محتويات الصفحات وتغطية ${covered} صفحة.`);
