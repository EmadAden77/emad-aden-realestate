const STRING_LIMITS = {
  id: 80,
  name: 240,
  district: 160,
  reference: 160,
  type: 100,
  currency: 8,
  documentStatus: 120,
  notes: 1800,
  propertyId: 80,
  unit: 120,
  startDate: 32,
  status: 120,
  tenantId: 80,
  month: 16,
  paymentDate: 32,
  title: 240,
  date: 32,
  reportedBy: 160,
  priority: 80,
  category: 160,
  note: 1000
};

const COLLECTIONS = {
  properties: { limit: 100, fields: ['id', 'name', 'district', 'reference', 'type', 'units', 'currency', 'documentStatus', 'notes'] },
  tenants: { limit: 200, fields: ['id', 'propertyId', 'name', 'unit', 'monthlyRent', 'startDate', 'status'] },
  rents: { limit: 500, fields: ['id', 'tenantId', 'propertyId', 'month', 'amount', 'currency', 'status', 'paymentDate'] },
  maintenance: { limit: 300, fields: ['id', 'propertyId', 'title', 'date', 'unit', 'reportedBy', 'priority', 'cost', 'currency', 'status', 'notes'] },
  expenses: { limit: 300, fields: ['id', 'propertyId', 'category', 'date', 'amount', 'currency', 'note'] }
};

const NUMBER_FIELDS = new Set(['units', 'monthlyRent', 'amount', 'cost']);

export function emptyPropertyState() {
  return { properties: [], tenants: [], rents: [], maintenance: [], expenses: [] };
}

function cleanValue(value, field) {
  if (NUMBER_FIELDS.has(field)) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.min(Math.max(number, 0), 1_000_000_000_000);
  }
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return String(value).replace(/\u0000/g, '').slice(0, STRING_LIMITS[field] || 500);
}

function cleanRecord(value, fields) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return Object.fromEntries(fields.map(field => [field, cleanValue(value[field], field)]));
}

export function sanitizePropertyState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyPropertyState();
  const state = emptyPropertyState();
  Object.entries(COLLECTIONS).forEach(([collection, config]) => {
    if (!Array.isArray(value[collection])) return;
    state[collection] = value[collection]
      .slice(0, config.limit)
      .map(item => cleanRecord(item, config.fields))
      .filter(Boolean);
  });
  return state;
}

export function hasPropertyContent(state) {
  const safe = sanitizePropertyState(state);
  return Object.values(safe).some(records => records.length);
}
