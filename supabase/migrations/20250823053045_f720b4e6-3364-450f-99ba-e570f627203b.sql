-- Create SECURITY DEFINER functions for admin operations

-- Admin function to get all users with their details
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  subscription jsonb,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin session exists and is valid
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = current_setting('request.jwt.claims', true)::jsonb->>'admin_token'
    AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    p.full_name,
    u.created_at,
    row_to_json(s)::jsonb as subscription,
    COALESCE(ur.role, 'user'::text) as role
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  LEFT JOIN public.subscribers s ON u.id = s.user_id
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  ORDER BY u.created_at DESC;
END;
$$;

-- Admin function to get all orders with user details
CREATE OR REPLACE FUNCTION public.admin_get_all_orders()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_email text,
  total_amount numeric,
  status text,
  shipping_address jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  items_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin session
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = current_setting('request.jwt.claims', true)::jsonb->>'admin_token'
    AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  RETURN QUERY
  SELECT 
    o.id,
    o.user_id,
    u.email::text as user_email,
    o.total_amount,
    o.status,
    o.shipping_address,
    o.created_at,
    o.updated_at,
    COUNT(oi.id) as items_count
  FROM public.orders o
  LEFT JOIN auth.users u ON o.user_id = u.id
  LEFT JOIN public.order_items oi ON o.id = oi.order_id
  GROUP BY o.id, u.email
  ORDER BY o.created_at DESC;
END;
$$;

-- Admin function to update order status
CREATE OR REPLACE FUNCTION public.admin_update_order_status(
  order_id uuid,
  new_status text,
  admin_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin session
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token
    AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  -- Update order status
  UPDATE public.orders 
  SET status = new_status, updated_at = now()
  WHERE id = order_id;

  -- Log admin activity
  PERFORM public.log_admin_activity(
    admin_token, 
    'update', 
    'order', 
    order_id::text, 
    jsonb_build_object('new_status', new_status)
  );
END;
$$;

-- Admin function to get all blogs with author details
CREATE OR REPLACE FUNCTION public.admin_get_all_blogs()
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  status text,
  author_id uuid,
  author_email text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin session
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = current_setting('request.jwt.claims', true)::jsonb->>'admin_token'
    AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  RETURN QUERY
  SELECT 
    bp.id,
    bp.title,
    bp.content,
    bp.status,
    bp.author_id,
    u.email::text as author_email,
    bp.created_at
  FROM public.blog_posts bp
  LEFT JOIN auth.users u ON bp.author_id = u.id
  ORDER BY bp.created_at DESC;
END;
$$;

-- Admin function to update blog status
CREATE OR REPLACE FUNCTION public.admin_update_blog_status(
  blog_id uuid,
  new_status text,
  admin_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin session
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token
    AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  -- Update blog status
  UPDATE public.blog_posts 
  SET status = new_status, updated_at = now()
  WHERE id = blog_id;

  -- If approving, set published_at
  IF new_status = 'published' THEN
    UPDATE public.blog_posts 
    SET published_at = now()
    WHERE id = blog_id;
  END IF;

  -- Log admin activity
  PERFORM public.log_admin_activity(
    admin_token, 
    'update', 
    'blog_post', 
    blog_id::text, 
    jsonb_build_object('new_status', new_status)
  );
END;
$$;

-- Admin function to create/update blog
CREATE OR REPLACE FUNCTION public.admin_upsert_blog(
  blog_id uuid DEFAULT NULL,
  blog_title text,
  blog_content text,
  blog_status text,
  admin_token text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_id uuid;
  admin_user_id uuid;
BEGIN
  -- Verify admin session and get admin user ID
  SELECT au.id INTO admin_user_id
  FROM public.admin_sessions ads
  JOIN auth.users au ON true  -- We'll use the session token to identify admin
  WHERE ads.session_token = admin_token
  AND ads.expires_at > now()
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  IF blog_id IS NULL THEN
    -- Create new blog
    INSERT INTO public.blog_posts (title, content, status, author_id)
    VALUES (blog_title, blog_content, blog_status, admin_user_id)
    RETURNING id INTO result_id;
    
    -- Log admin activity
    PERFORM public.log_admin_activity(
      admin_token, 
      'create', 
      'blog_post', 
      result_id::text, 
      jsonb_build_object('title', blog_title, 'status', blog_status)
    );
  ELSE
    -- Update existing blog
    UPDATE public.blog_posts 
    SET title = blog_title, content = blog_content, status = blog_status, updated_at = now()
    WHERE id = blog_id;
    
    result_id := blog_id;
    
    -- Log admin activity
    PERFORM public.log_admin_activity(
      admin_token, 
      'update', 
      'blog_post', 
      blog_id::text, 
      jsonb_build_object('title', blog_title, 'status', blog_status)
    );
  END IF;

  RETURN result_id;
END;
$$;

-- Admin function to delete blog
CREATE OR REPLACE FUNCTION public.admin_delete_blog(
  blog_id uuid,
  admin_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin session
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token
    AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  -- Delete blog comments first
  DELETE FROM public.blog_comments WHERE post_id = blog_id;
  
  -- Delete blog
  DELETE FROM public.blog_posts WHERE id = blog_id;

  -- Log admin activity
  PERFORM public.log_admin_activity(
    admin_token, 
    'delete', 
    'blog_post', 
    blog_id::text, 
    NULL
  );
END;
$$;

-- Admin function to get all webinars
CREATE OR REPLACE FUNCTION public.admin_get_all_webinars()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  host_name text,
  scheduled_date timestamptz,
  duration_minutes integer,
  max_participants integer,
  status text,
  zoom_meeting_link text,
  recording_url text,
  created_at timestamptz,
  registrations_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin session
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = current_setting('request.jwt.claims', true)::jsonb->>'admin_token'
    AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  RETURN QUERY
  SELECT 
    w.id,
    w.title,
    w.description,
    w.host_name,
    w.scheduled_date,
    w.duration_minutes,
    w.max_participants,
    w.status,
    w.zoom_meeting_link,
    w.recording_url,
    w.created_at,
    COUNT(wr.id) as registrations_count
  FROM public.webinars w
  LEFT JOIN public.webinar_registrations wr ON w.id = wr.webinar_id
  GROUP BY w.id
  ORDER BY w.scheduled_date DESC;
END;
$$;

-- Admin function to create/update webinar
CREATE OR REPLACE FUNCTION public.admin_upsert_webinar(
  webinar_id uuid DEFAULT NULL,
  webinar_title text,
  webinar_description text,
  webinar_host_name text,
  webinar_scheduled_date timestamptz,
  webinar_duration_minutes integer DEFAULT 60,
  webinar_max_participants integer DEFAULT 100,
  webinar_status text DEFAULT 'upcoming',
  webinar_zoom_link text DEFAULT NULL,
  webinar_recording_url text DEFAULT NULL,
  admin_token text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_id uuid;
BEGIN
  -- Verify admin session
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token
    AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  IF webinar_id IS NULL THEN
    -- Create new webinar
    INSERT INTO public.webinars (
      title, description, host_name, scheduled_date, 
      duration_minutes, max_participants, status, 
      zoom_meeting_link, recording_url
    )
    VALUES (
      webinar_title, webinar_description, webinar_host_name, webinar_scheduled_date,
      webinar_duration_minutes, webinar_max_participants, webinar_status,
      webinar_zoom_link, webinar_recording_url
    )
    RETURNING id INTO result_id;
    
    -- Log admin activity
    PERFORM public.log_admin_activity(
      admin_token, 
      'create', 
      'webinar', 
      result_id::text, 
      jsonb_build_object('title', webinar_title, 'scheduled_date', webinar_scheduled_date)
    );
  ELSE
    -- Update existing webinar
    UPDATE public.webinars 
    SET 
      title = webinar_title,
      description = webinar_description,
      host_name = webinar_host_name,
      scheduled_date = webinar_scheduled_date,
      duration_minutes = webinar_duration_minutes,
      max_participants = webinar_max_participants,
      status = webinar_status,
      zoom_meeting_link = webinar_zoom_link,
      recording_url = webinar_recording_url,
      updated_at = now()
    WHERE id = webinar_id;
    
    result_id := webinar_id;
    
    -- Log admin activity
    PERFORM public.log_admin_activity(
      admin_token, 
      'update', 
      'webinar', 
      webinar_id::text, 
      jsonb_build_object('title', webinar_title, 'scheduled_date', webinar_scheduled_date)
    );
  END IF;

  RETURN result_id;
END;
$$;

-- Admin function to delete webinar
CREATE OR REPLACE FUNCTION public.admin_delete_webinar(
  webinar_id uuid,
  admin_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin session
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token
    AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  -- Delete webinar registrations first
  DELETE FROM public.webinar_registrations WHERE webinar_id = webinar_id;
  
  -- Delete webinar
  DELETE FROM public.webinars WHERE id = webinar_id;

  -- Log admin activity
  PERFORM public.log_admin_activity(
    admin_token, 
    'delete', 
    'webinar', 
    webinar_id::text, 
    NULL
  );
END;
$$;

-- Admin function to get all community discussions
CREATE OR REPLACE FUNCTION public.admin_get_all_discussions()
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  status text,
  author_id uuid,
  author_email text,
  created_at timestamptz,
  replies_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin session
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = current_setting('request.jwt.claims', true)::jsonb->>'admin_token'
    AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  RETURN QUERY
  SELECT 
    cd.id,
    cd.title,
    cd.content,
    cd.status,
    cd.author_id,
    u.email::text as author_email,
    cd.created_at,
    COUNT(dr.id) as replies_count
  FROM public.community_discussions cd
  LEFT JOIN auth.users u ON cd.author_id = u.id
  LEFT JOIN public.discussion_replies dr ON cd.id = dr.discussion_id
  GROUP BY cd.id, u.email
  ORDER BY cd.created_at DESC;
END;
$$;

-- Admin function to update discussion status
CREATE OR REPLACE FUNCTION public.admin_update_discussion_status(
  discussion_id uuid,
  new_status text,
  admin_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin session
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token
    AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  -- Update discussion status
  UPDATE public.community_discussions 
  SET status = new_status, updated_at = now()
  WHERE id = discussion_id;

  -- Log admin activity
  PERFORM public.log_admin_activity(
    admin_token, 
    'update', 
    'discussion', 
    discussion_id::text, 
    jsonb_build_object('new_status', new_status)
  );
END;
$$;

-- Admin function to promote user to admin
CREATE OR REPLACE FUNCTION public.admin_make_user_admin(
  target_user_id uuid,
  admin_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin session
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token
    AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  -- Insert admin role if it doesn't exist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Log admin activity
  PERFORM public.log_admin_activity(
    admin_token, 
    'promote', 
    'user', 
    target_user_id::text, 
    jsonb_build_object('new_role', 'admin')
  );
END;
$$;