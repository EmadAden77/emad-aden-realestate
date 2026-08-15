import { AuthConfigurationError, authenticateCustomer } from './_lib/customer-auth.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await authenticateCustomer(request);
    if (!auth) {
      response.setHeader('Cache-Control', 'no-store');
      return response.status(401).json({ authenticated: false });
    }
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return response.status(200).json({
      authenticated: true,
      userId: auth.userId,
      sessionId: auth.sessionId
    });
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      return response.status(503).json({ error: error.message });
    }
    response.setHeader('Cache-Control', 'no-store');
    return response.status(401).json({ authenticated: false });
  }
}
