const OFFICE_WHATSAPP = '967773571889';

function decodePayload() {
  const token = new URLSearchParams(location.search).get('access');
  if (!token) return null;
  try {
    const normalized = token.replaceAll('-', '+').replaceAll('_', '/');
    const json = decodeURIComponent(escape(atob(normalized)));
    const data = JSON.parse(json);
    if (!data || typeof data !== 'object') return null;
    return {
      tenant: String(data.tenant || '').slice(0, 100),
      property: String(data.property || '').slice(0, 100),
      unit: String(data.unit || '').slice(0, 50),
      monthlyRent: String(data.monthlyRent || '').slice(0, 60),
      status: String(data.status || '').slice(0, 60),
      nextDue: String(data.nextDue || '').slice(0, 40)
    };
  } catch { return null; }
}

function renderSummary(data) {
  if (!data) return;
  const box = document.getElementById('tenantSummary');
  box.replaceChildren();
  const status = document.createElement('span');
  status.className = 'status success';
  status.textContent = 'رابط ملخص نشط';
  const heading = document.createElement('strong');
  heading.textContent = `${data.property || 'العقار'} — ${data.unit || 'الوحدة'}`;
  const details = document.createElement('span');
  details.textContent = `المستأجر: ${data.tenant || 'غير محدد'} · الإيجار: ${data.monthlyRent || 'غير محدد'} · الحالة: ${data.status || 'غير محددة'} · الاستحقاق القادم: ${data.nextDue || 'غير محدد'}`;
  box.append(status, heading, details);
  const form = document.getElementById('tenantMaintenanceForm');
  form.elements.namedItem('tenantName').value = data.tenant;
  form.elements.namedItem('propertyName').value = data.property;
  form.elements.namedItem('unit').value = data.unit;
}

document.getElementById('tenantMaintenanceForm').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const values = Object.fromEntries(new FormData(form).entries());
  const id = `TM-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const message = [
    'بلاغ صيانة من بوابة المستأجر',
    `رقم البلاغ: ${id}`,
    `المستأجر: ${values.tenantName}`,
    `العقار: ${values.propertyName}`,
    `الوحدة: ${values.unit}`,
    `الأولوية: ${values.priority}`,
    `المشكلة: ${values.details}`,
    `وقت التواصل: ${values.contactTime || 'غير محدد'}`,
    '',
    'أرجو تأكيد استلام البلاغ وتحديد الخطوة التالية.'
  ].join('\n');
  window.open(`https://wa.me/${OFFICE_WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
});

renderSummary(decodePayload());
document.getElementById('year').textContent = new Date().getFullYear();
