-- Fix RLS policy for order_items to allow insertion by users
CREATE POLICY "Users can insert order items for their own orders" 
ON public.order_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Allow users to create growth guides and guide steps
CREATE POLICY "Allow users to insert growth guides" 
ON public.growth_guides 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow users to insert guide steps" 
ON public.guide_steps 
FOR INSERT 
WITH CHECK (true);

-- Allow users to update/delete growth guides and guide steps
CREATE POLICY "Allow users to update growth guides" 
ON public.growth_guides 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow users to delete growth guides" 
ON public.growth_guides 
FOR DELETE 
USING (true);

CREATE POLICY "Allow users to update guide steps" 
ON public.guide_steps 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow users to delete guide steps" 
ON public.guide_steps 
FOR DELETE 
USING (true);