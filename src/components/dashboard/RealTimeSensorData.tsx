import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Droplets, Gauge, Beaker, Sprout, Sun } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
  sensor: {
    sensor_name: string;
    location: string;
    status: string;
  };
}

const RealTimeSensorData = () => {
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [latestReadings, setLatestReadings] = useState<Record<string, SensorReading>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSensorData = async () => {
    if (!user) return;

    try {
      // Fetch latest readings for each sensor
      const { data, error } = await supabase
        .from('sensor_data')
        .select(`
          *,
          user_sensors!inner(
            id,
            sensor_name,
            location,
            status
          )
        `)
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const processedData = (data || []).map(item => ({
        ...item,
        sensor: item.user_sensors
      }));

      setSensorData(processedData);

      // Group by sensor_id to get latest reading for each sensor
      const latestBySensor = processedData.reduce((acc, reading) => {
        if (!acc[reading.sensor_id] || 
            new Date(reading.recorded_at) > new Date(acc[reading.sensor_id].recorded_at)) {
          acc[reading.sensor_id] = reading;
        }
        return acc;
      }, {} as Record<string, SensorReading>);

      setLatestReadings(latestBySensor);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensorData();

    // Set up real-time subscription for new sensor data
    const channel = supabase
      .channel('sensor-data-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_data',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchSensorData(); // Refetch data when new reading comes in
        }
      )
      .subscribe();

    // Refresh data every 5 minutes
    const interval = setInterval(fetchSensorData, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  const getSensorIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'temperature': return <Thermometer className="h-5 w-5" />;
      case 'humidity': return <Droplets className="h-5 w-5" />;
      case 'soil_moisture': return <Gauge className="h-5 w-5" />;
      case 'ph': case 'ph_level': return <Beaker className="h-5 w-5" />;
      case 'npk': case 'nutrients': return <Sprout className="h-5 w-5" />;
      case 'light': case 'light_level': return <Sun className="h-5 w-5" />;
      default: return <Gauge className="h-5 w-5" />;
    }
  };

  const getSensorValue = (reading: SensorReading, type: string) => {
    switch (type.toLowerCase()) {
      case 'temperature': return reading.temperature;
      case 'humidity': return reading.humidity;
      case 'soil_moisture': return reading.soil_moisture;
      case 'ph': case 'ph_level': return reading.ph_level;
      case 'npk': case 'nutrients': return reading.nutrients;
      case 'light': case 'light_level': return reading.light_level;
      default: return null;
    }
  };

  const getUnit = (type: string) => {
    switch (type.toLowerCase()) {
      case 'temperature': return '°C';
      case 'humidity': return '%';
      case 'soil_moisture': return '%';
      case 'ph': case 'ph_level': return 'pH';
      case 'npk': case 'nutrients': return 'ppm';
      case 'light': case 'light_level': return 'lux';
      default: return '';
    }
  };

  const getChartData = (sensorType: string) => {
    return sensorData
      .filter(reading => getSensorValue(reading, sensorType) !== null)
      .map(reading => ({
        time: new Date(reading.recorded_at).toLocaleTimeString(),
        value: getSensorValue(reading, sensorType),
        fullTime: reading.recorded_at
      }))
      .slice(-20)
      .reverse();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted rounded-lg h-48"></div>
        ))}
      </div>
    );
  }

  const sensorTypes = ['temperature', 'humidity', 'soil_moisture', 'ph_level', 'nutrients', 'light_level'];

  return (
    <div className="space-y-6">
      {/* Latest Readings Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {sensorTypes.map((sensorType) => {
          const latestReading = Object.values(latestReadings).find(reading => 
            getSensorValue(reading, sensorType) !== null
          );
          const value = latestReading ? getSensorValue(latestReading, sensorType) : null;
          
          return (
            <Card key={sensorType} className="text-center">
              <CardContent className="p-4">
                <div className="flex items-center justify-center mb-2">
                  {getSensorIcon(sensorType)}
                </div>
                <div className="text-2xl font-bold">
                  {value !== null ? value.toFixed(1) : '--'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {sensorType.replace('_', ' ').toUpperCase()} {getUnit(sensorType)}
                </div>
                <Badge 
                  variant={value !== null ? "default" : "secondary"} 
                  className="text-xs mt-1"
                >
                  {value !== null ? "Online" : "Offline"}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts for each sensor type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sensorTypes.map((sensorType) => {
          const chartData = getChartData(sensorType);
          
          if (chartData.length === 0) return null;

          return (
            <Card key={`chart-${sensorType}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  {getSensorIcon(sensorType)}
                  {sensorType.replace('_', ' ').toUpperCase()} Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(value, payload) => {
                        const data = payload?.[0]?.payload;
                        return data ? new Date(data.fullTime).toLocaleString() : value;
                      }}
                      formatter={(value: number) => [
                        `${value.toFixed(2)} ${getUnit(sensorType)}`, 
                        sensorType.replace('_', ' ').toUpperCase()
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Sensors List */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Sensors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.values(latestReadings).map((reading) => (
              <div key={reading.sensor_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <div className="font-medium">{reading.sensor.sensor_name}</div>
                  <div className="text-sm text-muted-foreground">{reading.sensor.location}</div>
                </div>
                <div className="text-right">
                  <Badge variant={reading.sensor.status === 'active' ? 'default' : 'secondary'}>
                    {reading.sensor.status}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    Last reading: {new Date(reading.recorded_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            
            {Object.keys(latestReadings).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No sensor data available. Connect your IoT devices to start monitoring.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeSensorData;