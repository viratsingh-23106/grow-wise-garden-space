import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserSensor {
  id: string;
  sensor_name: string;
  sensor_type: string;
  device_id: string;
  location: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SensorThreshold {
  id: string;
  sensor_id: string;
  sensor_type: string;
  min_threshold: number | null;
  max_threshold: number | null;
  critical_min: number | null;
  critical_max: number | null;
}

const SensorManagement = () => {
  const [sensors, setSensors] = useState<UserSensor[]>([]);
  const [thresholds, setThresholds] = useState<SensorThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [thresholdDialogOpen, setThresholdDialogOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<UserSensor | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const [newSensor, setNewSensor] = useState({
    sensor_name: '',
    sensor_type: 'temperature',
    device_id: '',
    location: ''
  });

  const [currentThreshold, setCurrentThreshold] = useState({
    sensor_type: 'temperature',
    min_threshold: '',
    max_threshold: '',
    critical_min: '',
    critical_max: ''
  });

  const sensorTypes = [
    { value: 'temperature', label: 'Temperature', unit: '°C' },
    { value: 'humidity', label: 'Humidity', unit: '%' },
    { value: 'soil_moisture', label: 'Soil Moisture', unit: '%' },
    { value: 'ph', label: 'pH Level', unit: 'pH' },
    { value: 'npk', label: 'NPK (Nutrients)', unit: 'ppm' },
    { value: 'light', label: 'Light Level', unit: 'lux' },
    { value: 'multi-sensor', label: 'Multi-Sensor Device', unit: '' }
  ];

  const fetchSensors = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_sensors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSensors(data || []);
    } catch (error) {
      console.error('Error fetching sensors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sensors",
        variant: "destructive",
      });
    }
  };

  const fetchThresholds = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sensor_thresholds')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setThresholds(data || []);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSensor = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_sensors')
        .insert({
          ...newSensor,
          user_id: user.id,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sensor added successfully",
      });

      setNewSensor({
        sensor_name: '',
        sensor_type: 'temperature',
        device_id: '',
        location: ''
      });
      setDialogOpen(false);
      fetchSensors();
    } catch (error) {
      console.error('Error adding sensor:', error);
      toast({
        title: "Error",
        description: "Failed to add sensor",
        variant: "destructive",
      });
    }
  };

  const deleteSensor = async (sensorId: string) => {
    try {
      const { error } = await supabase
        .from('user_sensors')
        .delete()
        .eq('id', sensorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sensor deleted successfully",
      });

      fetchSensors();
    } catch (error) {
      console.error('Error deleting sensor:', error);
      toast({
        title: "Error",
        description: "Failed to delete sensor",
        variant: "destructive",
      });
    }
  };

  const saveThreshold = async () => {
    if (!user || !selectedSensor) return;

    try {
      const thresholdData = {
        user_id: user.id,
        sensor_id: selectedSensor.id,
        sensor_type: currentThreshold.sensor_type,
        min_threshold: currentThreshold.min_threshold ? parseFloat(currentThreshold.min_threshold) : null,
        max_threshold: currentThreshold.max_threshold ? parseFloat(currentThreshold.max_threshold) : null,
        critical_min: currentThreshold.critical_min ? parseFloat(currentThreshold.critical_min) : null,
        critical_max: currentThreshold.critical_max ? parseFloat(currentThreshold.critical_max) : null,
      };

      const { error } = await supabase
        .from('sensor_thresholds')
        .upsert(thresholdData, { 
          onConflict: 'user_id,sensor_id,sensor_type' 
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Threshold settings saved successfully",
      });

      setThresholdDialogOpen(false);
      fetchThresholds();
    } catch (error) {
      console.error('Error saving threshold:', error);
      toast({
        title: "Error",
        description: "Failed to save threshold settings",
        variant: "destructive",
      });
    }
  };

  const openThresholdDialog = (sensor: UserSensor) => {
    setSelectedSensor(sensor);
    
    // Load existing threshold if available
    const existingThreshold = thresholds.find(t => 
      t.sensor_id === sensor.id && t.sensor_type === sensor.sensor_type
    );
    
    if (existingThreshold) {
      setCurrentThreshold({
        sensor_type: existingThreshold.sensor_type,
        min_threshold: existingThreshold.min_threshold?.toString() || '',
        max_threshold: existingThreshold.max_threshold?.toString() || '',
        critical_min: existingThreshold.critical_min?.toString() || '',
        critical_max: existingThreshold.critical_max?.toString() || '',
      });
    } else {
      setCurrentThreshold({
        sensor_type: sensor.sensor_type,
        min_threshold: '',
        max_threshold: '',
        critical_min: '',
        critical_max: ''
      });
    }
    
    setThresholdDialogOpen(true);
  };

  useEffect(() => {
    fetchSensors();
    fetchThresholds();
  }, [user]);

  if (loading) {
    return <div className="animate-pulse bg-muted rounded-lg h-64"></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sensor Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Sensor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Sensor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sensor_name">Sensor Name</Label>
                <Input
                  id="sensor_name"
                  value={newSensor.sensor_name}
                  onChange={(e) => setNewSensor({ ...newSensor, sensor_name: e.target.value })}
                  placeholder="e.g., Garden Temperature Sensor"
                />
              </div>
              <div>
                <Label htmlFor="sensor_type">Sensor Type</Label>
                <Select
                  value={newSensor.sensor_type}
                  onValueChange={(value) => setNewSensor({ ...newSensor, sensor_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sensorTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="device_id">Device ID</Label>
                <Input
                  id="device_id"
                  value={newSensor.device_id}
                  onChange={(e) => setNewSensor({ ...newSensor, device_id: e.target.value })}
                  placeholder="e.g., SENSOR_001"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newSensor.location}
                  onChange={(e) => setNewSensor({ ...newSensor, location: e.target.value })}
                  placeholder="e.g., Garden Section A"
                />
              </div>
              <Button onClick={addSensor} className="w-full">
                Add Sensor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensors.map((sensor) => (
          <Card key={sensor.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{sensor.sensor_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {sensorTypes.find(t => t.value === sensor.sensor_type)?.label}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openThresholdDialog(sensor)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteSensor(sensor.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Device ID:</span>
                  <span className="text-sm font-mono">{sensor.device_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Location:</span>
                  <span className="text-sm">{sensor.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={sensor.status === 'active' ? 'default' : 'secondary'}>
                    {sensor.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Threshold Settings Dialog */}
      <Dialog open={thresholdDialogOpen} onOpenChange={setThresholdDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Threshold Settings - {selectedSensor?.sensor_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Sensor Type</Label>
              <Select
                value={currentThreshold.sensor_type}
                onValueChange={(value) => setCurrentThreshold({ ...currentThreshold, sensor_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sensorTypes.filter(t => t.value !== 'multi-sensor').map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label} ({type.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Warning Min</Label>
                <Input
                  type="number"
                  value={currentThreshold.min_threshold}
                  onChange={(e) => setCurrentThreshold({ ...currentThreshold, min_threshold: e.target.value })}
                  placeholder="Min threshold"
                />
              </div>
              <div>
                <Label>Warning Max</Label>
                <Input
                  type="number"
                  value={currentThreshold.max_threshold}
                  onChange={(e) => setCurrentThreshold({ ...currentThreshold, max_threshold: e.target.value })}
                  placeholder="Max threshold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Critical Min</Label>
                <Input
                  type="number"
                  value={currentThreshold.critical_min}
                  onChange={(e) => setCurrentThreshold({ ...currentThreshold, critical_min: e.target.value })}
                  placeholder="Critical min"
                />
              </div>
              <div>
                <Label>Critical Max</Label>
                <Input
                  type="number"
                  value={currentThreshold.critical_max}
                  onChange={(e) => setCurrentThreshold({ ...currentThreshold, critical_max: e.target.value })}
                  placeholder="Critical max"
                />
              </div>
            </div>

            <Button onClick={saveThreshold} className="w-full">
              Save Threshold Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {sensors.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No sensors added yet. Add your first sensor to start monitoring your environment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SensorManagement;