-- Replace admin_delete_product to cascade delete related data
CREATE OR REPLACE FUNCTION public.admin_delete_product(admin_token text, p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify admin session
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = admin_token 
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid or expired admin session';
  END IF;

  -- Delete dependent data safely (no-op if none exist)
  -- Delete guide-related data
  DELETE FROM public.user_progress
  WHERE guide_id IN (
    SELECT id FROM public.growth_guides WHERE product_id = p_id
  );

  DELETE FROM public.guide_steps
  WHERE guide_id IN (
    SELECT id FROM public.growth_guides WHERE product_id = p_id
  );

  DELETE FROM public.growth_guides
  WHERE product_id = p_id;

  -- Delete order items referencing this product (if FK exists)
  DELETE FROM public.order_items WHERE product_id = p_id;

  -- Delete reviews referencing this product
  DELETE FROM public.product_reviews WHERE product_id = p_id;

  -- Finally delete the product
  DELETE FROM public.products WHERE id = p_id;

  -- Log activity
  PERFORM public.log_admin_activity(admin_token, 'delete', 'product', p_id::text, NULL);
END;
$function$;