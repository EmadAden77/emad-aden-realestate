const OFFICE_WHATSAPP = '967773571889';
const STORAGE_VERSION = 'v1';

function storageKey(userId) {
  return `emad-customer-portal:${STORAGE_VERSION}:${userId}`;
}

function emptyState() {
  return { draft: null, draftUpdatedAt: null, requests: [], appointments: [] };
}

function loadState(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    if (!parsed || typeof parsed !== 'object') return emptyState();
    return {
      draft: parsed.draft && typeof parsed.draft === 'object' ? parsed.draft : null,
      draftUpdatedAt: parsed.draftUpdatedAt || null,
      requests: Array.isArray(parsed.requests) ? parsed.requests.slice(0, 30) : [],
      appointments: Array.isArray(parsed.appointments) ? parsed.appointments.slice(0, 20) : []
    };
  } catch {
    return emptyState();
  }
}

function saveState(key, state) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function makeId(prefix) {
  const date = new Date().toISOString().slice(2, 10).replaceAll('-', '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${date}-${random}`;
}

function formatDate(value, includeTime = false) {
  if (!value) return 'غير محدد';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ar-SA', includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(date);
}

function createElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (typeof text === 'string') node.textContent = text;
  return node;
}

function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function fillForm(form, values) {
  if (!values) return;
  Object.entries(values).forEach(([name, value]) => {
    const field = form.elements.namedItem(name);
    if (field && typeof value === 'string') field.value = value;
  });
}

function whatsappUrl(message) {
  return `https://wa.me/${OFFICE_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export function initCustomerPortal({ userId, userName, userEmail }) {
  if (!userId) throw new Error('تعذر تحديد حساب العميل.');

  const key = storageKey(userId);
  const state = loadState(key);
  const requestForm = document.getElementById('newRequestForm');
  const appointmentForm = document.getElementById('appointmentForm');
  const requestsList = document.getElementById('requestsList');
  const appointmentsList = document.getElementById('appointmentsList');
  const draftStatus = document.getElementById('draftStatus');
  const portalNotice = document.getElementById('portalNotice');
  const today = new Date().toISOString().slice(0, 10);
  appointmentForm.elements.namedItem('appointmentDate').min = today;

  function notify(message, tone = 'success') {
    portalNotice.textContent = message;
    portalNotice.dataset.tone = tone;
    portalNotice.hidden = false;
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => { portalNotice.hidden = true; }, 5200);
  }

  function persist(message) {
    const saved = saveState(key, state);
    if (!saved) notify('تعذر الحفظ على هذا الجهاز. تأكد من إعدادات المتصفح.', 'error');
    else if (message) notify(message);
    return saved;
  }

  function switchTab(name) {
    document.querySelectorAll('[data-portal-view]').forEach(view => {
      view.hidden = view.dataset.portalView !== name;
    });
    document.querySelectorAll('[data-portal-tab]').forEach(button => {
      const active = button.dataset.portalTab === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    const target = document.querySelector(`[data-portal-view="${name}"]`);
    if (target) target.focus({ preventScroll: true });
  }

  function renderMetrics() {
    document.getElementById('requestCount').textContent = String(state.requests.length);
    document.getElementById('draftCount').textContent = state.draft ? '1' : '0';
    document.getElementById('appointmentCount').textContent = String(
      state.appointments.filter(item => item.status === 'في انتظار التأكيد').length
    );
  }

  function requestMessage(item) {
    return [
      'طلب خدمة من حساب العميل',
      `الرقم المرجعي: ${item.id}`,
      `العميل: ${userName}`,
      `البريد الإلكتروني: ${userEmail || 'غير متاح'}`,
      `الخدمة: ${item.service}`,
      `المنطقة أو المديرية: ${item.district || 'غير محددة'}`,
      `طريقة التواصل: ${item.contactMethod}`,
      `ملخص الطلب: ${item.summary}`,
      '',
      'أرجو تأكيد استلام الطلب وتحديد الخطوة التالية.'
    ].join('\n');
  }

  function appointmentMessage(item) {
    return [
      'طلب حجز موعد من حساب العميل',
      `الرقم المرجعي: ${item.id}`,
      `العميل: ${userName}`,
      `البريد الإلكتروني: ${userEmail || 'غير متاح'}`,
      `التاريخ المطلوب: ${item.date}`,
      `الفترة: ${item.time}`,
      `طريقة الموعد: ${item.channel}`,
      `ملاحظة: ${item.notes || 'لا توجد'}`,
      '',
      'أرجو تأكيد الموعد أو اقتراح وقت بديل.'
    ].join('\n');
  }

  function requestCard(item) {
    const card = createElement('article', 'portal-item');
    const top = createElement('div', 'portal-item-top');
    const titleWrap = createElement('div');
    titleWrap.append(
      createElement('strong', '', item.service),
      createElement('span', '', item.id)
    );
    const badge = createElement('span', 'portal-badge waiting', item.status);
    top.append(titleWrap, badge);

    const details = createElement('div', 'portal-item-details');
    details.append(
      createElement('span', '', `المنطقة: ${item.district || 'غير محددة'}`),
      createElement('span', '', `أُنشئ: ${formatDate(item.createdAt, true)}`)
    );

    const progress = createElement('div', 'request-progress');
    ['تم تجهيز الطلب', 'بانتظار تأكيد المكتب', 'بدء المتابعة'].forEach((label, index) => {
      const step = createElement('span', index === 0 ? 'done' : index === 1 ? 'current' : '', label);
      progress.append(step);
    });

    const actions = createElement('div', 'portal-item-actions');
    const send = createElement('a', 'mini-button primary', 'فتح واتساب');
    send.href = whatsappUrl(requestMessage(item));
    send.target = '_blank';
    send.rel = 'noopener';
    const remove = createElement('button', 'mini-button', 'حذف من الجهاز');
    remove.type = 'button';
    remove.addEventListener('click', () => {
      state.requests = state.requests.filter(request => request.id !== item.id);
      persist('حُذف الطلب من هذا الجهاز.');
      renderAll();
    });
    actions.append(send, remove);
    card.append(top, details, progress, actions);
    return card;
  }

  function appointmentCard(item) {
    const card = createElement('article', 'portal-item compact');
    const top = createElement('div', 'portal-item-top');
    const titleWrap = createElement('div');
    titleWrap.append(
      createElement('strong', '', `${item.channel} — ${item.time}`),
      createElement('span', '', `${formatDate(item.date)} · ${item.id}`)
    );
    top.append(titleWrap, createElement('span', 'portal-badge waiting', item.status));
    const actions = createElement('div', 'portal-item-actions');
    const confirm = createElement('a', 'mini-button primary', 'طلب التأكيد');
    confirm.href = whatsappUrl(appointmentMessage(item));
    confirm.target = '_blank';
    confirm.rel = 'noopener';
    const remove = createElement('button', 'mini-button', 'إلغاء محليًا');
    remove.type = 'button';
    remove.addEventListener('click', () => {
      state.appointments = state.appointments.filter(appointment => appointment.id !== item.id);
      persist('أُلغي الموعد من هذا الجهاز.');
      renderAll();
    });
    actions.append(confirm, remove);
    card.append(top, actions);
    return card;
  }

  function renderRequests() {
    requestsList.replaceChildren();
    if (!state.requests.length) {
      const empty = createElement('div', 'portal-empty');
      empty.append(
        createElement('strong', '', 'لا توجد طلبات محفوظة'),
        createElement('span', '', 'أنشئ طلبك الأول، وسيظهر هنا رقمه وحالته.')
      );
      requestsList.append(empty);
      return;
    }
    state.requests.forEach(item => requestsList.append(requestCard(item)));
  }

  function renderAppointments() {
    appointmentsList.replaceChildren();
    if (!state.appointments.length) {
      const empty = createElement('div', 'portal-empty small');
      empty.append(
        createElement('strong', '', 'لا توجد مواعيد'),
        createElement('span', '', 'احجز موعد تواصل وحدد الوقت والطريقة المناسبة.')
      );
      appointmentsList.append(empty);
      return;
    }
    state.appointments.forEach(item => appointmentsList.append(appointmentCard(item)));
  }

  function renderDraft() {
    if (!state.draft || !state.draftUpdatedAt) {
      draftStatus.textContent = 'لا توجد مسودة محفوظة.';
      return;
    }
    draftStatus.textContent = `حُفظت المسودة تلقائيًا: ${formatDate(state.draftUpdatedAt, true)}`;
  }

  function renderAll() {
    renderMetrics();
    renderRequests();
    renderAppointments();
    renderDraft();
  }

  let draftTimer;
  requestForm.addEventListener('input', () => {
    clearTimeout(draftTimer);
    draftStatus.textContent = 'جارٍ الحفظ…';
    draftTimer = setTimeout(() => {
      const values = formValues(requestForm);
      const hasContent = Object.values(values).some(value => String(value).trim());
      state.draft = hasContent ? values : null;
      state.draftUpdatedAt = hasContent ? new Date().toISOString() : null;
      saveState(key, state);
      renderMetrics();
      renderDraft();
    }, 350);
  });

  requestForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!requestForm.reportValidity()) return;
    const values = formValues(requestForm);
    const item = {
      id: makeId('EA'),
      service: values.service,
      district: values.district.trim(),
      contactMethod: values.contactMethod,
      summary: values.summary.trim(),
      status: 'بانتظار تأكيد المكتب',
      createdAt: new Date().toISOString()
    };
    state.requests.unshift(item);
    state.draft = null;
    state.draftUpdatedAt = null;
    persist('حُفظ طلبك. أكمل الإرسال عبر واتساب لتأكيد استلامه.');
    requestForm.reset();
    renderAll();
    window.open(whatsappUrl(requestMessage(item)), '_blank', 'noopener');
    switchTab('overview');
  });

  document.getElementById('clearDraft').addEventListener('click', () => {
    requestForm.reset();
    state.draft = null;
    state.draftUpdatedAt = null;
    persist('حُذفت المسودة من هذا الجهاز.');
    renderAll();
  });

  appointmentForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!appointmentForm.reportValidity()) return;
    const values = formValues(appointmentForm);
    if (values.appointmentDate < today) {
      notify('اختر تاريخ اليوم أو تاريخًا لاحقًا.', 'error');
      return;
    }
    const item = {
      id: makeId('AM'),
      date: values.appointmentDate,
      time: values.appointmentTime,
      channel: values.appointmentChannel,
      notes: values.appointmentNotes.trim(),
      status: 'في انتظار التأكيد',
      createdAt: new Date().toISOString()
    };
    state.appointments.unshift(item);
    persist('حُفظ الموعد. أرسل الرسالة عبر واتساب ليؤكده المكتب.');
    appointmentForm.reset();
    appointmentForm.elements.namedItem('appointmentDate').min = today;
    renderAll();
    window.open(whatsappUrl(appointmentMessage(item)), '_blank', 'noopener');
    switchTab('overview');
  });

  document.querySelectorAll('[data-portal-tab]').forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.portalTab));
  });
  document.querySelectorAll('[data-open-portal]').forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.openPortal));
  });

  fillForm(requestForm, state.draft);
  renderAll();
  switchTab('overview');
}
