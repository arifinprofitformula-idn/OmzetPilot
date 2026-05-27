-- ============================================================
-- OMZETPILOT — SQL Supabase Schema v1.0
-- Project: OmzetPilot — Asisten Jualan Harian untuk Pebisnis Pemula
-- Core Product: Chat-Based Revenue Action Engine
-- Database: Supabase PostgreSQL
-- Status: Build Draft v1.0
-- ============================================================

-- IMPORTANT NOTES
-- 1. This schema follows OmzetPilot Data Schema v1.1 Final.
-- 2. OmzetPilot is NOT a CRM. Do not add leads/contacts/deals pipeline tables yet.
-- 3. Telegram Bot is stateless. Supabase is the source of truth.
-- 4. RGA is calculated from mission_items.status = 'done'.
-- 5. For MVP, interviews and founder_notes stay in Google Sheet/Notion.
-- 6. mission_templates is deferred to later phase.

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. UPDATED_AT TRIGGER FUNCTION
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 2. USERS
-- ============================================================

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  whatsapp_number text not null,
  telegram_username text,
  telegram_chat_id text,
  email text,
  status text not null default 'active'
    check (status in ('active', 'at_risk', 'inactive', 'dropped', 'backup')),
  fit_score text
    check (fit_score is null or fit_score in ('strong_fit', 'medium_fit', 'weak_fit', 'reject')),
  cohort_name text not null default 'alpha_batch_1',
  consent_given boolean not null default false,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create index if not exists idx_users_cohort_name on public.users(cohort_name);
create index if not exists idx_users_status on public.users(status);
create index if not exists idx_users_telegram_chat_id on public.users(telegram_chat_id);
create index if not exists idx_users_whatsapp_number on public.users(whatsapp_number);

comment on table public.users is 'Identitas user OmzetPilot. cohort_name disimpan langsung di users untuk MVP, tanpa tabel cohorts.';
comment on column public.users.fit_score is 'strong_fit, medium_fit, weak_fit, reject. Dipakai untuk menyaring alpha tester.';
comment on column public.users.consent_given is 'Persetujuan user agar data bisnis dasar dan laporan aktivitas harian digunakan untuk misi jualan.';

-- ============================================================
-- 3. BUSINESS PROFILES
-- ============================================================

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  business_name text not null,
  business_segment text not null
    check (business_segment in ('produk_fisik', 'jasa_mikro', 'digital_product', 'lainnya')),
  product_or_service_summary text not null,
  target_customer text not null,
  main_sales_channel text not null,
  main_sales_problem text not null,
  has_customer_database text not null
    check (has_customer_database in ('banyak', 'sedikit', 'tidak_ada', 'tidak_yakin')),
  contact_estimate text not null
    check (contact_estimate in ('0', '1-5', '6-20', '21-50', '>50')),
  current_offer text,
  status text not null default 'active'
    check (status in ('active', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_business_profiles_updated_at
before update on public.business_profiles
for each row execute function public.set_updated_at();

create index if not exists idx_business_profiles_user_id on public.business_profiles(user_id);
create index if not exists idx_business_profiles_segment on public.business_profiles(business_segment);

comment on table public.business_profiles is 'Profil bisnis user dari onboarding lite. Data harus cukup untuk menghasilkan misi harian, bukan analisis bisnis panjang.';

-- ============================================================
-- 4. PRODUCTS
-- ============================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  business_profile_id uuid not null references public.business_profiles(id) on delete cascade,
  product_name text not null,
  product_description text,
  price numeric(14,2),
  availability_status text
    check (availability_status is null or availability_status in ('ready', 'limited', 'po', 'not_ready')),
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create index if not exists idx_products_user_id on public.products(user_id);
create index if not exists idx_products_business_profile_id on public.products(business_profile_id);
create index if not exists idx_products_is_primary on public.products(is_primary);

comment on table public.products is 'Produk/jasa fokus untuk misi harian. MVP bisa hanya 1 produk utama per user.';

-- ============================================================
-- 5. MISSIONS
-- ============================================================

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  business_profile_id uuid not null references public.business_profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  mission_date date not null,
  delivery_channel text not null
    check (delivery_channel in ('whatsapp_manual', 'telegram_bot', 'whatsapp_auto', 'web')),
  mission_status text not null default 'drafted'
    check (mission_status in ('drafted', 'sent', 'reported', 'missed', 'cancelled')),
  prompt_version text not null default 'prompt_master_v1_1',
  created_by text not null default 'ai_system'
    check (created_by in ('human_operator', 'ai_system')),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, mission_date)
);

create trigger trg_missions_updated_at
before update on public.missions
for each row execute function public.set_updated_at();

create index if not exists idx_missions_user_date on public.missions(user_id, mission_date);
create index if not exists idx_missions_status on public.missions(mission_status);
create index if not exists idx_missions_delivery_channel on public.missions(delivery_channel);

comment on table public.missions is 'Satu paket misi harian untuk user. Detail 3 misi ada di mission_items.';

-- ============================================================
-- 6. MISSION ITEMS
-- ============================================================

create table if not exists public.mission_items (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  mission_type text not null
    check (mission_type in ('follow_up', 'offer', 'content_traffic', 'referral', 'reactivation', 'closing_push')),
  mission_order integer not null check (mission_order between 1 and 3),
  target_description text not null,
  action_instruction text not null,
  script_text text,
  target_minimum text,
  status text not null default 'pending'
    check (status in ('pending', 'done', 'skipped')),
  completed_at timestamptz,
  quality_score numeric(3,2),
  quality_status text
    check (quality_status is null or quality_status in ('send', 'revise')),
  created_at timestamptz not null default now(),
  unique(mission_id, mission_order)
);

create index if not exists idx_mission_items_mission_id on public.mission_items(mission_id);
create index if not exists idx_mission_items_user_status on public.mission_items(user_id, status);
create index if not exists idx_mission_items_type on public.mission_items(mission_type);

comment on table public.mission_items is 'Detail 3 misi harian. Dipisah agar analitik per tipe misi bisa dilakukan.';

-- ============================================================
-- 7. MISSION REPORTS
-- ============================================================

create table if not exists public.mission_reports (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  report_code text not null check (report_code in ('1', '2', '3', '4')),
  rga_count integer not null default 0 check (rga_count >= 0),
  chats_sent integer check (chats_sent is null or chats_sent >= 0),
  responses_count integer check (responses_count is null or responses_count >= 0),
  closing_status boolean not null default false,
  revenue_amount numeric(14,2),
  obstacle text,
  raw_user_reply text,
  reported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(mission_id)
);

create index if not exists idx_mission_reports_user_id on public.mission_reports(user_id);
create index if not exists idx_mission_reports_mission_id on public.mission_reports(mission_id);
create index if not exists idx_mission_reports_report_code on public.mission_reports(report_code);

comment on table public.mission_reports is 'Laporan sore user. RGA idealnya dihitung dari mission_items.status = done.';

-- ============================================================
-- 8. MISSION EVALUATIONS
-- ============================================================

create table if not exists public.mission_evaluations (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  evaluation_status text not null
    check (evaluation_status in ('bergerak', 'perlu_dipermudah', 'perlu_follow_up', 'ada_sinyal_closing')),
  insight_summary text,
  recommendation_next_day text,
  admin_note text,
  created_by text not null default 'ai_system'
    check (created_by in ('human_operator', 'ai_system')),
  created_at timestamptz not null default now(),
  unique(mission_id)
);

create index if not exists idx_mission_evaluations_user_id on public.mission_evaluations(user_id);
create index if not exists idx_mission_evaluations_status on public.mission_evaluations(evaluation_status);

comment on table public.mission_evaluations is 'Evaluasi harian yang menjadi input misi besok.';

-- ============================================================
-- 9. AI LOGS
-- ============================================================

create table if not exists public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  mission_id uuid references public.missions(id) on delete set null,
  prompt_version text not null,
  model_provider text not null
    check (model_provider in ('openai', 'gemini', 'anthropic', 'other')),
  model_name text not null,
  input_payload jsonb not null,
  output_payload jsonb not null,
  token_input_estimate integer check (token_input_estimate is null or token_input_estimate >= 0),
  token_output_estimate integer check (token_output_estimate is null or token_output_estimate >= 0),
  estimated_cost numeric(12,6),
  status text not null
    check (status in ('success', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_logs_user_id on public.ai_logs(user_id);
create index if not exists idx_ai_logs_mission_id on public.ai_logs(mission_id);
create index if not exists idx_ai_logs_created_at on public.ai_logs(created_at);
create index if not exists idx_ai_logs_status on public.ai_logs(status);

comment on table public.ai_logs is 'Log AI untuk audit, debugging, dan cost control. Tidak diekspos ke user.';

-- ============================================================
-- 10. USER ACTIVITY LOGS
-- ============================================================

create table if not exists public.user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  mission_id uuid references public.missions(id) on delete set null,
  activity_type text not null
    check (activity_type in ('mission_sent', 'mission_read', 'mission_item_done', 'report_received', 'reminder_sent', 'payment_offered')),
  channel text not null
    check (channel in ('whatsapp', 'telegram', 'web')),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_activity_logs_user_id on public.user_activity_logs(user_id);
create index if not exists idx_user_activity_logs_mission_id on public.user_activity_logs(mission_id);
create index if not exists idx_user_activity_logs_activity_type on public.user_activity_logs(activity_type);
create index if not exists idx_user_activity_logs_created_at on public.user_activity_logs(created_at);

comment on table public.user_activity_logs is 'Log perilaku user pada misi dan delivery layer.';

-- ============================================================
-- 11. PAYMENT VALIDATIONS
-- ============================================================

create table if not exists public.payment_validations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  cohort_name text,
  offer_type text not null
    check (offer_type in ('founder_trial_extension', 'founder_plan')),
  verbal_intent text
    check (verbal_intent is null or verbal_intent in ('yes', 'maybe', 'no')),
  commitment_action boolean not null default false,
  payment_action text not null default 'not_offered'
    check (payment_action in ('paid', 'pending', 'no', 'not_offered')),
  amount_paid numeric(14,2),
  payment_method text
    check (payment_method is null or payment_method in ('transfer', 'qris', 'ewallet', 'other')),
  payment_date timestamptz,
  reason_if_no text,
  follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_payment_validations_updated_at
before update on public.payment_validations
for each row execute function public.set_updated_at();

create index if not exists idx_payment_validations_user_id on public.payment_validations(user_id);
create index if not exists idx_payment_validations_cohort_name on public.payment_validations(cohort_name);
create index if not exists idx_payment_validations_payment_action on public.payment_validations(payment_action);

comment on table public.payment_validations is 'Validasi willingness to pay. Payment action lebih kuat daripada verbal intent.';

-- ============================================================
-- 12. SUBSCRIPTIONS
-- ============================================================

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_name text not null
    check (plan_name in ('founder_trial', 'founder_plan', 'pro')),
  price numeric(14,2) not null,
  status text not null
    check (status in ('active', 'expired', 'cancelled', 'trial')),
  start_date date not null,
  end_date date,
  payment_validation_id uuid references public.payment_validations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_end_date on public.subscriptions(end_date);

comment on table public.subscriptions is 'Status langganan user. Bisa ditunda sampai Paid Beta, tapi schema disiapkan.';

-- ============================================================
-- 13. HELPER FUNCTION: CALCULATE RGA
-- ============================================================

create or replace function public.calculate_rga_count(p_mission_id uuid)
returns integer
language sql
stable
as $$
  select count(*)::integer
  from public.mission_items
  where mission_id = p_mission_id
    and status = 'done';
$$;

comment on function public.calculate_rga_count(uuid) is 'Menghitung RGA berdasarkan jumlah mission_items yang berstatus done.';

-- ============================================================
-- 14. HELPER FUNCTION: MARK MISSION ITEM DONE
-- ============================================================

create or replace function public.mark_mission_item_done(p_mission_item_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.mission_items
  set status = 'done',
      completed_at = now()
  where id = p_mission_item_id
    and status <> 'done';
end;
$$;

comment on function public.mark_mission_item_done(uuid) is 'Menandai mission item sebagai done. Untuk dipanggil dari bot/API dengan kontrol akses.';

-- ============================================================
-- 15. VIEWS FOR FOUNDER DASHBOARD
-- ============================================================

create or replace view public.v_user_mission_summary as
select
  u.id as user_id,
  u.full_name,
  u.whatsapp_number,
  u.telegram_username,
  u.status as user_status,
  u.fit_score,
  u.cohort_name,
  count(distinct m.id) as total_mission_days,
  count(mi.id) filter (where mi.status = 'done') as total_rga,
  count(mi.id) as total_mission_items,
  count(mr.id) as total_reports,
  coalesce(sum(mr.chats_sent), 0) as total_chats_sent,
  coalesce(sum(mr.responses_count), 0) as total_responses,
  count(mr.id) filter (where mr.closing_status = true) as total_closings,
  coalesce(sum(mr.revenue_amount), 0) as total_revenue
from public.users u
left join public.missions m on m.user_id = u.id
left join public.mission_items mi on mi.mission_id = m.id
left join public.mission_reports mr on mr.mission_id = m.id
group by u.id;

comment on view public.v_user_mission_summary is 'Ringkasan founder dashboard untuk membaca RGA, reports, closing, dan revenue per user.';

-- ============================================================
-- 16. ROW LEVEL SECURITY
-- ============================================================
-- IMPORTANT:
-- - Supabase service_role bypasses RLS and should be used by trusted server-side functions only.
-- - For MVP bot, Telegram webhook should run server-side using service role.
-- - If user login is implemented, auth.uid() should equal public.users.id.
-- - Adjust policies if using separate auth profile mapping.

alter table public.users enable row level security;
alter table public.business_profiles enable row level security;
alter table public.products enable row level security;
alter table public.missions enable row level security;
alter table public.mission_items enable row level security;
alter table public.mission_reports enable row level security;
alter table public.mission_evaluations enable row level security;
alter table public.ai_logs enable row level security;
alter table public.user_activity_logs enable row level security;
alter table public.payment_validations enable row level security;
alter table public.subscriptions enable row level security;

-- USERS policies
create policy "users_select_own"
on public.users
for select
to authenticated
using (auth.uid() = id);

create policy "users_update_own_limited"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- BUSINESS PROFILES policies
create policy "business_profiles_select_own"
on public.business_profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "business_profiles_insert_own"
on public.business_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "business_profiles_update_own"
on public.business_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- PRODUCTS policies
create policy "products_select_own"
on public.products
for select
to authenticated
using (auth.uid() = user_id);

create policy "products_insert_own"
on public.products
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "products_update_own"
on public.products
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- MISSIONS policies
create policy "missions_select_own"
on public.missions
for select
to authenticated
using (auth.uid() = user_id);

-- MISSION ITEMS policies
create policy "mission_items_select_own"
on public.mission_items
for select
to authenticated
using (auth.uid() = user_id);

create policy "mission_items_update_own"
on public.mission_items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- MISSION REPORTS policies
create policy "mission_reports_select_own"
on public.mission_reports
for select
to authenticated
using (auth.uid() = user_id);

create policy "mission_reports_insert_own"
on public.mission_reports
for insert
to authenticated
with check (auth.uid() = user_id);

-- MISSION EVALUATIONS policies
create policy "mission_evaluations_select_own"
on public.mission_evaluations
for select
to authenticated
using (auth.uid() = user_id);

-- AI LOGS
-- No user access policy intentionally. ai_logs should be internal only.

-- USER ACTIVITY LOGS
create policy "user_activity_logs_select_own"
on public.user_activity_logs
for select
to authenticated
using (auth.uid() = user_id);

-- PAYMENT VALIDATIONS
create policy "payment_validations_select_own"
on public.payment_validations
for select
to authenticated
using (auth.uid() = user_id);

-- SUBSCRIPTIONS
create policy "subscriptions_select_own"
on public.subscriptions
for select
to authenticated
using (auth.uid() = user_id);

-- ============================================================
-- 17. OPTIONAL SAMPLE SEED DATA
-- ============================================================
-- Uncomment for local/dev testing only.

-- insert into public.users (
--   full_name,
--   whatsapp_number,
--   telegram_username,
--   status,
--   fit_score,
--   cohort_name,
--   consent_given,
--   consent_at
-- ) values (
--   'Alpha Tester 1',
--   '6281234567890',
--   'alphatester1',
--   'active',
--   'medium_fit',
--   'alpha_batch_1',
--   true,
--   now()
-- );

-- ============================================================
-- END OF SCHEMA
-- ============================================================
