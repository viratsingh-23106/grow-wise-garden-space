import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SensorPayload {
  device_id: string;
  user_id: string;
  sensor_type: 'temperature' | 'humidity' | 'soil_moisture' | 'ph' | 'npk' | 'light';
  value: number;
  location?: string;
  timestamp?: string;
}

interface BatchSensorPayload {
  device_id: string;
  user_id: string;
  location?: string;
  timestamp?: string;
  sensors: {
    temperature?: number;
    humidity?: number;
    soil_moisture?: number;
    ph?: number;
    npk?: number;
    light?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const body = await req.json();
    console.log('Received sensor data:', body);

    // Handle batch sensor data (multiple sensor types from one device)
    if (body.sensors && typeof body.sensors === 'object') {
      const batchPayload = body as BatchSensorPayload;
      
      // First, ensure user_sensors entry exists
      const { error: sensorError } = await supabaseClient
        .from('user_sensors')
        .upsert({
          user_id: batchPayload.user_id,
          device_id: batchPayload.device_id,
          sensor_name: `Device ${batchPayload.device_id}`,
          sensor_type: 'multi-sensor',
          location: batchPayload.location || 'Unknown',
          status: 'active',
          updated_at: new Date().toISOString()
        }, { onConflict: 'device_id,user_id' });

      if (sensorError) {
        console.error('Error upserting sensor:', sensorError);
      }

      // Get sensor ID for this device
      const { data: sensorData, error: getSensorError } = await supabaseClient
        .from('user_sensors')
        .select('id')
        .eq('device_id', batchPayload.device_id)
        .eq('user_id', batchPayload.user_id)
        .single();

      if (getSensorError || !sensorData) {
        throw new Error('Failed to get sensor ID');
      }

      const sensorId = sensorData.id;

      // Process each sensor type
      const sensorEntries = [];
      for (const [sensorType, value] of Object.entries(batchPayload.sensors)) {
        if (value !== undefined && value !== null) {
          const sensorData = {
            sensor_id: sensorId,
            user_id: batchPayload.user_id,
            [sensorType]: value,
            recorded_at: batchPayload.timestamp || new Date().toISOString()
          };
          sensorEntries.push(sensorData);

          // Check thresholds and create alerts
          await supabaseClient.rpc('check_sensor_thresholds', {
            p_user_id: batchPayload.user_id,
            p_sensor_id: sensorId,
            p_sensor_type: sensorType,
            p_value: value
          });
        }
      }

      // Insert sensor data
      const { error: insertError } = await supabaseClient
        .from('sensor_data')
        .insert(sensorEntries);

      if (insertError) {
        console.error('Error inserting batch sensor data:', insertError);
        throw insertError;
      }

      console.log(`Successfully processed batch data for ${sensorEntries.length} sensors`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Processed ${sensorEntries.length} sensor readings`,
          device_id: batchPayload.device_id
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle single sensor data
    else {
      const payload = body as SensorPayload;
      
      // Validate required fields
      if (!payload.device_id || !payload.user_id || !payload.sensor_type || payload.value === undefined) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing required fields: device_id, user_id, sensor_type, value' 
          }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Ensure user_sensors entry exists
      const { error: sensorError } = await supabaseClient
        .from('user_sensors')
        .upsert({
          user_id: payload.user_id,
          device_id: payload.device_id,
          sensor_name: `${payload.sensor_type} Sensor`,
          sensor_type: payload.sensor_type,
          location: payload.location || 'Unknown',
          status: 'active',
          updated_at: new Date().toISOString()
        }, { onConflict: 'device_id,user_id' });

      if (sensorError) {
        console.error('Error upserting sensor:', sensorError);
      }

      // Get sensor ID
      const { data: sensorData, error: getSensorError } = await supabaseClient
        .from('user_sensors')
        .select('id')
        .eq('device_id', payload.device_id)
        .eq('user_id', payload.user_id)
        .single();

      if (getSensorError || !sensorData) {
        throw new Error('Failed to get sensor ID');
      }

      // Insert sensor data
      const { error: insertError } = await supabaseClient
        .from('sensor_data')
        .insert({
          sensor_id: sensorData.id,
          user_id: payload.user_id,
          [payload.sensor_type]: payload.value,
          recorded_at: payload.timestamp || new Date().toISOString()
        });

      if (insertError) {
        console.error('Error inserting sensor data:', insertError);
        throw insertError;
      }

      // Check thresholds and create alerts
      await supabaseClient.rpc('check_sensor_thresholds', {
        p_user_id: payload.user_id,
        p_sensor_id: sensorData.id,
        p_sensor_type: payload.sensor_type,
        p_value: payload.value
      });

      console.log('Successfully processed sensor data:', payload);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Sensor data received and processed',
          device_id: payload.device_id,
          sensor_type: payload.sensor_type
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error processing sensor data:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process sensor data', 
        details: error.message 
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});