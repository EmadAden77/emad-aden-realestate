import { readFileSync } from 'node:fs';

const files = [
  'deal-safety-check.html',
  'document-checklist.html'
];

const forbiddenExpressions = [
  ['وش', /(^|[^\p{L}])وش([^\p{L}]|$)/u],
  ['تبغى', /(^|[^\p{L}])تبغى([^\p{L}]|$)/u],
  ['تبي', /(^|[^\p{L}])تبي([^\p{L}]|$)/u],
  ['تقدر', /(^|[^\p{L}])تقدر([^\p{L}]|$)/u],
  ['ما أعرف', /ما أعرف/u],
  ['ما يكفي', /ما يكفي/u],
  ['ما زال/زالت', /ما زال(?:ت)?/u],
  ['ما ظهرت', /ما ظهرت/u],
  ['ما تعني', /ما تعني/u],
  ['ما تغيرت', /ما تغيرت/u],
  ['ما فيه', /ما فيه/u],
  ['ما تم', /ما تم(?:ت)?/u],
  ['بدون', /بدون/u],
  ['عشان', /عشان/u],
  ['كمّل', /كمّل/u],
  ['خذ قراءة', /خذ قراءة/u],
  ['باقي بعض', /باقي بعض/u]
];

let failed = false;

for (const file of files) {
  const source = readFileSync(file, 'utf8');

  if (!/<html\b[^>]*\blang="ar"[^>]*\bdir="rtl"/i.test(source)) {
    console.error(`${file}: يجب تحديد lang="ar" وdir="rtl" في عنصر html.`);
    failed = true;
  }

  for (const [label, pattern] of forbiddenExpressions) {
    if (pattern.test(source)) {
      console.error(`${file}: عُثر على تعبير غير معتمد في الصياغة الفصحى: ${label}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('نجح فحص اللغة العربية الفصحى في الصفحات التفاعلية.');
