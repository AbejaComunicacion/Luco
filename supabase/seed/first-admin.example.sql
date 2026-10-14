begin;

do $$
declare
  target_user_id uuid := '00000000-0000-0000-0000-000000000000';
begin
  if exists (
    select 1
    from public.profiles
    where role = 'admin' and account_status = 'active'
  ) then
    raise exception 'An active administrator already exists';
  end if;

  update public.profiles
  set role = 'admin', account_status = 'active'
  where id = target_user_id
    and role = 'student'
    and account_status = 'active';

  if not found then
    raise exception 'No active invited account matches the supplied user UUID';
  end if;

  insert into public.admin_audit_log (admin_id, action, entity_type, entity_id, details)
  values (
    target_user_id,
    'admin.initialized',
    'profile',
    target_user_id::text,
    jsonb_build_object('method', 'controlled first-admin bootstrap')
  );
end;
$$;

commit;
