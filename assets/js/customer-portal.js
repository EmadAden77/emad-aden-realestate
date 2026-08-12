const OFFICE_WHATSAPP = '967773571889';
const STORAGE_VERSION = 'v1';

function storageKey(userId) {
  return `emad-customer-portal:${STORAGE_VERSION}:${userId}`;
}

function emptyState() {
  return { draft: null, draftUpdatedAt: null, requests: [], appointments: [], deals: [], inspections: [], alerts: [] };
}

function loadState(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    if (!parsed || typeof parsed !== 'object') return emptyState();
    return {
      draft: parsed.draft && typeof parsed.draft === 'object' ? parsed.draft : null,
      draftUpdatedAt: parsed.draftUpdatedAt || null,
      requests: Array.isArray(parsed.requests) ? parsed.requests.slice(0, 30) : [],
      appointments: Array.isArray(parsed.appointments) ? parsed.appointments.slice(0, 20) : [],
      deals: Array.isArray(parsed.deals) ? parsed.deals.slice(0, 50) : [],
      inspections: Array.isArray(parsed.inspections) ? parsed.inspections.slice(0, 100) : [],
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts.slice(0, 100) : []
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
  const dealForm = document.getElementById('dealForm');
  const inspectionForm = document.getElementById('inspectionForm');
  const alertForm = document.getElementById('alertForm');
  const requestsList = document.getElementById('requestsList');
  const appointmentsList = document.getElementById('appointmentsList');
  const trackingList = document.getElementById('trackingList');
  const dealsList = document.getElementById('dealsList');
  const inspectionsList = document.getElementById('inspectionsList');
  const alertsList = document.getElementById('alertsList');
  const draftStatus = document.getElementById('draftStatus');
  const portalNotice = document.getElementById('portalNotice');
  const today = new Date().toISOString().slice(0, 10);
  appointmentForm.elements.namedItem('appointmentDate').min = today;
  inspectionForm.elements.namedItem('date').value = today;
  alertForm.elements.namedItem('date').min = today;

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
    if (['tracking', 'deals', 'inspections', 'alerts'].includes(name)) history.replaceState(null, '', `#${name}`);
  }

  function renderMetrics() {
    document.getElementById('requestCount').textContent = String(state.requests.length);
    document.getElementById('draftCount').textContent = state.draft ? '1' : '0';
    document.getElementById('appointmentCount').textContent = String(
      state.appointments.filter(item => item.status === 'في انتظار التأكيد').length
    );
    document.getElementById('dealCount').textContent = String(state.deals.filter(item => !['مكتملة', 'متوقفة'].includes(item.stage)).length);
    document.getElementById('alertCount').textContent = String(activeAlerts().length);
  }

  function activeAlerts() {
    const manual = state.alerts.filter(item => !item.done);
    const dealAlerts = state.deals
      .filter(item => item.nextDate && !['مكتملة', 'متوقفة'].includes(item.stage))
      .map(item => ({ id: `deal-${item.id}`, title: item.nextAction, date: item.nextDate, type: 'صفقة', priority: 'مهمة', source: item.title }));
    return [...manual, ...dealAlerts].sort((a, b) => a.date.localeCompare(b.date));
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
    const badge = createElement('span', `portal-badge ${item.status === 'مكتمل' ? 'complete' : 'waiting'}`, item.status);
    top.append(titleWrap, badge);

    const details = createElement('div', 'portal-item-details');
    details.append(
      createElement('span', '', `المنطقة: ${item.district || 'غير محددة'}`),
      createElement('span', '', `أُنشئ: ${formatDate(item.createdAt, true)}`)
    );

    const progress = createElement('div', 'request-progress');
    const progressIndex = Math.max(0, ['تم تجهيز الطلب', 'بانتظار تأكيد المكتب', 'قيد المراجعة', 'قيد التنفيذ', 'مكتمل'].indexOf(item.status));
    ['تجهيز الطلب', 'تأكيد المكتب', 'المراجعة', 'التنفيذ', 'الإغلاق'].forEach((label, index) => {
      const step = createElement('span', index < progressIndex ? 'done' : index === progressIndex ? 'current' : '', label);
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

  function trackingCard(item) {
    const card = createElement('article', 'portal-item tracking-card');
    const top = createElement('div', 'portal-item-top');
    const heading = createElement('div');
    heading.append(createElement('strong', '', item.service), createElement('span', '', item.id));
    top.append(heading, createElement('span', 'portal-badge waiting', item.status));

    const form = createElement('form', 'tracking-editor');
    const statusLabel = createElement('label', '', 'مرحلة الطلب');
    const status = createElement('select');
    status.name = 'status';
    ['تم تجهيز الطلب', 'بانتظار تأكيد المكتب', 'قيد المراجعة', 'قيد التنفيذ', 'مكتمل', 'متوقف'].forEach(value => {
      const choice = createElement('option', '', value);
      choice.value = value;
      choice.selected = item.status === value;
      status.append(choice);
    });
    statusLabel.append(status);

    const docsLabel = createElement('label', '', 'المستندات الناقصة');
    const docs = createElement('input');
    docs.name = 'missingDocuments';
    docs.maxLength = 240;
    docs.value = item.missingDocuments || '';
    docs.placeholder = 'مثال: صورة عقد الملكية';
    docsLabel.append(docs);

    const nextLabel = createElement('label', '', 'الخطوة التالية');
    const next = createElement('input');
    next.name = 'nextAction';
    next.maxLength = 240;
    next.value = item.nextAction || '';
    next.placeholder = 'ما المطلوب بعد ذلك؟';
    nextLabel.append(next);

    const dateLabel = createElement('label', '', 'الموعد أو المهلة');
    const date = createElement('input');
    date.type = 'date';
    date.name = 'nextDate';
    date.value = item.nextDate || '';
    dateLabel.append(date);

    const actions = createElement('div', 'portal-item-actions full');
    const save = createElement('button', 'mini-button primary', 'حفظ التحديث');
    save.type = 'submit';
    const send = createElement('a', 'mini-button', 'إرسال تحديث للمكتب');
    send.href = '#';
    send.addEventListener('click', event => {
      event.preventDefault();
      const values = formValues(form);
      const message = [
        'تحديث طلب من حساب العميل', `الرقم المرجعي: ${item.id}`, `الخدمة: ${item.service}`,
        `المرحلة: ${values.status}`, `المستندات الناقصة: ${values.missingDocuments || 'لا توجد'}`,
        `الخطوة التالية: ${values.nextAction || 'غير محددة'}`, `الموعد: ${values.nextDate || 'غير محدد'}`
      ].join('\n');
      window.open(whatsappUrl(message), '_blank', 'noopener');
    });
    actions.append(save, send);
    form.append(statusLabel, docsLabel, nextLabel, dateLabel, actions);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const values = formValues(form);
      Object.assign(item, {
        status: values.status,
        missingDocuments: values.missingDocuments.trim(),
        nextAction: values.nextAction.trim(),
        nextDate: values.nextDate,
        updatedAt: new Date().toISOString()
      });
      persist('حُدثت حالة الطلب على هذا الجهاز.');
      renderAll();
    });
    card.append(top, form);
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

  function renderTracking() {
    trackingList.replaceChildren();
    if (!state.requests.length) return trackingList.append(portalEmpty('لا توجد طلبات للمتابعة', 'أنشئ طلبك الأول ليظهر مسار متابعته هنا.'));
    state.requests.forEach(item => trackingList.append(trackingCard(item)));
  }

  function portalEmpty(title, detail) {
    const empty = createElement('div', 'portal-empty');
    empty.append(createElement('strong', '', title), createElement('span', '', detail));
    return empty;
  }

  function removeButton(collection, itemId, message) {
    const button = createElement('button', 'mini-button', 'حذف من الجهاز');
    button.type = 'button';
    button.addEventListener('click', () => {
      state[collection] = state[collection].filter(item => item.id !== itemId);
      persist(message);
      renderAll();
    });
    return button;
  }

  function renderDeals() {
    dealsList.replaceChildren();
    if (!state.deals.length) return dealsList.append(portalEmpty('لا توجد صفقات', 'أضف الصفقة الأولى لتبدأ المتابعة.'));
    state.deals.forEach(item => {
      const card = createElement('article', 'portal-item');
      const top = createElement('div', 'portal-item-top');
      const heading = createElement('div');
      heading.append(createElement('strong', '', item.title), createElement('span', '', `${item.id} · ${item.type} · ${item.district}`));
      top.append(heading, createElement('span', item.stage === 'مكتملة' ? 'portal-badge complete' : 'portal-badge waiting', item.stage));
      const stages = ['استلام الطلب', 'مراجعة المستندات', 'المعاينة', 'التفاوض', 'العربون', 'التوثيق', 'مكتملة'];
      const current = Math.max(0, stages.indexOf(item.stage));
      const progress = createElement('div', 'request-progress deal-progress');
      stages.forEach((label, index) => progress.append(createElement('span', index < current ? 'done' : index === current ? 'current' : '', label)));
      const meta = createElement('div', 'portal-item-details');
      meta.append(createElement('span', '', `الخطوة التالية: ${item.nextAction}`), createElement('span', '', `الموعد: ${item.nextDate ? formatDate(item.nextDate) : 'غير محدد'}`));
      const actions = createElement('div', 'portal-item-actions');
      const advance = createElement('button', 'mini-button primary', 'تحديث المرحلة');
      advance.type = 'button';
      advance.addEventListener('click', () => {
        const nextStage = window.prompt(`اكتب المرحلة الجديدة:\n${stages.join('، ')}`, item.stage);
        if (!nextStage || ![...stages, 'متوقفة'].includes(nextStage.trim())) return;
        item.stage = nextStage.trim();
        item.updatedAt = new Date().toISOString();
        persist('حُدثت مرحلة الصفقة.');
        renderAll();
      });
      actions.append(advance, removeButton('deals', item.id, 'حُذفت الصفقة من هذا الجهاز.'));
      card.append(top, progress, meta, actions);
      dealsList.append(card);
    });
  }

  function renderInspections() {
    inspectionsList.replaceChildren();
    if (!state.inspections.length) return inspectionsList.append(portalEmpty('لا توجد معاينات', 'سجل المعاينة الأولى لتظهر هنا.'));
    [...state.inspections].sort((a, b) => b.date.localeCompare(a.date)).forEach(item => {
      const card = createElement('article', 'portal-item');
      const top = createElement('div', 'portal-item-top');
      const heading = createElement('div');
      heading.append(createElement('strong', '', item.subject), createElement('span', '', `${formatDate(item.date)} · ${item.type}`));
      top.append(heading, createElement('span', item.result === 'تمت بنجاح' ? 'portal-badge complete' : 'portal-badge waiting', item.result));
      const meta = createElement('div', 'portal-item-details');
      meta.append(createElement('span', '', item.notes), createElement('span', '', `التالي: ${item.nextAction}`));
      const actions = createElement('div', 'portal-item-actions');
      actions.append(removeButton('inspections', item.id, 'حُذفت المعاينة من هذا الجهاز.'));
      card.append(top, meta, actions);
      inspectionsList.append(card);
    });
  }

  function renderAlerts() {
    alertsList.replaceChildren();
    const alerts = activeAlerts();
    if (!alerts.length) return alertsList.append(portalEmpty('لا توجد تنبيهات حالية', 'ستظهر هنا المواعيد والمهل التي تحتاج انتباهك.'));
    alerts.forEach(item => {
      const card = createElement('article', 'portal-item alert-item');
      const top = createElement('div', 'portal-item-top');
      const heading = createElement('div');
      heading.append(createElement('strong', '', item.title), createElement('span', '', `${formatDate(item.date)} · ${item.type}${item.source ? ` · ${item.source}` : ''}`));
      top.append(heading, createElement('span', item.priority === 'عاجلة' ? 'portal-badge urgent' : 'portal-badge waiting', item.priority));
      card.append(top);
      if (!String(item.id).startsWith('deal-')) {
        const actions = createElement('div', 'portal-item-actions');
        const done = createElement('button', 'mini-button primary', 'تمت المتابعة');
        done.type = 'button';
        done.addEventListener('click', () => {
          item.done = true;
          persist('أُغلق التنبيه.');
          renderAll();
        });
        actions.append(done, removeButton('alerts', item.id, 'حُذف التنبيه من هذا الجهاز.'));
        card.append(actions);
      }
      alertsList.append(card);
    });
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
    renderTracking();
    renderDeals();
    renderInspections();
    renderAlerts();
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

  dealForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!dealForm.reportValidity()) return;
    const values = formValues(dealForm);
    state.deals.unshift({
      id: makeId('DL'), title: values.title.trim(), type: values.type,
      district: values.district.trim(), stage: values.stage,
      nextDate: values.nextDate, nextAction: values.nextAction.trim(),
      parties: values.parties.trim(), createdAt: new Date().toISOString()
    });
    persist('أُضيفت الصفقة إلى غرفة المتابعة.');
    dealForm.reset();
    renderAll();
  });

  inspectionForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!inspectionForm.reportValidity()) return;
    const values = formValues(inspectionForm);
    state.inspections.unshift({
      id: makeId('IN'), subject: values.subject.trim(), date: values.date,
      type: values.type, result: values.result, notes: values.notes.trim(),
      nextAction: values.nextAction.trim(), createdAt: new Date().toISOString()
    });
    persist('حُفظت المعاينة في السجل.');
    inspectionForm.reset();
    inspectionForm.elements.namedItem('date').value = today;
    renderAll();
  });

  alertForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!alertForm.reportValidity()) return;
    const values = formValues(alertForm);
    state.alerts.unshift({
      id: makeId('AL'), title: values.title.trim(), date: values.date,
      type: values.type, priority: values.priority, done: false,
      createdAt: new Date().toISOString()
    });
    persist('حُفظ التنبيه.');
    alertForm.reset();
    alertForm.elements.namedItem('date').min = today;
    renderAll();
  });

  document.querySelectorAll('[data-portal-tab]').forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.portalTab));
  });
  document.querySelectorAll('[data-open-portal]').forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.openPortal));
  });

  fillForm(requestForm, state.draft);
  renderAll();
  const initialTab = ['tracking', 'deals', 'inspections', 'alerts', 'new-request', 'appointment'].includes(location.hash.slice(1))
    ? location.hash.slice(1)
    : 'overview';
  switchTab(initialTab);
}
