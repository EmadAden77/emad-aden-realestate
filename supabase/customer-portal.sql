-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor.
-- لا توجد سياسات وصول للمتصفح؛ القراءة والكتابة تمران عبر Vercel فقط.

create table if not exists public.customer_portal_states (
  user_id text primary key check (char_length(user_id) between 3 and 128),
  state jsonb not null default '{"draft":null,"draftUpdatedAt":null,"requests":[],"appointments":[],"deals":[],"inspections":[],"alerts":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint customer_portal_state_size check (pg_column_size(state) <= 65536)
);

comment on table public.customer_portal_states is
  'حالة بوابة العميل المرتبطة بمعرف Clerk؛ الوصول الخادمي فقط.';

alter table public.customer_portal_states enable row level security;
revoke all on table public.customer_portal_states from anon, authenticated;
grant select, insert, update on table public.customer_portal_states to service_role;

create table if not exists public.property_management_states (
  user_id text primary key check (char_length(user_id) between 3 and 128),
  state jsonb not null default '{"properties":[],"tenants":[],"rents":[],"maintenance":[],"expenses":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint property_management_state_size check (pg_column_size(state) <= 204800)
);

comment on table public.property_management_states is
  'سجلات إدارة الأملاك المرتبطة بمعرف Clerk؛ الوصول الخادمي فقط.';

alter table public.property_management_states enable row level security;
revoke all on table public.property_management_states from anon, authenticated;
grant select, insert, update on table public.property_management_states to service_role;
