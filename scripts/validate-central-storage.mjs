import { readFile } from 'node:fs/promises';
import { sanitizePortalState } from '../api/_lib/portal-state.js';
import { sanitizePropertyState } from '../api/_lib/property-state.js';

const failures = [];
const oversized = 'س'.repeat(3000);
const portal = sanitizePortalState({
  draft: { service: 'إدارة أملاك', summary: oversized, ignored: 'secret' },
  requests: Array.from({ length: 45 }, (_, index) => ({ id: `R-${index}`, service: 'خدمة', summary: oversized })),
  alerts: [{ id: 'A-1', title: 'موعد', done: 'yes' }],
  injected: [{ value: 'ignored' }]
});

if (portal.requests.length !== 30) failures.push('حد الطلبات غير مطبق.');
if (portal.requests[0].summary.length !== 1600) failures.push('حد نص الطلب غير مطبق.');
if ('ignored' in portal.draft || 'injected' in portal) failures.push('حقول بوابة غير مسموحة عبرت المنقّي.');
if (portal.alerts[0].done !== false) failures.push('القيم المنطقية غير منقاة.');

const property = sanitizePropertyState({
  properties: [{ id: 'P-1', name: oversized, units: -5, unexpected: true }],
  tenants: Array.from({ length: 230 }, (_, index) => ({ id: `T-${index}`, monthlyRent: '1250' }))
});
if (property.tenants.length !== 200) failures.push('حد المستأجرين غير مطبق.');
if (property.properties[0].name.length !== 240) failures.push('حد اسم العقار غير مطبق.');
if (property.properties[0].units !== 0 || 'unexpected' in property.properties[0]) failures.push('تنقية سجل العقار غير صحيحة.');

const [portalApi, propertyApi, customerClient, propertyClient, sql] = await Promise.all([
  readFile('api/customer-portal-state.js', 'utf8'),
  readFile('api/property-management-state.js', 'utf8'),
  readFile('assets/js/customer-portal.js', 'utf8'),
  readFile('assets/js/property-management.js', 'utf8'),
  readFile('supabase/customer-portal.sql', 'utf8')
]);

for (const [name, source] of [['بوابة العملاء', portalApi], ['إدارة الأملاك', propertyApi]]) {
  for (const marker of ['authenticateCustomer', 'isTrustedMutation', "['GET', 'PUT']", 'Cache-Control']) {
    if (!source.includes(marker)) failures.push(`${name}: واجهة الحفظ تفتقد ${marker}.`);
  }
}
if (!customerClient.includes("fetch('/api/customer-portal-state'")) failures.push('واجهة العميل غير مرتبطة بالحفظ المركزي.');
if (!propertyClient.includes("fetch('/api/property-management-state'")) failures.push('إدارة الأملاك غير مرتبطة بالحفظ المركزي.');
if ((sql.match(/enable row level security/gi) || []).length !== 2) failures.push('RLS غير مفعّل على الجدولين.');

if (failures.length) {
  console.error(failures.map(message => `ERROR: ${message}`).join('\n'));
  process.exit(1);
}
console.log('OK: central storage schemas, sanitizers, authentication gates and offline fallback are wired correctly.');
