import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClerkClient } from '@clerk/backend';
import QRCode from 'qrcode';

const REPORT_TYPES = new Set(['PROPERTY-MANAGEMENT', 'VALUATION', 'INSPECTION', 'TRANSACTION']);

function toWebRequest(request) {
  const protocol = request.headers['x-forwarded-proto'] || 'https';
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  const headers = new Headers();
  Object.entries(request.headers).forEach(([name, value]) => {
    if (Array.isArray(value)) headers.set(name, value.join(', '));
    else if (typeof value === 'string') headers.set(name, value);
  });
  return new Request(`${protocol}://${host}${request.url}`, { method: request.method, headers });
}

function authorizedParties() {
  const parties = ['https://emad-aden-realestate.vercel.app'];
  if (process.env.VERCEL_URL) parties.push(`https://${process.env.VERCEL_URL}`);
  return [...new Set(parties)];
}

function bodyOf(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') {
    try { return JSON.parse(request.body); } catch { return {}; }
  }
  return {};
}

function normalize(value, maximumLength) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '').slice(0, maximumLength);
}

function reportPayload(input) {
  const reportId = normalize(input.reportId, 80);
  const reportDate = normalize(input.reportDate, 10);
  const reportType = normalize(input.reportType, 40);
  if (!reportId || !/^\d{4}-\d{2}-\d{2}$/.test(reportDate) || !REPORT_TYPES.has(reportType)) return null;
  return { reportId, reportDate, reportType };
}

function canonical(payload) {
  return `${payload.reportType}|${payload.reportId}|${payload.reportDate}`;
}

export function createVerificationCode(payload, secret) {
  const digest = createHmac('sha256', secret).update(canonical(payload)).digest('hex').toUpperCase().slice(0, 12);
  return `${digest.slice(0, 4)}-${digest.slice(4, 8)}-${digest.slice(8)}`;
}

export function codeMatches(payload, code, secret) {
  const expected = createVerificationCode(payload, secret).replaceAll('-', '');
  const received = normalize(code, 20).replaceAll('-', '');
  if (expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

async function isSignedIn(request, secretKey, publishableKey) {
  const clerk = createClerkClient({ secretKey, publishableKey });
  const state = await clerk.authenticateRequest(toWebRequest(request), { authorizedParties: authorizedParties() });
  return state.isAuthenticated;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY;
  const signingSecret = process.env.REPORT_SIGNING_SECRET || secretKey;
  if (!signingSecret) return response.status(503).json({ error: 'Report verification is not configured' });

  const body = bodyOf(request);
  const payload = reportPayload(body);
  if (!payload) return response.status(400).json({ error: 'Invalid report data' });

  if (body.action === 'issue') {
    if (!secretKey || !publishableKey) return response.status(503).json({ error: 'Authentication is not configured' });
    try {
      if (!await isSignedIn(request, secretKey, publishableKey)) return response.status(401).json({ error: 'Authentication required' });
    } catch {
      return response.status(401).json({ error: 'Authentication required' });
    }
    return response.status(200).json({
      code: createVerificationCode(payload, signingSecret),
      qrCode: await QRCode.toDataURL(
        `https://emad-aden-realestate.vercel.app/report-verification.html?reportId=${encodeURIComponent(payload.reportId)}&reportDate=${payload.reportDate}&reportType=${payload.reportType}&code=${encodeURIComponent(createVerificationCode(payload, signingSecret))}`,
        { width: 320, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#ffffff' } }
      ),
      verificationLevel: 'authenticated-system-report'
    });
  }

  if (body.action === 'verify') {
    return response.status(200).json({
      valid: codeMatches(payload, body.code, signingSecret),
      verificationLevel: 'authenticated-system-report'
    });
  }

  return response.status(400).json({ error: 'Invalid action' });
}
