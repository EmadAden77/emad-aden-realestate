const ENDPOINT = '/api/report-verification';

function payload(values) {
  return {
    reportId: String(values.reportId || '').trim(),
    reportDate: String(values.reportDate || '').trim(),
    reportType: String(values.reportType || '').trim()
  };
}

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'تعذر الاتصال بخدمة التحقق.');
  return data;
}

export async function issueVerificationCode(values, getToken) {
  const token = await getToken();
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ action: 'issue', ...payload(values) }),
    cache: 'no-store'
  });
  return readResponse(response);
}

export async function verifyReportCode(values) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'verify', ...payload(values), code: String(values.code || '').trim() }),
    cache: 'no-store'
  });
  return readResponse(response);
}
