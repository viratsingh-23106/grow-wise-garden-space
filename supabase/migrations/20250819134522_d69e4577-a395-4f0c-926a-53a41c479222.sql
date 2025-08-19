-- Create sensor alerts table
CREATE TABLE public.sensor_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sensor_id UUID NOT NULL,
  alert_type TEXT NOT NULL, -- 'critical', 'warning', 'info'
  sensor_type TEXT NOT NULL, -- 'temperature', 'humidity', 'soil_moisture', 'ph', 'npk', 'light'
  current_value NUMERIC NOT NULL,
  threshold_value NUMERIC NOT NULL,
  message TEXT NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create sensor thresholds table
CREATE TABLE public.sensor_thresholds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sensor_id UUID NOT NULL,
  sensor_type TEXT NOT NULL,
  min_threshold NUMERIC,
  max_threshold NUMERIC,
  critical_min NUMERIC,
  critical_max NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sensor_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_thresholds ENABLE ROW LEVEL SECURITY;

-- Create policies for sensor_alerts
CREATE POLICY "Users can view their own alerts"
ON public.sensor_alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create alerts"
ON public.sensor_alerts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own alerts"
ON public.sensor_alerts FOR UPDATE
USING (auth.uid() = user_id);

-- Create policies for sensor_thresholds
CREATE POLICY "Users can manage their own thresholds"
ON public.sensor_thresholds FOR ALL
USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX idx_sensor_alerts_user_id ON public.sensor_alerts(user_id);
CREATE INDEX idx_sensor_alerts_sensor_id ON public.sensor_alerts(sensor_id);
CREATE INDEX idx_sensor_alerts_created_at ON public.sensor_alerts(created_at);
CREATE INDEX idx_sensor_thresholds_user_sensor ON public.sensor_thresholds(user_id, sensor_id);

-- Create function to check sensor thresholds
CREATE OR REPLACE FUNCTION public.check_sensor_thresholds(
  p_user_id UUID,
  p_sensor_id UUID,
  p_sensor_type TEXT,
  p_value NUMERIC
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  threshold_record RECORD;
  alert_type TEXT;
  message TEXT;
BEGIN
  -- Get threshold settings for this sensor
  SELECT * INTO threshold_record
  FROM public.sensor_thresholds
  WHERE user_id = p_user_id AND sensor_id = p_sensor_id AND sensor_type = p_sensor_type;
  
  IF threshold_record IS NULL THEN
    RETURN; -- No thresholds set
  END IF;
  
  -- Check for critical thresholds
  IF (threshold_record.critical_min IS NOT NULL AND p_value < threshold_record.critical_min) OR
     (threshold_record.critical_max IS NOT NULL AND p_value > threshold_record.critical_max) THEN
    alert_type := 'critical';
    message := format('Critical %s level: %s (Normal range: %s - %s)', 
                     p_sensor_type, p_value, threshold_record.critical_min, threshold_record.critical_max);
  
  -- Check for warning thresholds
  ELSIF (threshold_record.min_threshold IS NOT NULL AND p_value < threshold_record.min_threshold) OR
        (threshold_record.max_threshold IS NOT NULL AND p_value > threshold_record.max_threshold) THEN
    alert_type := 'warning';
    message := format('Warning %s level: %s (Recommended range: %s - %s)', 
                     p_sensor_type, p_value, threshold_record.min_threshold, threshold_record.max_threshold);
  ELSE
    RETURN; -- Value is within acceptable range
  END IF;
  
  -- Insert alert if one doesn't already exist for this sensor and type
  INSERT INTO public.sensor_alerts (
    user_id, sensor_id, alert_type, sensor_type, current_value, threshold_value, message
  )
  SELECT p_user_id, p_sensor_id, alert_type, p_sensor_type, p_value, 
         COALESCE(threshold_record.critical_min, threshold_record.critical_max, 
                 threshold_record.min_threshold, threshold_record.max_threshold), 
         message
  WHERE NOT EXISTS (
    SELECT 1 FROM public.sensor_alerts
    WHERE user_id = p_user_id 
    AND sensor_id = p_sensor_id 
    AND sensor_type = p_sensor_type
    AND is_resolved = false
    AND alert_type = check_sensor_thresholds.alert_type
  );
END;
$$;