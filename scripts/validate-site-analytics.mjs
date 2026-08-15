import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const excluded = new Set(['404.html', 'articles/404.html', 'social-footer-preview.html', 'google4592bd81ce202901.html']);
const failures = [];

async function htmlFiles(directory = root) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(fullPath));
    else if (entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

let covered = 0;
for (const file of await htmlFiles()) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  if (excluded.has(relative)) continue;
  const source = await readFile(file, 'utf8');
  if (!source.includes('</head>')) continue;
  if (!source.includes('/assets/js/site-analytics.js?v=20260815')) failures.push(`${relative}: تحليلات الموقع غير محمّلة.`);
  covered += 1;
}

const index = await readFile('index.html', 'utf8');
if (index.includes('<script async src="https://www.googletagmanager.com/gtag/js')) failures.push('بقي تحميل Google Analytics القديم في الصفحة الرئيسية.');

const analytics = await readFile('assets/js/site-analytics.js', 'utf8');
for (const marker of ['contact_whatsapp', 'portal_sign_in_click', 'service_select', 'form_submit', "analytics_storage: 'denied'", 'doNotTrack']) {
  if (!analytics.includes(marker)) failures.push(`ملف التحليلات يفتقد: ${marker}`);
}
if (/email|phone|formdata/i.test(analytics)) failures.push('ملف التحليلات قد يجمع حقولًا شخصية؛ راجع التنفيذ.');

if (failures.length) {
  console.error(failures.map(message => `ERROR: ${message}`).join('\n'));
  process.exit(1);
}
console.log(`OK: privacy-aware analytics are installed on ${covered} pages.`);
