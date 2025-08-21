-- Add unique constraint to prevent duplicate user_sensors entries
ALTER TABLE public.user_sensors 
ADD CONSTRAINT user_sensors_device_user_unique 
UNIQUE (device_id, user_id);