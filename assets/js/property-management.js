import { issueVerificationCode } from './report-verification-core.js';

const STORE_VERSION = 'v1';
const OFFICE_WHATSAPP = '967773571889';
const CURRENCIES = ['SAR', 'USD'];

function storeKey(userId) {
  return `emad-property-management:${STORE_VERSION}:${userId}`;
}

function initialState() {
  return { properties: [], tenants: [], rents: [], maintenance: [], expenses: [] };
}

function loadRecords(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    if (!parsed || typeof parsed !== 'object') return initialState();
    return {
      properties: Array.isArray(parsed.properties) ? parsed.properties.slice(0, 100) : [],
      tenants: Array.isArray(parsed.tenants) ? parsed.tenants.slice(0, 200) : [],
      rents: Array.isArray(parsed.rents) ? parsed.rents.slice(0, 500) : [],
      maintenance: Array.isArray(parsed.maintenance) ? parsed.maintenance.slice(0, 300) : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses.slice(0, 300) : []
    };
  } catch {
    return initialState();
  }
}

function saveRecords(key, state) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function id(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (typeof text === 'string') element.textContent = text;
  return element;
}

function values(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function amount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function money(value, currency) {
  try {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount(value));
  } catch {
    return `${amount(value).toFixed(2)} ${currency}`;
  }
}

function dateText(value) {
  if (!value) return 'غير محدد';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium' }).format(parsed);
}

function monthText(value) {
  if (!value) return 'غير محدد';
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('ar-SA', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

function option(value, text) {
  const item = document.createElement('option');
  item.value = value;
  item.textContent = text;
  return item;
}

function tenantAccessToken(payload) {
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  return encoded.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export function initPropertyManagement({ userId, userName, getToken }) {
  if (!userId) throw new Error('تعذر تحديد حساب العميل.');
  if (typeof getToken !== 'function') throw new Error('تعذر تهيئة إصدار رموز التقارير.');
  const key = storeKey(userId);
  const state = loadRecords(key);
  const notice = document.getElementById('pmNotice');
  const forms = {
    property: document.getElementById('propertyForm'),
    tenant: document.getElementById('tenantForm'),
    rent: document.getElementById('rentForm'),
    maintenance: document.getElementById('maintenanceForm'),
    expense: document.getElementById('expenseForm')
  };

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const issueDate = today.toISOString().slice(0, 10);
  const verificationRequests = new Map();
  let activeReportKey = '';
  document.getElementById('reportMonth').value = currentMonth;

  function notify(message, tone = 'success') {
    notice.textContent = message;
    notice.dataset.tone = tone;
    notice.hidden = false;
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => { notice.hidden = true; }, 5000);
  }

  function persist(message) {
    const ok = saveRecords(key, state);
    if (!ok) notify('تعذر الحفظ على هذا الجهاز. راجع إعدادات المتصفح.', 'error');
    else if (message) notify(message);
    return ok;
  }

  function propertyById(propertyId) {
    return state.properties.find(item => item.id === propertyId);
  }

  function tenantById(tenantId) {
    return state.tenants.find(item => item.id === tenantId);
  }

  function propertyCurrency(propertyId) {
    return propertyById(propertyId)?.currency || 'SAR';
  }

  function reportVerificationData(data) {
    const propertyReference = data.propertyId ? (propertyById(data.propertyId)?.reference || data.propertyId.slice(-6)) : 'ALL';
    return {
      reportId: `PM-${data.month.replace('-', '')}-${String(propertyReference).toUpperCase()}-${data.currency}`,
      reportDate: issueDate,
      reportType: 'PROPERTY-MANAGEMENT'
    };
  }

  function verificationKey(meta) {
    return `${meta.reportType}|${meta.reportId}|${meta.reportDate}`;
  }

  function getVerificationCode(meta) {
    const key = verificationKey(meta);
    if (!verificationRequests.has(key)) {
      verificationRequests.set(key, issueVerificationCode(meta, getToken).then(result => result.code));
    }
    return verificationRequests.get(key);
  }

  function currencyTotals(records, getValue, getCurrency) {
    return CURRENCIES.reduce((totals, currency) => {
      totals[currency] = records
        .filter(item => getCurrency(item) === currency)
        .reduce((sum, item) => sum + getValue(item), 0);
      return totals;
    }, {});
  }

  function dualMoney(totals) {
    return `${money(totals.SAR || 0, 'SAR')} · ${money(totals.USD || 0, 'USD')}`;
  }

  function switchView(viewName) {
    document.querySelectorAll('[data-pm-view]').forEach(view => {
      view.hidden = view.dataset.pmView !== viewName;
    });
    document.querySelectorAll('[data-pm-tab]').forEach(tab => {
      const active = tab.dataset.pmTab === viewName;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    const view = document.querySelector(`[data-pm-view="${viewName}"]`);
    if (view) view.focus({ preventScroll: true });
    if (viewName !== 'overview') history.replaceState(null, '', `#${viewName}`);
  }

  function updateSelect(select, items, placeholder, label) {
    const selected = select.value;
    select.replaceChildren(option('', placeholder));
    items.forEach(item => select.append(option(item.id, label(item))));
    if ([...select.options].some(item => item.value === selected)) select.value = selected;
  }

  function refreshSelects() {
    document.querySelectorAll('[data-property-select]').forEach(select => {
      updateSelect(select, state.properties, select.id === 'reportProperty' ? 'جميع العقارات' : 'اختر العقار', item => `${item.name} — ${item.district}`);
    });
    document.querySelectorAll('[data-tenant-select]').forEach(select => {
      updateSelect(select, state.tenants.filter(item => item.status === 'نشط'), 'اختر المستأجر', item => {
        const property = propertyById(item.propertyId);
        return `${item.name} — ${property?.name || 'عقار محذوف'} / ${item.unit}`;
      });
    });
  }

  function actionsFor(collection, itemId, cascade) {
    const actions = node('div', 'pm-item-actions');
    const remove = node('button', 'pm-small-button danger', 'حذف');
    remove.type = 'button';
    remove.addEventListener('click', () => {
      if (!window.confirm('هل تريد حذف هذا السجل من الجهاز؟')) return;
      state[collection] = state[collection].filter(item => item.id !== itemId);
      if (cascade) cascade();
      persist('حُذف السجل من هذا الجهاز.');
      renderAll();
    });
    actions.append(remove);
    return actions;
  }

  function empty(message) {
    const box = node('div', 'pm-empty');
    box.append(node('strong', '', message), node('span', '', 'أضف أول سجل ليظهر هنا.'));
    return box;
  }

  function recordCard(title, subtitle, details, badgeText, badgeClass = '') {
    const card = node('article', 'pm-record');
    const top = node('div', 'pm-record-top');
    const heading = node('div');
    heading.append(node('strong', '', title), node('span', '', subtitle));
    top.append(heading, node('span', `pm-badge ${badgeClass}`.trim(), badgeText));
    const meta = node('div', 'pm-record-meta');
    details.forEach(detail => meta.append(node('span', '', detail)));
    card.append(top, meta);
    return card;
  }

  function renderProperties() {
    const list = document.getElementById('propertiesList');
    list.replaceChildren();
    if (!state.properties.length) return list.append(empty('لا توجد عقارات مسجلة'));
    state.properties.forEach(item => {
      const occupied = state.tenants.filter(tenant => tenant.propertyId === item.id && tenant.status === 'نشط').length;
      const card = recordCard(
        item.name,
        `${item.type} — ${item.district}${item.reference ? ` — ${item.reference}` : ''}`,
        [`الوحدات: ${item.units}`, `المشغول: ${occupied}`, `العملة: ${item.currency}`, `المستندات: ${item.documentStatus || 'غير محددة'}`, item.notes || 'دون ملاحظات ملف'],
        item.documentStatus || (occupied >= item.units ? 'مكتمل الإشغال' : 'ملف نشط'),
        item.documentStatus === 'مكتملة مبدئيًا' ? 'success' : 'warning'
      );
      card.append(actionsFor('properties', item.id, () => {
        const tenantIds = state.tenants.filter(tenant => tenant.propertyId === item.id).map(tenant => tenant.id);
        state.tenants = state.tenants.filter(tenant => tenant.propertyId !== item.id);
        state.rents = state.rents.filter(rent => rent.propertyId !== item.id && !tenantIds.includes(rent.tenantId));
        state.maintenance = state.maintenance.filter(record => record.propertyId !== item.id);
        state.expenses = state.expenses.filter(record => record.propertyId !== item.id);
      }));
      list.append(card);
    });
  }

  function renderTenants() {
    const list = document.getElementById('tenantsList');
    list.replaceChildren();
    if (!state.tenants.length) return list.append(empty('لا يوجد مستأجرون مسجلون'));
    state.tenants.forEach(item => {
      const property = propertyById(item.propertyId);
      const card = recordCard(
        item.name,
        `${property?.name || 'عقار محذوف'} — الوحدة ${item.unit}`,
        [`الإيجار: ${money(item.monthlyRent, propertyCurrency(item.propertyId))}`, `بداية العقد: ${dateText(item.startDate)}`],
        item.status,
        item.status === 'نشط' ? 'success' : ''
      );
      const actions = actionsFor('tenants', item.id, () => {
        state.rents = state.rents.filter(rent => rent.tenantId !== item.id);
      });
      const share = node('button', 'pm-small-button', 'مشاركة بوابة المستأجر');
      share.type = 'button';
      share.addEventListener('click', async () => {
        if (!window.confirm('سيحتوي الرابط على اسم المستأجر وملخص الإيجار. شاركه مع المستأجر المقصود فقط. هل تريد المتابعة؟')) return;
        const rentRecord = state.rents.find(record => record.tenantId === item.id && record.month === currentMonth);
        const payload = {
          tenant: item.name,
          property: property?.name || 'العقار',
          unit: item.unit,
          monthlyRent: money(item.monthlyRent, propertyCurrency(item.propertyId)),
          status: rentRecord?.status || 'لا توجد دفعة مسجلة للشهر الحالي',
          nextDue: `${currentMonth}-01`
        };
        const url = new URL('tenant-portal.html', location.href);
        url.searchParams.set('access', tenantAccessToken(payload));
        const shareData = { title: 'بوابة المستأجر', text: `رابط بوابة المستأجر — ${property?.name || 'العقار'} / ${item.unit}`, url: url.href };
        if (navigator.share) {
          try { await navigator.share(shareData); return; } catch {}
        }
        try {
          await navigator.clipboard.writeText(url.href);
          notify('نُسخ رابط بوابة المستأجر. شاركه مع المستأجر المقصود فقط.');
        } catch {
          window.open(url.href, '_blank', 'noopener');
        }
      });
      actions.prepend(share);
      card.append(actions);
      list.append(card);
    });
  }

  function renderRents() {
    const list = document.getElementById('rentsList');
    list.replaceChildren();
    if (!state.rents.length) return list.append(empty('لا توجد دفعات إيجار مسجلة'));
    [...state.rents].sort((a, b) => b.month.localeCompare(a.month)).forEach(item => {
      const tenant = tenantById(item.tenantId);
      const property = propertyById(item.propertyId);
      const card = recordCard(
        tenant?.name || 'مستأجر محذوف',
        `${property?.name || 'عقار محذوف'} — ${monthText(item.month)}`,
        [`المبلغ: ${money(item.amount, item.currency)}`, `تاريخ التسجيل: ${dateText(item.paymentDate)}`],
        item.status,
        item.status === 'مسدد' ? 'success' : 'warning'
      );
      card.append(actionsFor('rents', item.id));
      list.append(card);
    });
  }

  function renderMaintenance() {
    const list = document.getElementById('maintenanceList');
    list.replaceChildren();
    if (!state.maintenance.length) return list.append(empty('لا توجد أعمال صيانة مسجلة'));
    [...state.maintenance].sort((a, b) => b.date.localeCompare(a.date)).forEach(item => {
      const property = propertyById(item.propertyId);
      const card = recordCard(
        item.title,
        `${property?.name || 'عقار محذوف'}${item.unit ? ` — ${item.unit}` : ''}`,
        [`التاريخ: ${dateText(item.date)}`, `التكلفة: ${money(item.cost, item.currency)}`, `مقدم البلاغ: ${item.reportedBy || 'غير محدد'}`, `الأولوية: ${item.priority || 'عادية'}`, item.notes || 'دون ملاحظات متابعة'],
        item.status,
        item.status === 'مكتملة' ? 'success' : 'warning'
      );
      card.append(actionsFor('maintenance', item.id));
      list.append(card);
    });
  }

  function renderExpenses() {
    const list = document.getElementById('expensesList');
    list.replaceChildren();
    if (!state.expenses.length) return list.append(empty('لا توجد مصروفات مسجلة'));
    [...state.expenses].sort((a, b) => b.date.localeCompare(a.date)).forEach(item => {
      const property = propertyById(item.propertyId);
      const card = recordCard(
        item.category,
        property?.name || 'عقار محذوف',
        [`التاريخ: ${dateText(item.date)}`, `المبلغ: ${money(item.amount, item.currency)}`, item.note || 'دون ملاحظة'],
        'مصروف'
      );
      card.append(actionsFor('expenses', item.id));
      list.append(card);
    });
  }

  function renderOverview() {
    document.getElementById('pmPropertyCount').textContent = String(state.properties.length);
    document.getElementById('pmTenantCount').textContent = String(state.tenants.filter(item => item.status === 'نشط').length);
    document.getElementById('pmPendingMaintenance').textContent = String(state.maintenance.filter(item => item.status !== 'مكتملة').length);

    const currentPaid = state.rents.filter(item => item.month === currentMonth && item.status !== 'غير مسدد');
    const collected = currencyTotals(currentPaid, item => amount(item.amount), item => item.currency);
    document.getElementById('pmCollected').textContent = dualMoney(collected);

    const activity = [
      ...state.rents.map(item => ({ date: item.paymentDate || `${item.month}-01`, type: 'إيجار', text: `${tenantById(item.tenantId)?.name || 'مستأجر'} — ${money(item.amount, item.currency)}` })),
      ...state.maintenance.map(item => ({ date: item.date, type: 'صيانة', text: `${item.title} — ${money(item.cost, item.currency)}` })),
      ...state.expenses.map(item => ({ date: item.date, type: 'مصروف', text: `${item.category} — ${money(item.amount, item.currency)}` }))
    ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

    const feed = document.getElementById('pmActivity');
    feed.replaceChildren();
    if (!activity.length) return feed.append(empty('لا يوجد نشاط حديث'));
    activity.forEach(item => {
      const row = node('div', 'pm-activity-row');
      row.append(node('span', 'pm-badge', item.type), node('strong', '', item.text), node('small', '', dateText(item.date)));
      feed.append(row);
    });
  }

  function reportData() {
    const month = document.getElementById('reportMonth').value || currentMonth;
    const currency = document.getElementById('reportCurrency').value || 'SAR';
    const propertyId = document.getElementById('reportProperty').value;
    const matchProperty = item => !propertyId || item.propertyId === propertyId;
    const activeTenants = state.tenants.filter(item => item.status === 'نشط' && item.startDate.slice(0, 7) <= month && matchProperty(item) && propertyCurrency(item.propertyId) === currency);
    const due = activeTenants.reduce((sum, item) => sum + amount(item.monthlyRent), 0);
    const paidRecords = state.rents.filter(item => item.month === month && item.status !== 'غير مسدد' && item.currency === currency && matchProperty(item));
    const collected = paidRecords.reduce((sum, item) => sum + amount(item.amount), 0);
    const maintenanceRecords = state.maintenance.filter(item => item.date.startsWith(month) && item.currency === currency && matchProperty(item));
    const maintenance = maintenanceRecords.reduce((sum, item) => sum + amount(item.cost), 0);
    const expenseRecords = state.expenses.filter(item => item.date.startsWith(month) && item.currency === currency && matchProperty(item));
    const expenses = expenseRecords.reduce((sum, item) => sum + amount(item.amount), 0);
    const totalUnits = state.properties.filter(item => !propertyId || item.id === propertyId).reduce((sum, item) => sum + amount(item.units), 0);
    const occupied = activeTenants.length;
    return {
      month, currency, propertyId, due, collected,
      outstanding: Math.max(0, due - collected),
      maintenance, expenses,
      net: collected - maintenance - expenses,
      occupied, totalUnits,
      paidRecords, maintenanceRecords, expenseRecords
    };
  }

  function renderReport() {
    const data = reportData();
    const verification = reportVerificationData(data);
    activeReportKey = verificationKey(verification);
    document.getElementById('reportTitle').textContent = `التقرير الشهري — ${monthText(data.month)}`;
    document.getElementById('reportScope').textContent = data.propertyId
      ? propertyById(data.propertyId)?.name || 'عقار محدد'
      : 'جميع العقارات';
    document.getElementById('reportDue').textContent = money(data.due, data.currency);
    document.getElementById('reportCollected').textContent = money(data.collected, data.currency);
    document.getElementById('reportOutstanding').textContent = money(data.outstanding, data.currency);
    document.getElementById('reportMaintenance').textContent = money(data.maintenance, data.currency);
    document.getElementById('reportExpenses').textContent = money(data.expenses, data.currency);
    document.getElementById('reportNet').textContent = money(data.net, data.currency);
    document.getElementById('reportOccupancy').textContent = data.totalUnits
      ? `${Math.round((data.occupied / data.totalUnits) * 100)}٪`
      : '0٪';
    document.getElementById('reportId').textContent = verification.reportId;
    document.getElementById('reportIssueDate').textContent = verification.reportDate;
    const verificationElement = document.getElementById('reportVerificationCode');
    verificationElement.textContent = 'جارٍ إصدار الرمز…';
    getVerificationCode(verification).then(code => {
      if (activeReportKey === verificationKey(verification)) verificationElement.textContent = code;
    }).catch(() => {
      if (activeReportKey === verificationKey(verification)) verificationElement.textContent = 'تعذر إصدار الرمز';
    });

    const tbody = document.getElementById('reportRows');
    tbody.replaceChildren();
    const rows = [
      ...data.paidRecords.map(item => ({ type: 'إيجار مسدد', detail: tenantById(item.tenantId)?.name || 'مستأجر', value: item.amount })),
      ...data.maintenanceRecords.map(item => ({ type: 'صيانة', detail: item.title, value: -amount(item.cost) })),
      ...data.expenseRecords.map(item => ({ type: 'مصروف', detail: item.category, value: -amount(item.amount) }))
    ];
    if (!rows.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 3;
      cell.textContent = 'لا توجد حركة مالية لهذا الشهر.';
      row.append(cell);
      tbody.append(row);
    } else {
      rows.forEach(item => {
        const row = document.createElement('tr');
        row.append(node('td', '', item.type), node('td', '', item.detail), node('td', '', money(item.value, data.currency)));
        tbody.append(row);
      });
    }
  }

  function renderAll() {
    refreshSelects();
    renderOverview();
    renderProperties();
    renderTenants();
    renderRents();
    renderMaintenance();
    renderExpenses();
    renderReport();
  }

  forms.property.addEventListener('submit', event => {
    event.preventDefault();
    if (!forms.property.reportValidity()) return;
    const data = values(forms.property);
    state.properties.unshift({
      id: id('P'), name: data.name.trim(), district: data.district.trim(),
      reference: data.reference.trim(), type: data.type, units: amount(data.units), currency: data.currency,
      documentStatus: data.documentStatus, notes: data.notes.trim()
    });
    persist('أُضيف العقار وحُفظ على هذا الجهاز.');
    forms.property.reset();
    renderAll();
  });

  forms.tenant.addEventListener('submit', event => {
    event.preventDefault();
    if (!forms.tenant.reportValidity()) return;
    const data = values(forms.tenant);
    state.tenants.unshift({
      id: id('T'), propertyId: data.propertyId, name: data.name.trim(), unit: data.unit.trim(),
      monthlyRent: amount(data.monthlyRent), startDate: data.startDate, status: data.status
    });
    persist('أُضيف المستأجر وحُفظ على هذا الجهاز.');
    forms.tenant.reset();
    renderAll();
  });

  forms.rent.addEventListener('submit', event => {
    event.preventDefault();
    if (!forms.rent.reportValidity()) return;
    const data = values(forms.rent);
    const tenant = tenantById(data.tenantId);
    state.rents.unshift({
      id: id('R'), tenantId: data.tenantId, propertyId: tenant?.propertyId || '',
      month: data.month, amount: amount(data.amount), currency: propertyCurrency(tenant?.propertyId),
      status: data.status, paymentDate: data.paymentDate
    });
    persist('سُجلت دفعة الإيجار.');
    forms.rent.reset();
    renderAll();
  });

  forms.maintenance.addEventListener('submit', event => {
    event.preventDefault();
    if (!forms.maintenance.reportValidity()) return;
    const data = values(forms.maintenance);
    state.maintenance.unshift({
      id: id('M'), propertyId: data.propertyId, title: data.title.trim(), date: data.date,
      unit: data.unit.trim(), reportedBy: data.reportedBy, priority: data.priority,
      cost: amount(data.cost), currency: propertyCurrency(data.propertyId), status: data.status,
      notes: data.notes.trim()
    });
    persist('سُجلت عملية الصيانة.');
    forms.maintenance.reset();
    renderAll();
  });

  forms.expense.addEventListener('submit', event => {
    event.preventDefault();
    if (!forms.expense.reportValidity()) return;
    const data = values(forms.expense);
    state.expenses.unshift({
      id: id('E'), propertyId: data.propertyId, category: data.category,
      date: data.date, amount: amount(data.amount), currency: propertyCurrency(data.propertyId),
      note: data.note.trim()
    });
    persist('سُجل المصروف.');
    forms.expense.reset();
    renderAll();
  });

  document.querySelectorAll('[data-pm-tab]').forEach(tab => tab.addEventListener('click', () => switchView(tab.dataset.pmTab)));
  document.querySelectorAll('[data-open-pm]').forEach(button => button.addEventListener('click', () => switchView(button.dataset.openPm)));
  ['reportMonth', 'reportCurrency', 'reportProperty'].forEach(field => document.getElementById(field).addEventListener('change', renderReport));
  document.getElementById('printReport').addEventListener('click', () => window.print());
  document.getElementById('shareReport').addEventListener('click', async () => {
    const data = reportData();
    const verification = reportVerificationData(data);
    const target = window.open('', '_blank');
    let code;
    try {
      code = await getVerificationCode(verification);
    } catch {
      if (target) target.close();
      notify('تعذر إصدار رمز التقرير. حاول مرة أخرى بعد قليل.', 'error');
      return;
    }
    const message = [
      `ملخص إدارة الأملاك — ${monthText(data.month)}`,
      `المالك: ${userName}`,
      `النطاق: ${data.propertyId ? propertyById(data.propertyId)?.name : 'جميع العقارات'}`,
      `المستحق: ${money(data.due, data.currency)}`,
      `المحصل: ${money(data.collected, data.currency)}`,
      `المتبقي: ${money(data.outstanding, data.currency)}`,
      `الصيانة: ${money(data.maintenance, data.currency)}`,
      `المصروفات: ${money(data.expenses, data.currency)}`,
      `الصافي: ${money(data.net, data.currency)}`,
      `رقم التقرير: ${verification.reportId}`,
      `تاريخ الإصدار: ${verification.reportDate}`,
      `رمز التحقق: ${code}`,
      'التحقق: https://emad-aden-realestate.vercel.app/report-verification.html'
    ].join('\n');
    const url = `https://wa.me/${OFFICE_WHATSAPP}?text=${encodeURIComponent(message)}`;
    if (target) {
      target.opener = null;
      target.location.href = url;
    } else {
      window.location.href = url;
    }
  });

  renderAll();
  const requestedView = location.hash.slice(1);
  switchView(['properties', 'tenants', 'rents', 'maintenance', 'expenses', 'reports'].includes(requestedView) ? requestedView : 'overview');
}
