
-- Create admin sessions table to track secret code access
CREATE TABLE public.admin_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  last_activity timestamp with time zone NOT NULL DEFAULT now()
);

-- Create admin activity logs table
CREATE TABLE public.admin_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_admin_sessions_token ON public.admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_expires ON public.admin_sessions(expires_at);
CREATE INDEX idx_admin_activity_logs_session ON public.admin_activity_logs(session_token);
CREATE INDEX idx_admin_activity_logs_created ON public.admin_activity_logs(created_at);

-- Enable RLS on admin tables
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for these admin-only tables)
CREATE POLICY "Admin sessions are public" ON public.admin_sessions FOR ALL USING (true);
CREATE POLICY "Admin activity logs are public" ON public.admin_activity_logs FOR ALL USING (true);

-- Function to validate admin secret and create session
CREATE OR REPLACE FUNCTION public.validate_admin_secret(secret_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_secret text;
  session_token text;
BEGIN
  -- This will be replaced with actual secret from environment
  stored_secret := 'ADMIN_SECRET_123';
  
  IF secret_input = stored_secret THEN
    -- Generate session token
    session_token := encode(gen_random_bytes(32), 'hex');
    
    -- Insert session
    INSERT INTO public.admin_sessions (session_token)
    VALUES (session_token);
    
    -- Return success with token
    RETURN jsonb_build_object(
      'success', true,
      'session_token', session_token
    );
  ELSE
    -- Return failure
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid admin secret'
    );
  END IF;
END;
$$;

-- Function to validate session token
CREATE OR REPLACE FUNCTION public.validate_admin_session(token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if session exists and is not expired
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_sessions 
    WHERE session_token = token 
    AND expires_at > now()
  );
END;
$$;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION public.log_admin_activity(
  token text,
  action_name text,
  entity_type_name text,
  entity_id_val text DEFAULT NULL,
  details_json jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update session last activity
  UPDATE public.admin_sessions 
  SET last_activity = now() 
  WHERE session_token = token;
  
  -- Log the activity
  INSERT INTO public.admin_activity_logs (
    session_token,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    token,
    action_name,
    entity_type_name,
    entity_id_val,
    details_json
  );
END;
$$;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.admin_sessions WHERE expires_at < now();
  DELETE FROM public.admin_activity_logs WHERE created_at < (now() - interval '30 days');
END;
$$;
