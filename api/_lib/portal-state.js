const FIELD_LIMITS = {
  id: 80,
  service: 160,
  district: 160,
  contactMethod: 80,
  summary: 1600,
  status: 100,
  createdAt: 64,
  updatedAt: 64,
  missingDocuments: 600,
  nextAction: 600,
  nextDate: 32,
  date: 32,
  time: 80,
  channel: 100,
  notes: 1600,
  title: 240,
  type: 100,
  stage: 100,
  parties: 600,
  subject: 240,
  result: 100,
  priority: 80
};

const COLLECTIONS = {
  requests: ['id', 'service', 'district', 'contactMethod', 'summary', 'status', 'createdAt', 'updatedAt', 'missingDocuments', 'nextAction', 'nextDate'],
  appointments: ['id', 'date', 'time', 'channel', 'notes', 'status', 'createdAt'],
  deals: ['id', 'title', 'type', 'district', 'stage', 'nextDate', 'nextAction', 'parties', 'createdAt', 'updatedAt'],
  inspections: ['id', 'subject', 'date', 'type', 'result', 'notes', 'nextAction', 'createdAt'],
  alerts: ['id', 'title', 'date', 'type', 'priority', 'done', 'createdAt']
};

const COLLECTION_LIMITS = {
  requests: 30,
  appointments: 20,
  deals: 50,
  inspections: 100,
  alerts: 100
};

const DRAFT_FIELDS = ['service', 'district', 'contactMethod', 'summary'];

export function emptyPortalState() {
  return { draft: null, draftUpdatedAt: null, requests: [], appointments: [], deals: [], inspections: [], alerts: [] };
}

function cleanString(value, field) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return String(value).replace(/\u0000/g, '').slice(0, FIELD_LIMITS[field] || 500);
}

function cleanRecord(value, fields) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const result = {};
  fields.forEach(field => {
    if (field === 'done') result.done = value.done === true;
    else result[field] = cleanString(value[field], field);
  });
  return result;
}

export function sanitizePortalState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyPortalState();
  const state = emptyPortalState();
  const draft = cleanRecord(value.draft, DRAFT_FIELDS);
  state.draft = draft && Object.values(draft).some(Boolean) ? draft : null;
  state.draftUpdatedAt = state.draft ? cleanString(value.draftUpdatedAt, 'updatedAt') || null : null;

  Object.entries(COLLECTIONS).forEach(([collection, fields]) => {
    if (!Array.isArray(value[collection])) return;
    state[collection] = value[collection]
      .slice(0, COLLECTION_LIMITS[collection])
      .map(item => cleanRecord(item, fields))
      .filter(Boolean);
  });
  return state;
}

export function hasPortalContent(state) {
  const safe = sanitizePortalState(state);
  return Boolean(safe.draft || Object.keys(COLLECTIONS).some(key => safe[key].length));
}
