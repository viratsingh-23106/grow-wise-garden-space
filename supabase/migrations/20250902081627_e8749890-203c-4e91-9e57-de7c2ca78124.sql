
-- 1) Fix: admin_get_users – cast auth.users.email to text
CREATE OR REPLACE FUNCTION public.admin_get_users(admin_token text)
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  role text,
  subscribed boolean,
  subscription_tier text,
  subscription_end timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token 
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::text AS email,
    COALESCE(p.full_name, '')::text AS full_name,
    u.created_at,
    COALESCE((
      SELECT ur.role 
      FROM public.user_roles ur 
      WHERE ur.user_id = u.id
      ORDER BY CASE ur.role WHEN 'admin' THEN 1 WHEN 'moderator' THEN 2 ELSE 3 END
      LIMIT 1
    ), 'user')::text AS role,
    COALESCE(s.subscribed, false) AS subscribed,
    s.subscription_tier::text,
    s.subscription_end
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.subscribers s ON s.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$function$;

-- 2) Fix: admin_get_orders – cast auth.users.email to text
CREATE OR REPLACE FUNCTION public.admin_get_orders(admin_token text)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  user_email text,
  total_amount numeric,
  items_count integer,
  status text,
  shipping_address jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token 
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  RETURN QUERY
  SELECT 
    o.id,
    o.user_id,
    u.email::text AS user_email,
    o.total_amount,
    COALESCE(oi.cnt, 0)::int AS items_count,
    o.status::text,
    o.shipping_address,
    o.created_at
  FROM public.orders o
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS cnt FROM public.order_items oi WHERE oi.order_id = o.id
  ) oi ON TRUE
  LEFT JOIN auth.users u ON u.id = o.user_id
  ORDER BY o.created_at DESC;
END;
$function$;

-- 3) Fix: admin_list_blogs – cast auth.users.email to text
CREATE OR REPLACE FUNCTION public.admin_list_blogs(admin_token text)
RETURNS TABLE(
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token 
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  RETURN QUERY
  SELECT 
    b.id,
    b.title,
    b.content,
    b.status,
    b.author_id,
    u.email::text AS author_email,
    b.created_at,
    b.updated_at,
    b.published_at
  FROM public.blog_posts b
  LEFT JOIN auth.users u ON u.id = b.author_id
  ORDER BY b.created_at DESC;
END;
$function$;

-- 4) Fix: admin_list_discussions – cast auth.users.email to text
CREATE OR REPLACE FUNCTION public.admin_list_discussions(admin_token text)
RETURNS TABLE(
  id uuid,
  title text,
  content text,
  status text,
  author_id uuid,
  author_email text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token 
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.content,
    d.status,
    d.author_id,
    u.email::text AS author_email,
    d.created_at,
    d.updated_at
  FROM public.community_discussions d
  LEFT JOIN auth.users u ON u.id = d.author_id
  ORDER BY d.created_at DESC;
END;
$function$;
