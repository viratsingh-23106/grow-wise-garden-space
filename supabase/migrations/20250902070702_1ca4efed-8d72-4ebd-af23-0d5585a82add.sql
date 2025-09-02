-- Admin Panel RPCs to support useAdminData.ts
-- All functions validate the admin session token and run as SECURITY DEFINER

-- 1) Get all users with role and subscription info
CREATE OR REPLACE FUNCTION public.admin_get_users(admin_token text)
RETURNS TABLE (
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
SET search_path = public
AS $$
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
    u.email,
    COALESCE(p.full_name, '') AS full_name,
    u.created_at,
    COALESCE(
      (
        SELECT ur.role 
        FROM public.user_roles ur 
        WHERE ur.user_id = u.id
        ORDER BY CASE ur.role WHEN 'admin' THEN 1 WHEN 'moderator' THEN 2 ELSE 3 END
        LIMIT 1
      ), 'user'
    ) AS role,
    COALESCE(s.subscribed, false) AS subscribed,
    s.subscription_tier,
    s.subscription_end
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.subscribers s ON s.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

-- 2) Get all orders with user email and items count
CREATE OR REPLACE FUNCTION public.admin_get_orders(admin_token text)
RETURNS TABLE (
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
SET search_path = public
AS $$
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
    u.email AS user_email,
    o.total_amount,
    COALESCE(oi.cnt, 0) AS items_count,
    o.status,
    o.shipping_address,
    o.created_at
  FROM public.orders o
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS cnt FROM public.order_items oi WHERE oi.order_id = o.id
  ) oi ON TRUE
  LEFT JOIN auth.users u ON u.id = o.user_id
  ORDER BY o.created_at DESC;
END;
$$;

-- 3) Upsert product
CREATE OR REPLACE FUNCTION public.admin_upsert_product(
  admin_token text,
  p_name text,
  p_type text,
  p_price numeric,
  p_stock_quantity integer DEFAULT 0,
  p_description text DEFAULT NULL,
  p_image_url text DEFAULT NULL,
  p_sensors text[] DEFAULT ARRAY[]::text[],
  p_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token 
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.products (name, type, price, stock_quantity, description, image_url, sensors)
    VALUES (p_name, p_type, p_price, COALESCE(p_stock_quantity, 0), p_description, p_image_url, COALESCE(p_sensors, ARRAY[]::text[]))
    RETURNING id INTO result_id;

    PERFORM public.log_admin_activity(admin_token, 'create', 'product', result_id::text,
      jsonb_build_object('name', p_name, 'price', p_price));
  ELSE
    UPDATE public.products
    SET name = p_name,
        type = p_type,
        price = p_price,
        stock_quantity = COALESCE(p_stock_quantity, 0),
        description = p_description,
        image_url = p_image_url,
        sensors = COALESCE(p_sensors, ARRAY[]::text[]),
        updated_at = now()
    WHERE id = p_id;

    result_id := p_id;

    PERFORM public.log_admin_activity(admin_token, 'update', 'product', p_id::text,
      jsonb_build_object('name', p_name, 'price', p_price));
  END IF;

  RETURN result_id;
END;
$$;

-- 4) Delete product
CREATE OR REPLACE FUNCTION public.admin_delete_product(admin_token text, p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token 
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  DELETE FROM public.products WHERE id = p_id;

  PERFORM public.log_admin_activity(admin_token, 'delete', 'product', p_id::text, NULL);
END;
$$;

-- 5) List blogs for admin
CREATE OR REPLACE FUNCTION public.admin_list_blogs(admin_token text)
RETURNS TABLE (
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
SET search_path = public
AS $$
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
    u.email AS author_email,
    b.created_at,
    b.updated_at,
    b.published_at
  FROM public.blog_posts b
  LEFT JOIN auth.users u ON u.id = b.author_id
  ORDER BY b.created_at DESC;
END;
$$;

-- 6) Set blog status (and published_at handling)
CREATE OR REPLACE FUNCTION public.admin_set_blog_status(admin_token text, blog_id uuid, new_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token 
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  UPDATE public.blog_posts
  SET status = new_status,
      published_at = CASE WHEN new_status = 'published' THEN now() ELSE published_at END,
      updated_at = now()
  WHERE id = blog_id;

  PERFORM public.log_admin_activity(admin_token, 'update_status', 'blog_post', blog_id::text, jsonb_build_object('status', new_status));
END;
$$;

-- 7) Delete blog
CREATE OR REPLACE FUNCTION public.admin_delete_blog(admin_token text, blog_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token 
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  DELETE FROM public.blog_posts WHERE id = blog_id;

  PERFORM public.log_admin_activity(admin_token, 'delete', 'blog_post', blog_id::text, NULL);
END;
$$;

-- 8) List webinars for admin
CREATE OR REPLACE FUNCTION public.admin_list_webinars(admin_token text)
RETURNS SETOF public.webinars
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token 
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  RETURN QUERY SELECT * FROM public.webinars ORDER BY created_at DESC;
END;
$$;

-- 9) Delete webinar
CREATE OR REPLACE FUNCTION public.admin_delete_webinar(admin_token text, webinar_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token 
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  DELETE FROM public.webinars WHERE id = webinar_id;
  PERFORM public.log_admin_activity(admin_token, 'delete', 'webinar', webinar_id::text, NULL);
END;
$$;

-- 10) Update order status
CREATE OR REPLACE FUNCTION public.admin_update_order_status(admin_token text, p_order_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token 
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  UPDATE public.orders
  SET status = p_status,
      updated_at = now()
  WHERE id = p_order_id;

  PERFORM public.log_admin_activity(admin_token, 'update_status', 'order', p_order_id::text, jsonb_build_object('status', p_status));
END;
$$;

-- 11) List discussions for admin
CREATE OR REPLACE FUNCTION public.admin_list_discussions(admin_token text)
RETURNS TABLE (
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
SET search_path = public
AS $$
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
    u.email AS author_email,
    d.created_at,
    d.updated_at
  FROM public.community_discussions d
  LEFT JOIN auth.users u ON u.id = d.author_id
  ORDER BY d.created_at DESC;
END;
$$;

-- 12) Update discussion status
CREATE OR REPLACE FUNCTION public.admin_update_discussion_status(admin_token text, discussion_id uuid, new_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token 
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  UPDATE public.community_discussions
  SET status = new_status,
      updated_at = now()
  WHERE id = discussion_id;

  PERFORM public.log_admin_activity(admin_token, 'update_status', 'community_discussion', discussion_id::text, jsonb_build_object('status', new_status));
END;
$$;

-- 13) Delete discussion
CREATE OR REPLACE FUNCTION public.admin_delete_discussion(admin_token text, discussion_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token 
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  DELETE FROM public.community_discussions WHERE id = discussion_id;

  PERFORM public.log_admin_activity(admin_token, 'delete', 'community_discussion', discussion_id::text, NULL);
END;
$$;

-- 14) Make user admin (idempotent)
CREATE OR REPLACE FUNCTION public.admin_make_user_admin(admin_token text, target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token 
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin'
  ) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'admin');
  END IF;

  PERFORM public.log_admin_activity(admin_token, 'grant_role', 'user', target_user_id::text, jsonb_build_object('role', 'admin'));
END;
$$;

-- 15) Dashboard counts
CREATE OR REPLACE FUNCTION public.admin_get_dashboard_counts(admin_token text)
RETURNS TABLE (
  total_users bigint,
  total_orders bigint,
  total_revenue numeric,
  pending_blogs bigint,
  total_webinars bigint,
  active_discussions bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    (SELECT COUNT(*) FROM auth.users) AS total_users,
    (SELECT COUNT(*) FROM public.orders) AS total_orders,
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders) AS total_revenue,
    (SELECT COUNT(*) FROM public.blog_posts WHERE status = 'pending') AS pending_blogs,
    (SELECT COUNT(*) FROM public.webinars) AS total_webinars,
    (SELECT COUNT(*) FROM public.community_discussions WHERE status = 'active') AS active_discussions;
END;
$$;