import { calculateInvestmentReturn } from './investment-return-core.js';

const form = document.getElementById('roiForm');
const result = document.getElementById('roiResult');
let latest = null;

function money(value, currency) {
  try {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${Math.round(value).toLocaleString('ar-SA')} ${currency}`;
  }
}

function rating(yieldValue) {
  if (yieldValue >= 8) return { text: 'عائد مرتفع مبدئيًا', className: 'status success' };
  if (yieldValue >= 5) return { text: 'عائد متوسط مبدئيًا', className: 'status warning' };
  return { text: 'يحتاج مراجعة', className: 'status error' };
}

function render(data) {
  latest = data;
  document.getElementById('netYield').textContent = `${data.netYield.toFixed(2)}٪`;
  document.getElementById('effectiveIncome').textContent = money(data.effectiveIncome, data.currency);
  document.getElementById('netIncome').textContent = money(data.netIncome, data.currency);
  document.getElementById('totalInvestment').textContent = money(data.totalInvestment, data.currency);
  document.getElementById('paybackYears').textContent = data.paybackYears ? data.paybackYears.toFixed(1) : 'غير متاح';
  const yieldRating = document.getElementById('yieldRating');
  const status = rating(data.netYield);
  yieldRating.textContent = status.text;
  yieldRating.className = status.className;
  result.classList.add('show');
  result.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  render(calculateInvestmentReturn(Object.fromEntries(new FormData(form).entries())));
});

form.addEventListener('reset', () => {
  latest = null;
  result.classList.remove('show');
});

document.getElementById('printResult').addEventListener('click', () => window.print());
document.getElementById('shareResult').addEventListener('click', async () => {
  if (!latest) return;
  const text = [
    'ملخص حساب العائد العقاري',
    `إجمالي الاستثمار: ${money(latest.totalInvestment, latest.currency)}`,
    `الدخل الفعلي السنوي: ${money(latest.effectiveIncome, latest.currency)}`,
    `صافي الدخل السنوي: ${money(latest.netIncome, latest.currency)}`,
    `صافي العائد: ${latest.netYield.toFixed(2)}٪`,
    `مدة الاسترداد: ${latest.paybackYears ? `${latest.paybackYears.toFixed(1)} سنة` : 'غير متاحة'}`,
    'النتيجة إرشادية من موقع مكتب عماد عدن العقاري.'
  ].join('\n');
  if (navigator.share) {
    try { await navigator.share({ title: 'حساب العائد العقاري', text }); return; } catch {}
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
});

document.getElementById('year').textContent = new Date().getFullYear();
