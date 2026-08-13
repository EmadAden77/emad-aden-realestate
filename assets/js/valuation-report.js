import { getClerk } from './clerk-auth.js';
import { issueVerificationCode } from './report-verification-core.js';

const form = document.getElementById('reportForm');
const preview = document.getElementById('reportPreview');
const editor = document.getElementById('editorSection');
const actions = document.getElementById('printActions');
const message = document.getElementById('reportMessage');
const issueButton = document.getElementById('issueButton');
const authStatus = document.getElementById('authStatus');
const draftKey = 'emad-valuation-report-draft-v1';
let clerk;

function reportNumber() {
  const date = new Date();
  const day = date.toISOString().slice(0, 10).replaceAll('-', '');
  const random = crypto.getRandomValues(new Uint16Array(1))[0].toString().padStart(5, '0').slice(-5);
  return `VAL-${day}-${random}`;
}

function setDefaults() {
  form.elements.reportDate.value ||= new Date().toISOString().slice(0, 10);
  form.elements.reportId.value ||= reportNumber();
}

function values() { return Object.fromEntries(new FormData(form).entries()); }
function formatMoney(value) { return new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 2 }).format(Number(value || 0)); }

function render(data, issued) {
  preview.querySelectorAll('[data-output]').forEach(node => {
    const value = data[node.dataset.output] || (node.dataset.output === 'inspectionDate' ? 'لم تُجرَ معاينة' : '—');
    node.textContent = value;
  });
  preview.querySelectorAll('[data-money]').forEach(node => { node.textContent = formatMoney(data[node.dataset.money]); });
  document.getElementById('verificationCode').textContent = issued.code;
  document.getElementById('verificationQr').src = issued.qrCode;
  preview.hidden = false;
  actions.hidden = false;
  editor.hidden = true;
  preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function validateRange() {
  const low = Number(form.elements.valueLow.value);
  const high = Number(form.elements.valueHigh.value);
  const adopted = Number(form.elements.valueAdopted.value);
  if (high < low) return 'الحد الأعلى يجب أن يكون أكبر من الحد الأدنى.';
  if (adopted < low || adopted > high) return 'القيمة المرجحة يجب أن تقع داخل النطاق التقديري.';
  return '';
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const rangeError = validateRange();
  if (rangeError) { message.textContent = rangeError; return; }
  issueButton.disabled = true;
  message.textContent = 'جارٍ إصدار رمز التحقق وتجهيز QR…';
  try {
    const data = values();
    const issued = await issueVerificationCode({ reportId: data.reportId, reportDate: data.reportDate, reportType: 'VALUATION' }, () => clerk.session.getToken());
    render(data, issued);
    localStorage.removeItem(draftKey);
    message.textContent = 'تم إصدار التقرير بنجاح.';
  } catch (error) {
    message.textContent = error.message || 'تعذر إصدار التقرير.';
    issueButton.disabled = false;
  }
});

document.getElementById('saveDraft').addEventListener('click', () => {
  localStorage.setItem(draftKey, JSON.stringify(values()));
  message.textContent = 'تم حفظ المسودة على هذا الجهاز.';
});
document.getElementById('printReport').addEventListener('click', () => window.print());
document.getElementById('editReport').addEventListener('click', () => { editor.hidden = false; actions.hidden = true; preview.hidden = true; editor.scrollIntoView({ behavior: 'smooth' }); });
form.addEventListener('reset', () => setTimeout(() => { localStorage.removeItem(draftKey); setDefaults(); }, 0));

(async () => {
  setDefaults();
  const saved = JSON.parse(localStorage.getItem(draftKey) || 'null');
  if (saved) Object.entries(saved).forEach(([name, value]) => { if (form.elements[name]) form.elements[name].value = value; });
  try {
    clerk = await getClerk();
    if (!clerk.isSignedIn || !clerk.session) {
      window.location.replace(`/sign-in.html?redirect_url=${encodeURIComponent('/valuation-report.html')}`);
      return;
    }
    authStatus.textContent = `حساب موثّق: ${clerk.user?.primaryEmailAddress?.emailAddress || 'جاهز للإصدار'}`;
    issueButton.disabled = false;
  } catch (error) {
    authStatus.textContent = error.message || 'تعذر التحقق من الحساب.';
  }
})();
