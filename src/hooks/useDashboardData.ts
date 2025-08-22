import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SensorReading {
  id: string;
  sensor_id: string;
  temperature?: number;
  humidity?: number;
  soil_moisture?: number;
  ph_level?: number;
  nutrients?: number;
  light_level?: number;
  recorded_at: string;
  user_sensors: {
    id: string;
    sensor_name: string;
    location: string;
    status: string;
    sensor_type: string;
  };
}

interface SensorAlert {
  id: string;
  sensor_type: string;
  message: string;
  alert_type: string;
  created_at: string;
  is_resolved: boolean;
}

interface UserSensor {
  id: string;
  sensor_name: string;
  location: string;
  status: string;
  sensor_type: string;
  device_id?: string;
}

interface SensorThreshold {
  sensor_type: string;
  min_threshold?: number;
  max_threshold?: number;
  critical_min?: number;
  critical_max?: number;
}

interface DashboardMetric {
  name: string;
  value: string;
  range: string;
  status: 'optimal' | 'warning' | 'critical' | 'offline';
  trend: 'up' | 'down' | 'stable';
  icon: any;
}

export const useDashboardData = (selectedDevice: string, timeRange: string) => {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [devices, setDevices] = useState<UserSensor[]>([]);
  const [alerts, setAlerts] = useState<SensorAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const getTimeRangeFilter = (range: string) => {
    const now = new Date();
    switch (range) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const calculateStatus = (value: number, sensorType: string, thresholds: SensorThreshold[]): 'optimal' | 'warning' | 'critical' => {
    const threshold = thresholds.find(t => t.sensor_type === sensorType);
    if (!threshold) return 'optimal';

    // Check critical thresholds first
    if (threshold.critical_min !== null && value < threshold.critical_min) return 'critical';
    if (threshold.critical_max !== null && value > threshold.critical_max) return 'critical';

    // Check warning thresholds
    if (threshold.min_threshold !== null && value < threshold.min_threshold) return 'warning';
    if (threshold.max_threshold !== null && value > threshold.max_threshold) return 'warning';

    return 'optimal';
  };

  const calculateTrend = (readings: SensorReading[], sensorType: string): 'up' | 'down' | 'stable' => {
    const values = readings
      .filter(r => getSensorValue(r, sensorType) !== null)
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      .map(r => getSensorValue(r, sensorType)!)
      .slice(-10); // Last 10 readings

    if (values.length < 2) return 'stable';

    const recent = values.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, values.length);
    const earlier = values.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, values.length - 3);

    const change = ((recent - earlier) / earlier) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  };

  const getSensorValue = (reading: SensorReading, type: string): number | null => {
    switch (type.toLowerCase()) {
      case 'temperature': return reading.temperature ?? null;
      case 'humidity': return reading.humidity ?? null;
      case 'soil_moisture': return reading.soil_moisture ?? null;
      case 'light_level': return reading.light_level ?? null;
      default: return null;
    }
  };

  const getOptimalRange = (sensorType: string): string => {
    switch (sensorType.toLowerCase()) {
      case 'temperature': return '18-28°C';
      case 'humidity': return '60-80%';
      case 'soil_moisture': return '40-60%';
      case 'light_level': return '70-100%';
      default: return 'N/A';
    }
  };

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const timeFilter = getTimeRangeFilter(timeRange);

      // Fetch sensor data
      let sensorQuery = supabase
        .from('sensor_data')
        .select(`
          *,
          user_sensors!inner(
            id,
            sensor_name,
            location,
            status,
            sensor_type
          )
        `)
        .eq('user_id', user.id)
        .gte('recorded_at', timeFilter)
        .order('recorded_at', { ascending: false });

      if (selectedDevice !== 'all') {
        sensorQuery = sensorQuery.eq('sensor_id', selectedDevice);
      }

      const { data: sensorData, error: sensorError } = await sensorQuery;
      if (sensorError) throw sensorError;

      // Fetch user sensors
      const { data: userSensors, error: sensorsError } = await supabase
        .from('user_sensors')
        .select('*')
        .eq('user_id', user.id);
      
      if (sensorsError) throw sensorsError;

      // Fetch sensor thresholds
      const { data: thresholds, error: thresholdsError } = await supabase
        .from('sensor_thresholds')
        .select('*')
        .eq('user_id', user.id);
      
      if (thresholdsError) throw thresholdsError;

      // Fetch recent alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('sensor_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (alertsError) throw alertsError;

      // Process sensor data into metrics
      const sensorTypes = ['temperature', 'humidity', 'soil_moisture', 'light_level'];
      const processedMetrics: DashboardMetric[] = [];

      sensorTypes.forEach(sensorType => {
        const readings = (sensorData || []).filter(r => getSensorValue(r, sensorType) !== null);
        
        if (readings.length === 0) {
          processedMetrics.push({
            name: sensorType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: '--',
            range: getOptimalRange(sensorType),
            status: 'offline',
            trend: 'stable',
            icon: getSensorIcon(sensorType)
          });
          return;
        }

        // Get latest reading
        const latestReading = readings[0];
        const value = getSensorValue(latestReading, sensorType)!;
        
        // Calculate status
        const status = calculateStatus(value, sensorType, thresholds || []);
        
        // Calculate trend
        const trend = calculateTrend(readings, sensorType);

        // Format value
        const unit = getUnit(sensorType);
        const formattedValue = `${value.toFixed(1)}${unit}`;

        processedMetrics.push({
          name: sensorType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: formattedValue,
          range: getOptimalRange(sensorType),
          status,
          trend,
          icon: getSensorIcon(sensorType)
        });
      });

      setMetrics(processedMetrics);
      setDevices([
        { id: 'all', sensor_name: 'All Devices', location: '', status: 'active', sensor_type: '' },
        ...(userSensors || [])
      ]);
      setAlerts(alertsData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time subscriptions
    const sensorDataChannel = supabase
      .channel('dashboard-sensor-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_data',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    const alertsChannel = supabase
      .channel('dashboard-alerts-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sensor_alerts',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sensorDataChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, [user, selectedDevice, timeRange]);

  return { metrics, devices, alerts, loading };
};

// Helper functions
const getSensorIcon = (type: string) => {
  // Import icons dynamically or return icon names
  // These will be resolved in the component that uses this hook
  return type; // Return the type name, icon will be resolved in component
};

const getUnit = (type: string) => {
  switch (type.toLowerCase()) {
    case 'temperature': return '°C';
    case 'humidity': return '%';
    case 'soil_moisture': return '%';
    case 'light_level': return '%';
    default: return '';
  }
};