import { AuthConfigurationError, authenticateCustomer, isTrustedMutation } from './_lib/customer-auth.js';
import { emptyPropertyState, sanitizePropertyState } from './_lib/property-state.js';
import { readUserState, storageConfiguration, writeUserState } from './_lib/supabase-rest.js';

const TABLE = 'property_management_states';
const MAX_BODY_BYTES = 220_000;

function parseBody(request) {
  const declaredLength = Number(request.headers['content-length'] || 0);
  if (declaredLength > MAX_BODY_BYTES) throw new Error('PAYLOAD_TOO_LARGE');
  const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
  if (!body || typeof body !== 'object') throw new Error('INVALID_BODY');
  if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) throw new Error('PAYLOAD_TOO_LARGE');
  return body;
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Vary', 'Authorization');

  if (!['GET', 'PUT'].includes(request.method)) {
    response.setHeader('Allow', 'GET, PUT');
    return response.status(405).json({ error: 'Method not allowed' });
  }
  if (request.method === 'PUT' && !isTrustedMutation(request)) {
    return response.status(403).json({ error: 'Untrusted request origin' });
  }

  try {
    const auth = await authenticateCustomer(request);
    if (!auth?.userId) return response.status(401).json({ authenticated: false });
    const configuration = storageConfiguration();
    if (!configuration) return response.status(503).json({ error: 'Central storage is not configured', code: 'PORTAL_STORAGE_UNAVAILABLE' });

    if (request.method === 'GET') {
      const row = await readUserState(configuration, TABLE, auth.userId);
      return response.status(200).json({
        state: row ? sanitizePropertyState(row.state) : emptyPropertyState(),
        updatedAt: row?.updated_at || null,
        storage: 'central'
      });
    }

    const state = sanitizePropertyState(parseBody(request).state);
    const row = await writeUserState(configuration, TABLE, auth.userId, state);
    return response.status(200).json({
      state: sanitizePropertyState(row?.state || state),
      updatedAt: row?.updated_at || new Date().toISOString(),
      storage: 'central'
    });
  } catch (error) {
    if (error instanceof AuthConfigurationError) return response.status(503).json({ error: error.message });
    if (error.message === 'PAYLOAD_TOO_LARGE') return response.status(413).json({ error: 'Property state is too large' });
    if (error.message === 'INVALID_BODY' || error instanceof SyntaxError) return response.status(400).json({ error: 'Invalid request body' });
    console.error('property-management-state failure', error.message);
    return response.status(502).json({ error: 'Central storage is temporarily unavailable' });
  }
}
