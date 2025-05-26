
import { useState } from "react";
import { Calendar, Database, Thermometer, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";

// Mock sensor data
const sensorDevices = [
  { id: "sensor-001", name: "Garden Bed A", location: "Front Yard", status: "active" },
  { id: "sensor-002", name: "Greenhouse #1", location: "Greenhouse", status: "active" },
  { id: "sensor-003", name: "Herb Garden", location: "Kitchen Window", status: "warning" },
  { id: "sensor-004", name: "Vegetable Plot", location: "Backyard", status: "active" }
];

const cropTypes = [
  "Tomatoes", "Lettuce", "Basil", "Peppers", "Carrots", "Spinach"
];

const mockSensorData = {
  temperature: { value: 22.5, unit: "°C", trend: "up", status: "good" },
  humidity: { value: 65, unit: "%", trend: "stable", status: "good" },
  soilMoisture: { value: 45, unit: "%", trend: "down", status: "warning" },
  lightLevel: { value: 85, unit: "%", trend: "up", status: "good" },
  phLevel: { value: 6.8, unit: "pH", trend: "stable", status: "good" },
  nutrients: { value: 78, unit: "%", trend: "up", status: "good" }
};

const alerts = [
  { id: 1, type: "warning", message: "Soil moisture low in Herb Garden", time: "2 hours ago" },
  { id: 2, type: "info", message: "Temperature optimal for tomato growth", time: "4 hours ago" },
  { id: 3, type: "success", message: "Nutrient levels improved in Garden Bed A", time: "6 hours ago" }
];

const Dashboard = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [selectedCrop, setSelectedCrop] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good": return "bg-green-100 text-green-800";
      case "warning": return "bg-yellow-100 text-yellow-800";
      case "critical": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <ArrowUp className="h-4 w-4 text-green-600" />;
      case "down": return <ArrowDown className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full"></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            IoT Sensor Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Monitor your garden's health with real-time sensor data and intelligent insights
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-48">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
              <SelectTrigger className="w-48">
                <Database className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select device" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                {sensorDevices.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    {device.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Crop type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Crops</SelectItem>
                {cropTypes.map((crop) => (
                  <SelectItem key={crop} value={crop.toLowerCase()}>
                    {crop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Dashboard */}
          <div className="lg:col-span-3 space-y-6">
            {/* Sensor Metrics */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(mockSensorData).map(([key, data]) => (
                <Card key={key} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </CardTitle>
                    {getTrendIcon(data.trend)}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {data.value} {data.unit}
                    </div>
                    <Badge className={`mt-2 ${getStatusColor(data.status)}`}>
                      {data.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Chart Placeholder */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Sensor Data Trends</CardTitle>
                <CardDescription>
                  Historical data for the selected time range
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <Thermometer className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <p className="text-lg font-medium">Interactive Charts Coming Soon</p>
                    <p className="text-sm">Real-time sensor data visualization</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>
                  System notifications and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          alert.type === 'warning' ? 'bg-yellow-500' :
                          alert.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                        }`}></div>
                        <span className="text-sm font-medium">{alert.message}</span>
                      </div>
                      <span className="text-xs text-gray-500">{alert.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Device List Sidebar */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Connected Devices</CardTitle>
                <CardDescription>
                  Your sensor network status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sensorDevices.map((device) => (
                    <div key={device.id} className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{device.name}</h4>
                        <Badge className={`${
                          device.status === 'active' ? 'bg-green-100 text-green-800' :
                          device.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {device.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{device.location}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start bg-green-600 hover:bg-green-700 text-white">
                  Activate Irrigation
                </Button>
                <Button variant="outline" className="w-full justify-start border-green-600 text-green-600 hover:bg-green-50">
                  View Automation Rules
                </Button>
                <Button variant="outline" className="w-full justify-start border-green-600 text-green-600 hover:bg-green-50">
                  Export Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
