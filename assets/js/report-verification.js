import { verifyReportCode } from './report-verification-core.js';

const form = document.getElementById('verifyForm');
const result = document.getElementById('verificationResult');
const typeNames = {
  'PROPERTY-MANAGEMENT': 'تقرير إدارة أملاك',
  VALUATION: 'تقرير تثمين عقاري',
  INSPECTION: 'تقرير معاينة',
  TRANSACTION: 'تقرير متابعة صفقة'
};

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const values = Object.fromEntries(new FormData(form).entries());
  result.className = 'notice';
  result.textContent = 'جارٍ التحقق من الرمز…';
  try {
    const data = await verifyReportCode(values);
    result.className = data.valid ? 'notice success' : 'notice error';
    result.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = data.valid ? 'الرمز صحيح وصادر عن نظام التقارير' : 'تعذر مطابقة الرمز';
    const detail = document.createElement('p');
    detail.textContent = data.valid
      ? `${typeNames[values.reportType]} رقم ${values.reportId} بتاريخ ${values.reportDate}. يؤكد ذلك أن الرمز أُصدر بعد إنشاء التقرير من حساب مسجل، ولا يحول التقرير إلى مستند محاسبي أو حكومي.`
      : 'راجع رقم التقرير وتاريخه ونوعه والرمز المطبوع، أو تواصل مع المكتب للتحقق اليدوي.';
    detail.className = 'result-detail';
    result.append(title, detail);
  } catch (error) {
    result.className = 'notice error';
    result.textContent = error.message || 'تعذر تشغيل خدمة التحقق حاليًا.';
  }
});

form.addEventListener('reset', () => {
  result.className = 'empty';
  result.innerHTML = '<div><strong>بانتظار بيانات التقرير</strong><br><span>ستظهر نتيجة المطابقة هنا.</span></div>';
});

document.getElementById('year').textContent = new Date().getFullYear();
