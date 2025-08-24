
-- 1) Helper: validate admin sessions (uses existing admin_sessions)
create or replace function public.is_valid_admin(token text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_sessions
    where session_token = token
      and expires_at > now()
  );
$$;

-- 2) Fix recursive policies: safe role check
create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- Drop existing recursive policies on user_roles
drop policy if exists "Admins can delete roles" on public.user_roles;
drop policy if exists "Admins can insert roles" on public.user_roles;
drop policy if exists "Admins can update roles" on public.user_roles;
drop policy if exists "Admins can view all roles" on public.user_roles;
drop policy if exists "Users can view their own roles" on public.user_roles;

-- Recreate clean policies
alter table public.user_roles enable row level security;

-- Admins can manage roles
create policy "Admins can insert roles"
  on public.user_roles for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update roles"
  on public.user_roles for update
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete roles"
  on public.user_roles for delete
  using (public.has_role(auth.uid(), 'admin'));

-- Admins can view all roles
create policy "Admins can view all roles"
  on public.user_roles for select
  using (public.has_role(auth.uid(), 'admin'));

-- Users can view their own roles
create policy "Users can view their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

-- 3) Admin RPCs (All SECURITY DEFINER; validate admin via is_valid_admin())

-- 3a) Users: list and promote
create or replace function public.admin_get_users(admin_token text)
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  full_name text,
  role text,
  subscribed boolean,
  subscription_tier text,
  subscription_end timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_valid_admin(admin_token) then
    raise exception 'Unauthorized: Invalid or expired admin session';
  end if;

  return query
  select
    u.id,
    u.email,
    u.created_at,
    p.full_name,
    case
      when exists (select 1 from public.user_roles r where r.user_id = u.id and r.role = 'admin') then 'admin'
      else 'user'
    end as role,
    coalesce(s.subscribed, false) as subscribed,
    s.subscription_tier,
    s.subscription_end
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.subscribers s on s.user_id = u.id or s.email = u.email
  order by u.created_at desc;

end;
$$;

create or replace function public.admin_make_user_admin(admin_token text, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_admin(admin_token) then
    raise exception 'Unauthorized: Invalid or expired admin session';
  end if;

  insert into public.user_roles (user_id, role)
  select target_user_id, 'admin'
  where not exists (
    select 1 from public.user_roles
    where user_id = target_user_id and role = 'admin'
  );

  perform public.log_admin_activity(admin_token, 'grant_role', 'user', target_user_id::text, jsonb_build_object('role','admin'));
end;
$$;

-- 3b) Orders: list and update status
create or replace function public.admin_get_orders(admin_token text)
returns table (
  id uuid,
  user_id uuid,
  user_email text,
  total_amount numeric,
  items_count integer,
  shipping_address jsonb,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_valid_admin(admin_token) then
    raise exception 'Unauthorized: Invalid or expired admin session';
  end if;

  return query
  select
    o.id,
    o.user_id,
    u.email as user_email,
    o.total_amount,
    coalesce( (select sum(oi.quantity) from public.order_items oi where oi.order_id = o.id), 0 )::int as items_count,
    o.shipping_address,
    o.status,
    o.created_at
  from public.orders o
  left join auth.users u on u.id = o.user_id
  order by o.created_at desc;
end;
$$;

create or replace function public.admin_update_order_status(admin_token text, p_order_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_admin(admin_token) then
    raise exception 'Unauthorized: Invalid or expired admin session';
  end if;

  update public.orders
  set status = p_status, updated_at = now()
  where id = p_order_id;

  perform public.log_admin_activity(admin_token, 'update', 'order', p_order_id::text, jsonb_build_object('status', p_status));
end;
$$;

-- 3c) Products: upsert + delete
create or replace function public.admin_upsert_product(
  admin_token text,
  p_name text,
  p_type text,
  p_price numeric,
  p_stock_quantity integer default 0,
  p_description text default null,
  p_image_url text default null,
  p_sensors text[] default '{}',
  p_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  result_id uuid;
begin
  if not public.is_valid_admin(admin_token) then
    raise exception 'Unauthorized: Invalid or expired admin session';
  end if;

  if p_id is null then
    insert into public.products (name, type, price, stock_quantity, description, image_url, sensors)
    values (p_name, p_type, p_price, coalesce(p_stock_quantity,0), p_description, p_image_url, coalesce(p_sensors,'{}'::text[]))
    returning id into result_id;

    perform public.log_admin_activity(admin_token, 'create', 'product', result_id::text, jsonb_build_object('name', p_name));
  else
    update public.products
    set
      name = p_name,
      type = p_type,
      price = p_price,
      stock_quantity = coalesce(p_stock_quantity,0),
      description = p_description,
      image_url = p_image_url,
      sensors = coalesce(p_sensors,'{}'::text[]),
      updated_at = now()
    where id = p_id;

    result_id := p_id;
    perform public.log_admin_activity(admin_token, 'update', 'product', p_id::text, jsonb_build_object('name', p_name));
  end if;

  return result_id;
end;
$$;

create or replace function public.admin_delete_product(admin_token text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_admin(admin_token) then
    raise exception 'Unauthorized: Invalid or expired admin session';
  end if;

  delete from public.products where id = p_id;

  perform public.log_admin_activity(admin_token, 'delete', 'product', p_id::text, null);
end;
$$;

-- 3d) Blogs: list, set status, delete (admin_upsert_blog already exists)
create or replace function public.admin_list_blogs(admin_token text, status_filter text default null)
returns table(
  id uuid,
  title text,
  content text,
  status text,
  author_id uuid,
  author_email text,
  created_at timestamptz,
  updated_at timestamptz,
  published_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_valid_admin(admin_token) then
    raise exception 'Unauthorized: Invalid or expired admin session';
  end if;

  return query
  select
    b.id, b.title, b.content, b.status, b.author_id,
    au.email as author_email,
    b.created_at, b.updated_at, b.published_at
  from public.blog_posts b
  left join auth.users au on au.id = b.author_id
  where status_filter is null or b.status = status_filter
  order by b.created_at desc;
end;
$$;

create or replace function public.admin_set_blog_status(admin_token text, blog_id uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_admin(admin_token) then
    raise exception 'Unauthorized: Invalid or expired admin session';
  end if;

  update public.blog_posts
  set status = new_status,
      published_at = case when new_status = 'published' then now() else published_at end,
      updated_at = now()
  where id = blog_id;

  perform public.log_admin_activity(admin_token, 'update', 'blog_post', blog_id::text, jsonb_build_object('status', new_status));
end;
$$;

create or replace function public.admin_delete_blog(admin_token text, blog_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_admin(admin_token) then
    raise exception 'Unauthorized: Invalid or expired admin session';
  end if;

  delete from public.blog_comments where post_id = blog_id;
  delete from public.blog_posts where id = blog_id;

  perform public.log_admin_activity(admin_token, 'delete', 'blog_post', blog_id::text, null);
end;
$$;

-- 3e) Webinars: list + delete (admin_upsert_webinar already exists)
create or replace function public.admin_list_webinars(admin_token text)
returns setof public.webinars
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_admin(admin_token) then
    raise exception 'Unauthorized: Invalid or expired admin session';
  end if;

  return query
  select * from public.webinars order by created_at desc;
end;
$$;

create or replace function public.admin_delete_webinar(admin_token text, webinar_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_admin(admin_token) then
    raise exception 'Unauthorized: Invalid or expired admin session';
  end if;

  delete from public.webinar_registrations where webinar_id = webinar_id;
  delete from public.webinars where id = webinar_id;

  perform public.log_admin_activity(admin_token, 'delete', 'webinar', webinar_id::text, null);
end;
$$;

-- 3f) Community: list, set status, delete
create or replace function public.admin_list_discussions(admin_token text, status_filter text default null)
returns table(
  id uuid,
  title text,
  content text,
  status text,
  author_id uuid,
  author_email text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_valid_admin(admin_token) then
    raise exception 'Unauthorized: Invalid or expired admin session';
  end if;

  return query
  select
    d.id, d.title, d.content, d.status,
    d.author_id, au.email as author_email,
    d.created_at, d.updated_at
  from public.community_discussions d
  left join auth.users au on au.id = d.author_id
  where status_filter is null or d.status = status_filter
  order by d.created_at desc;
end;
$$;

create or replace function public.admin_update_discussion_status(admin_token text, discussion_id uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_admin(admin_token) then
    raise exception 'Unauthorized: Invalid or expired admin session';
  end if;

  update public.community_discussions
  set status = new_status, updated_at = now()
  where id = discussion_id;

  perform public.log_admin_activity(admin_token, 'update', 'community_discussion', discussion_id::text, jsonb_build_object('status', new_status));
end;
$$;

create or replace function public.admin_delete_discussion(admin_token text, discussion_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_admin(admin_token) then
    raise exception 'Unauthorized: Invalid or expired admin session';
  end if;

  delete from public.discussion_replies where discussion_id = discussion_id;
  delete from public.community_discussions where id = discussion_id;

  perform public.log_admin_activity(admin_token, 'delete', 'community_discussion', discussion_id::text, null);
end;
$$;

-- 3g) Dashboard counts
create or replace function public.admin_get_dashboard_counts(admin_token text)
returns table(
  total_users bigint,
  total_orders bigint,
  total_revenue numeric,
  pending_blogs bigint,
  total_webinars bigint,
  active_discussions bigint
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_valid_admin(admin_token) then
    raise exception 'Unauthorized: Invalid or expired admin session';
  end if;

  return query
  select
    (select count(*) from auth.users) as total_users,
    (select count(*) from public.orders) as total_orders,
    coalesce((select sum(total_amount) from public.orders where status in ('confirmed','processing','shipped','delivered')), 0) as total_revenue,
    (select count(*) from public.blog_posts where status = 'pending') as pending_blogs,
    (select count(*) from public.webinars) as total_webinars,
    (select count(*) from public.community_discussions where status = 'active') as active_discussions;
end;
$$;

-- 4) Realtime: ensure replica identity + publication (safe if already set)
alter table if exists public.products set replica identity full;
alter table if exists public.orders set replica identity full;
alter table if exists public.order_items set replica identity full;
alter table if exists public.blog_posts set replica identity full;
alter table if exists public.webinars set replica identity full;
alter table if exists public.community_discussions set replica identity full;
alter table if exists public.user_roles set replica identity full;

-- Add to realtime publication (if not present)
do $$
begin
  begin execute 'alter publication supabase_realtime add table public.products'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.orders'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.order_items'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.blog_posts'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.webinars'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.community_discussions'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.user_roles'; exception when others then null; end;
end$$;
