begin;

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create type public.profile_role as enum ('admin', 'student');
create type public.account_status as enum ('active', 'disabled');
create type public.course_status as enum ('draft', 'published', 'archived');
create type public.content_status as enum ('draft', 'published');
create type public.content_type as enum ('text', 'video', 'file', 'link');
create type public.subscription_status as enum ('pending', 'active', 'past_due', 'cancelled', 'expired');
create type public.billing_interval as enum ('month', 'year', 'one_time');
create type public.payment_status as enum ('pending', 'confirmed', 'failed', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  email text not null,
  first_name text not null default '' check (char_length(first_name) <= 100),
  last_name text not null default '' check (char_length(last_name) <= 100),
  phone text check (phone is null or char_length(phone) <= 40),
  role public.profile_role not null default 'student',
  account_status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_email_ci_idx on public.profiles (pg_catalog.lower(email));

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  image_url text,
  requires_active_subscription boolean not null default false,
  status public.course_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.course_contents (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  content_type public.content_type not null default 'text',
  resource_reference text,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, sort_order)
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete restrict,
  course_id uuid not null references public.courses(id) on delete restrict,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (revoked_at is null or revoked_at >= assigned_at)
);

create unique index enrollments_one_active_student_course
  on public.enrollments (student_id, course_id)
  where revoked_at is null;
create index enrollments_course_active_idx
  on public.enrollments (course_id, student_id)
  where revoked_at is null;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete restrict,
  status public.subscription_status not null default 'pending',
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  billing_interval public.billing_interval not null,
  start_date date,
  next_billing_date date,
  end_date date,
  payment_provider text,
  external_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date),
  check (
    (payment_provider is null and external_subscription_id is null)
    or (payment_provider is not null and external_subscription_id is not null)
  )
);

create unique index subscriptions_one_open_per_student_idx
  on public.subscriptions (student_id)
  where status in ('pending', 'active', 'past_due');
create unique index subscriptions_provider_external_id_idx
  on public.subscriptions (payment_provider, external_subscription_id)
  where payment_provider is not null and external_subscription_id is not null;
create index subscriptions_student_created_idx
  on public.subscriptions (student_id, created_at desc);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete restrict,
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  payment_provider text,
  external_payment_id text,
  created_at timestamptz not null default now(),
  check (
    (payment_provider is null and external_payment_id is null)
    or (payment_provider is not null and external_payment_id is not null)
  ),
  check (status <> 'confirmed' or paid_at is not null)
);

create unique index payments_provider_external_id_idx
  on public.payments (payment_provider, external_payment_id)
  where payment_provider is not null and external_payment_id is not null;
create index payments_subscription_created_idx
  on public.payments (subscription_id, created_at desc);

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete restrict,
  action text not null check (char_length(action) between 1 and 100),
  entity_type text not null check (char_length(entity_type) between 1 and 100),
  entity_id text,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now()
);

create index admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
create index admin_audit_log_entity_idx on public.admin_audit_log (entity_type, entity_id);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger courses_set_updated_at before update on public.courses
  for each row execute function private.set_updated_at();
create trigger course_contents_set_updated_at before update on public.course_contents
  for each row execute function private.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function private.set_updated_at();

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'::public.profile_role
      and p.account_status = 'active'::public.account_status
  );
$$;

create function private.can_access_course(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin()
    or exists (
      select 1
      from public.profiles p
      join public.enrollments e on e.student_id = p.id
      join public.courses c on c.id = e.course_id
      where p.id = (select auth.uid())
        and p.role = 'student'::public.profile_role
        and p.account_status = 'active'::public.account_status
        and e.course_id = target_course_id
        and e.revoked_at is null
        and c.status = 'published'::public.course_status
        and (
          not c.requires_active_subscription
          or exists (
            select 1
            from public.subscriptions s
            where s.student_id = p.id
              and s.status = 'active'::public.subscription_status
          )
        )
    );
$$;

create function private.can_access_content(target_content_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.course_contents cc
    where cc.id = target_content_id
      and cc.status = 'published'::public.content_status
      and private.can_access_course(cc.course_id)
  );
$$;

create function private.create_student_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'student'::public.profile_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.create_student_profile();

create function private.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function private.sync_profile_email();

create function private.audit_admin_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := (select auth.uid());
  v_action text;
  v_entity_id text;
  v_details jsonb;
begin
  if v_admin_id is null or not private.is_admin() then
    return new;
  end if;

  if tg_table_name = 'profiles' then
    v_entity_id := new.id::text;
    v_action := case
      when old.account_status is distinct from new.account_status then 'student.status_changed'
      else 'student.updated'
    end;
    v_details := jsonb_build_object(
      'first_name', new.first_name,
      'last_name', new.last_name,
      'phone', new.phone,
      'account_status', new.account_status,
      'role', new.role
    );
  elsif tg_table_name = 'enrollments' then
    v_entity_id := new.id::text;
    if tg_op = 'INSERT' then
      v_action := 'course.assigned';
    elsif old.revoked_at is null and new.revoked_at is not null then
      v_action := 'course.revoked';
    else
      v_action := 'course.assignment_updated';
    end if;
    v_details := jsonb_build_object(
      'student_id', new.student_id,
      'course_id', new.course_id,
      'revoked_at', new.revoked_at
    );
  else
    v_entity_id := new.id::text;
    v_action := tg_table_name || case when tg_op = 'INSERT' then '.created' else '.updated' end;
    v_details := jsonb_build_object('title', new.title, 'status', new.status);
  end if;

  insert into public.admin_audit_log (admin_id, action, entity_type, entity_id, details)
  values (v_admin_id, v_action, tg_table_name, v_entity_id, v_details);

  return new;
end;
$$;

create trigger profiles_admin_audit
  after update on public.profiles
  for each row execute function private.audit_admin_change();
create trigger enrollments_admin_audit
  after insert or update on public.enrollments
  for each row execute function private.audit_admin_change();
create trigger courses_admin_audit
  after insert or update on public.courses
  for each row execute function private.audit_admin_change();
create trigger course_contents_admin_audit
  after insert or update on public.course_contents
  for each row execute function private.audit_admin_change();

create function public.change_subscription_status(
  target_subscription_id uuid,
  new_status public.subscription_status,
  reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := (select auth.uid());
  v_old_status public.subscription_status;
begin
  if v_admin_id is null or not private.is_admin() then
    raise exception 'Administrator authorization required' using errcode = '42501';
  end if;
  if reason is null or pg_catalog.char_length(pg_catalog.btrim(reason)) < 8 then
    raise exception 'A reason of at least eight characters is required' using errcode = '22023';
  end if;

  select s.status into v_old_status
  from public.subscriptions s
  where s.id = target_subscription_id
  for update;

  if not found then
    raise exception 'Subscription not found' using errcode = 'P0002';
  end if;
  if v_old_status = new_status then
    raise exception 'Subscription already has that status' using errcode = '22023';
  end if;
  if not (
    (v_old_status = 'pending' and new_status in ('active', 'cancelled', 'expired'))
    or (v_old_status = 'active' and new_status in ('past_due', 'cancelled', 'expired'))
    or (v_old_status = 'past_due' and new_status in ('active', 'cancelled', 'expired'))
    or (v_old_status = 'cancelled' and new_status = 'expired')
  ) then
    raise exception 'Subscription status transition is not allowed' using errcode = '22023';
  end if;

  update public.subscriptions
  set status = new_status,
      start_date = case when new_status = 'active' and start_date is null then pg_catalog.current_date else start_date end,
      end_date = case when new_status in ('cancelled', 'expired') then pg_catalog.current_date else end_date end
  where id = target_subscription_id;

  insert into public.admin_audit_log (admin_id, action, entity_type, entity_id, details)
  values (
    v_admin_id,
    'subscription.status_changed',
    'subscription',
    target_subscription_id::text,
    pg_catalog.jsonb_build_object('old_status', v_old_status, 'new_status', new_status, 'reason', pg_catalog.btrim(reason))
  );
end;
$$;

create function public.create_subscription(
  target_student_id uuid,
  subscription_amount numeric,
  subscription_currency text,
  subscription_interval public.billing_interval
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := (select auth.uid());
  v_subscription_id uuid;
begin
  if v_admin_id is null or not private.is_admin() then
    raise exception 'Administrator authorization required' using errcode = '42501';
  end if;
  if subscription_amount < 0
    or subscription_currency !~ '^[A-Z]{3}$'
    or subscription_interval is null
  then
    raise exception 'Subscription details are invalid' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = target_student_id
      and p.role = 'student'::public.profile_role
      and p.account_status = 'active'::public.account_status
  ) then
    raise exception 'Active student account not found' using errcode = 'P0002';
  end if;

  insert into public.subscriptions (student_id, amount, currency, billing_interval, status)
  values (target_student_id, subscription_amount, subscription_currency, subscription_interval, 'pending')
  returning id into v_subscription_id;

  insert into public.admin_audit_log (admin_id, action, entity_type, entity_id, details)
  values (
    v_admin_id,
    'subscription.created',
    'subscription',
    v_subscription_id::text,
    pg_catalog.jsonb_build_object(
      'student_id', target_student_id,
      'amount', subscription_amount,
      'currency', subscription_currency,
      'billing_interval', subscription_interval,
      'status', 'pending'
    )
  );
  return v_subscription_id;
end;
$$;

create function public.create_pending_payment(
  target_subscription_id uuid,
  payment_amount numeric,
  reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := (select auth.uid());
  v_student_id uuid;
  v_currency text;
  v_subscription_status public.subscription_status;
  v_payment_id uuid;
begin
  if v_admin_id is null or not private.is_admin() then
    raise exception 'Administrator authorization required' using errcode = '42501';
  end if;
  if payment_amount < 0
    or reason is null
    or pg_catalog.char_length(pg_catalog.btrim(reason)) < 8
  then
    raise exception 'Payment details and a reason are required' using errcode = '22023';
  end if;

  select s.student_id, s.currency, s.status
  into v_student_id, v_currency, v_subscription_status
  from public.subscriptions s
  where s.id = target_subscription_id;

  if not found then
    raise exception 'Subscription not found' using errcode = 'P0002';
  end if;
  if v_subscription_status not in ('pending', 'active', 'past_due') then
    raise exception 'Payments can only be recorded for open subscriptions' using errcode = '22023';
  end if;

  insert into public.payments (subscription_id, amount, currency, status)
  values (target_subscription_id, payment_amount, v_currency, 'pending')
  returning id into v_payment_id;

  insert into public.admin_audit_log (admin_id, action, entity_type, entity_id, details)
  values (
    v_admin_id,
    'payment.pending_recorded',
    'payment',
    v_payment_id::text,
    pg_catalog.jsonb_build_object(
      'student_id', v_student_id,
      'subscription_id', target_subscription_id,
      'amount', payment_amount,
      'currency', v_currency,
      'reason', pg_catalog.btrim(reason)
    )
  );
  return v_payment_id;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.is_admin() from public, anon;
revoke all on function private.can_access_course(uuid) from public, anon;
revoke all on function private.can_access_content(uuid) from public, anon;
revoke all on function private.create_student_profile() from public, anon, authenticated;
revoke all on function private.sync_profile_email() from public, anon, authenticated;
revoke all on function private.audit_admin_change() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.can_access_course(uuid) to authenticated;
grant execute on function private.can_access_content(uuid) to authenticated;
revoke all on function public.change_subscription_status(uuid, public.subscription_status, text) from public, anon;
grant execute on function public.change_subscription_status(uuid, public.subscription_status, text) to authenticated;
revoke all on function public.create_subscription(uuid, numeric, text, public.billing_interval) from public, anon;
grant execute on function public.create_subscription(uuid, numeric, text, public.billing_interval) to authenticated;
revoke all on function public.create_pending_payment(uuid, numeric, text) from public, anon;
grant execute on function public.create_pending_payment(uuid, numeric, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_contents enable row level security;
alter table public.enrollments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.admin_audit_log enable row level security;

revoke all on public.profiles, public.courses, public.course_contents, public.enrollments,
  public.subscriptions, public.payments, public.admin_audit_log from anon, authenticated;

grant select on public.profiles, public.courses, public.course_contents, public.enrollments,
  public.subscriptions, public.payments, public.admin_audit_log to authenticated;
grant update (first_name, last_name, phone) on public.profiles to authenticated;
grant update (first_name, last_name, phone, account_status) on public.profiles to authenticated;
grant insert (student_id, course_id, assigned_by) on public.enrollments to authenticated;
grant update (revoked_at) on public.enrollments to authenticated;
grant insert, update, delete on public.courses, public.course_contents to authenticated;

create policy "profiles_read_self_or_admin"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));
create policy "profiles_update_self_or_admin"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check (
    (id = (select auth.uid()) and role = 'student'::public.profile_role and account_status = 'active'::public.account_status)
    or (select private.is_admin())
  );

create policy "courses_read_accessible_or_admin"
  on public.courses for select to authenticated
  using (status = 'published'::public.course_status and (select private.can_access_course(id))
    or (select private.is_admin()));
create policy "courses_admin_insert"
  on public.courses for insert to authenticated
  with check ((select private.is_admin()));
create policy "courses_admin_update"
  on public.courses for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "courses_admin_delete"
  on public.courses for delete to authenticated
  using ((select private.is_admin()));

create policy "course_contents_read_authorized"
  on public.course_contents for select to authenticated
  using ((status = 'published'::public.content_status and (select private.can_access_course(course_id)))
    or (select private.is_admin()));
create policy "course_contents_admin_insert"
  on public.course_contents for insert to authenticated
  with check ((select private.is_admin()));
create policy "course_contents_admin_update"
  on public.course_contents for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "course_contents_admin_delete"
  on public.course_contents for delete to authenticated
  using ((select private.is_admin()));

create policy "enrollments_read_self_or_admin"
  on public.enrollments for select to authenticated
  using (student_id = (select auth.uid()) or (select private.is_admin()));
create policy "enrollments_admin_insert"
  on public.enrollments for insert to authenticated
  with check ((select private.is_admin())
    and exists (select 1 from public.profiles p where p.id = student_id and p.role = 'student')
    and exists (select 1 from public.profiles p where p.id = assigned_by and p.id = (select auth.uid())));
create policy "enrollments_admin_revoke"
  on public.enrollments for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "subscriptions_read_self_or_admin"
  on public.subscriptions for select to authenticated
  using (student_id = (select auth.uid()) or (select private.is_admin()));

create policy "payments_read_self_or_admin"
  on public.payments for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1
      from public.subscriptions s
      where s.id = subscription_id and s.student_id = (select auth.uid())
    )
  );

create policy "audit_admin_read"
  on public.admin_audit_log for select to authenticated
  using ((select private.is_admin()));
create policy "audit_admin_insert"
  on public.admin_audit_log for insert to authenticated
  with check (admin_id = (select auth.uid()) and (select private.is_admin()));

commit;
