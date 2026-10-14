select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  count(p.policyname) as policy_count
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
left join pg_catalog.pg_policies p
  on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'profiles', 'courses', 'course_contents', 'enrollments',
    'subscriptions', 'payments', 'admin_audit_log'
  )
group by c.relname, c.relrowsecurity, c.relforcerowsecurity
order by c.relname;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_catalog.pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles', 'courses', 'course_contents', 'enrollments',
    'subscriptions', 'payments', 'admin_audit_log'
  )
order by tablename, policyname;

select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'profiles', 'courses', 'course_contents', 'enrollments',
    'subscriptions', 'payments', 'admin_audit_log'
  )
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

select
  routine_schema,
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema in ('public', 'private')
  and routine_name in (
    'is_admin', 'can_access_course', 'can_access_content',
    'change_subscription_status', 'create_subscription', 'create_pending_payment'
  )
  and grantee in ('anon', 'authenticated', 'PUBLIC')
order by routine_schema, routine_name, grantee;
