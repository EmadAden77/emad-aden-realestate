import { createClerkClient } from '@clerk/backend';

export class AuthConfigurationError extends Error {}

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

export function authorizedParties() {
  const parties = ['https://emad-aden-realestate.vercel.app'];
  if (process.env.SITE_URL) parties.push(process.env.SITE_URL);
  if (process.env.VERCEL_URL) parties.push(`https://${process.env.VERCEL_URL}`);
  return [...new Set(parties.map(value => value.replace(/\/$/, '')))];
}

export function isTrustedMutation(request) {
  const origin = request.headers.origin;
  if (origin) return authorizedParties().includes(origin.replace(/\/$/, ''));
  return ['same-origin', 'same-site'].includes(request.headers['sec-fetch-site']);
}

export async function authenticateCustomer(request) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    || process.env.CLERK_PUBLISHABLE_KEY;

  if (!secretKey || !publishableKey) {
    throw new AuthConfigurationError('Authentication is not configured');
  }

  const clerk = createClerkClient({ secretKey, publishableKey });
  const state = await clerk.authenticateRequest(toWebRequest(request), {
    authorizedParties: authorizedParties()
  });

  if (!state.isAuthenticated) return null;
  return state.toAuth();
}
