const OFFICE_WHATSAPP = '967773571889';
const STORAGE_KEY = 'emad-service-complaints:v1';
const form = document.getElementById('complaintForm');
const list = document.getElementById('complaintsList');
let complaints = load();

function load() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value.slice(0, 20) : [];
  } catch { return []; }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
}

function reference() {
  const date = new Date().toISOString().slice(2, 10).replaceAll('-', '');
  return `SC-${date}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function dateText(value) {
  return new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function message(item) {
  return [
    'شكوى أو ملاحظة خدمة',
    `الرقم المرجعي: ${item.id}`,
    `الاسم: ${item.name}`,
    `الطلب المرتبط: ${item.relatedRequest || 'لا يوجد'}`,
    `التصنيف: ${item.category}`,
    `الأولوية: ${item.priority}`,
    `التفاصيل: ${item.details}`,
    '',
    'أرجو تأكيد استلام الشكوى وتحديد خطوة المتابعة.'
  ].join('\n');
}

function render() {
  list.replaceChildren();
  if (!complaints.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.innerHTML = '<div><strong>لا توجد شكاوى محفوظة</strong><br><span>بعد إنشاء الشكوى سيظهر رقمها هنا.</span></div>';
    list.append(empty);
    return;
  }
  complaints.forEach(item => {
    const card = document.createElement('article');
    card.className = 'list-item';
    const head = document.createElement('div');
    head.className = 'list-item-head';
    const title = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = item.category;
    const small = document.createElement('small');
    small.textContent = `${item.id} · ${dateText(item.createdAt)}`;
    title.append(strong, small);
    const status = document.createElement('span');
    status.className = 'status warning';
    status.textContent = 'بانتظار إرسالها';
    head.append(title, status);
    const actions = document.createElement('div');
    actions.className = 'form-actions';
    const send = document.createElement('a');
    send.className = 'button primary';
    send.textContent = 'فتح واتساب';
    send.href = `https://wa.me/${OFFICE_WHATSAPP}?text=${encodeURIComponent(message(item))}`;
    send.target = '_blank';
    send.rel = 'noopener';
    const remove = document.createElement('button');
    remove.className = 'button ghost';
    remove.type = 'button';
    remove.textContent = 'حذف من الجهاز';
    remove.addEventListener('click', () => {
      complaints = complaints.filter(entry => entry.id !== item.id);
      save();
      render();
    });
    actions.append(send, remove);
    card.append(head, actions);
    list.append(card);
  });
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const values = Object.fromEntries(new FormData(form).entries());
  const item = {
    id: reference(),
    name: values.name.trim(),
    relatedRequest: values.relatedRequest.trim(),
    category: values.category,
    priority: values.priority,
    details: values.details.trim(),
    createdAt: new Date().toISOString()
  };
  complaints.unshift(item);
  save();
  render();
  form.reset();
  window.open(`https://wa.me/${OFFICE_WHATSAPP}?text=${encodeURIComponent(message(item))}`, '_blank', 'noopener');
});

document.getElementById('year').textContent = new Date().getFullYear();
render();
