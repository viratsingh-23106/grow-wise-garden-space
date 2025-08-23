-- Fix the parameter defaults issue in admin_upsert_blog function
CREATE OR REPLACE FUNCTION public.admin_upsert_blog(
  admin_token text,
  blog_title text,
  blog_content text,
  blog_status text,
  blog_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_id uuid;
  admin_user_id uuid;
BEGIN
  -- Get the first admin user as author (temporary solution)
  SELECT ur.user_id INTO admin_user_id
  FROM public.user_roles ur 
  WHERE ur.role = 'admin'
  LIMIT 1;

  -- Verify admin session exists
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token
    AND expires_at > now()
  ) THEN
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

-- Fix the parameter defaults issue in admin_upsert_webinar function
CREATE OR REPLACE FUNCTION public.admin_upsert_webinar(
  admin_token text,
  webinar_title text,
  webinar_description text,
  webinar_host_name text,
  webinar_scheduled_date timestamptz,
  webinar_status text DEFAULT 'upcoming',
  webinar_duration_minutes integer DEFAULT 60,
  webinar_max_participants integer DEFAULT 100,
  webinar_zoom_link text DEFAULT NULL,
  webinar_recording_url text DEFAULT NULL,
  webinar_id uuid DEFAULT NULL
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