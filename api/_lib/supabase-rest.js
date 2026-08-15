const ALLOWED_TABLES = new Set(['customer_portal_states', 'property_management_states']);

export function storageConfiguration() {
  const baseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!baseUrl || !secretKey) return null;
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== 'https:') return null;
    return { baseUrl: url.origin, secretKey };
  } catch {
    return null;
  }
}

function dataHeaders(secretKey, extras = {}) {
  return {
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...extras
  };
}

function tableEndpoint(configuration, table) {
  if (!ALLOWED_TABLES.has(table)) throw new Error('INVALID_STORAGE_TABLE');
  return new URL(`/rest/v1/${table}`, configuration.baseUrl);
}

export async function readUserState(configuration, table, userId) {
  const endpoint = tableEndpoint(configuration, table);
  endpoint.searchParams.set('user_id', `eq.${userId}`);
  endpoint.searchParams.set('select', 'state,updated_at');
  endpoint.searchParams.set('limit', '1');
  const result = await fetch(endpoint, {
    headers: dataHeaders(configuration.secretKey),
    cache: 'no-store'
  });
  if (!result.ok) throw new Error(`SUPABASE_READ_${result.status}`);
  const rows = await result.json();
  return rows[0] || null;
}

export async function writeUserState(configuration, table, userId, state) {
  const endpoint = tableEndpoint(configuration, table);
  endpoint.searchParams.set('on_conflict', 'user_id');
  const result = await fetch(endpoint, {
    method: 'POST',
    headers: dataHeaders(configuration.secretKey, {
      Prefer: 'resolution=merge-duplicates,return=representation'
    }),
    body: JSON.stringify({ user_id: userId, state, updated_at: new Date().toISOString() })
  });
  if (!result.ok) throw new Error(`SUPABASE_WRITE_${result.status}`);
  const rows = await result.json();
  return rows[0] || null;
}
