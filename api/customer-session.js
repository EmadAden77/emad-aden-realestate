import { createClerkClient } from '@clerk/backend';

function toWebRequest(request) {
  const protocol = request.headers['x-forwarded-proto'] || 'https';
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  const headers = new Headers();

  Object.entries(request.headers).forEach(([name, value]) => {
    if (Array.isArray(value)) headers.set(name, value.join(', '));
    else if (typeof value === 'string') headers.set(name, value);
  });

  return new Request(`${protocol}://${host}${request.url}`, {
    method: request.method,
    headers
  });
}

function authorizedParties() {
  const parties = ['https://emad-aden-realestate.vercel.app'];
  if (process.env.VERCEL_URL) parties.push(`https://${process.env.VERCEL_URL}`);
  return [...new Set(parties)];
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    || process.env.CLERK_PUBLISHABLE_KEY;

  if (!secretKey || !publishableKey) {
    return response.status(503).json({ error: 'Authentication is not configured' });
  }

  try {
    const clerk = createClerkClient({ secretKey, publishableKey });
    const state = await clerk.authenticateRequest(toWebRequest(request), {
      authorizedParties: authorizedParties()
    });

    if (!state.isAuthenticated) {
      response.setHeader('Cache-Control', 'no-store');
      return response.status(401).json({ authenticated: false });
    }

    const auth = state.toAuth();
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return response.status(200).json({
      authenticated: true,
      userId: auth.userId,
      sessionId: auth.sessionId
    });
  } catch (error) {
    response.setHeader('Cache-Control', 'no-store');
    return response.status(401).json({ authenticated: false });
  }
}
