
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Thermometer, Droplets, Gauge, Sun, AlertTriangle, TrendingUp, TrendingDown, Minus, Settings, Download, Users, Zap, Crown, X } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import NavBar from '@/components/NavBar';
import RealTimeSensorData from '@/components/dashboard/RealTimeSensorData';
import SensorAlerts from '@/components/dashboard/SensorAlerts';
import SensorManagement from '@/components/dashboard/SensorManagement';
import { useDashboardData } from '@/hooks/useDashboardData';

const cropTypes = [
  { id: "all", name: "All Crops" },
  { id: "tomatoes", name: "Tomatoes" },
  { id: "lettuce", name: "Lettuce" },
  { id: "basil", name: "Basil" }
];

const Dashboard = () => {
  const { user } = useAuth();
  const { isSubscribed, trialEnded, loading: subscriptionLoading, refreshSubscription } = useSubscription();
  const [timeRange, setTimeRange] = useState("24h");
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [selectedCrop, setSelectedCrop] = useState("all");
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(true);

  const { metrics, devices, alerts, loading: dashboardLoading } = useDashboardData(selectedDevice, timeRange);
  const canAccessDashboard = isSubscribed || !trialEnded;

  // Refresh subscription when component mounts (useful after payment)
  useEffect(() => {
    if (user) {
      refreshSubscription();
    }
  }, [user, refreshSubscription]);

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal": return "text-success";
      case "warning": return "text-warning";  
      case "low": return "text-warning";
      case "critical": return "text-destructive";
      case "offline": return "text-muted-foreground";
      default: return "text-muted-foreground";
    }
  };

  const getSensorIconComponent = (sensorName: string) => {
    switch (sensorName.toLowerCase()) {
      case "temperature": return Thermometer;
      case "humidity": return Droplets;
      case "soil moisture": return Gauge;
      case "light level": return Sun;
      default: return Gauge;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-3 w-3 text-success" />;
      case "down": return <TrendingDown className="h-3 w-3 text-destructive" />;
      default: return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (subscriptionLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Show trial ended message if access expired
  if (!canAccessDashboard) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Card className="p-8">
            <CardHeader>
              <CardTitle className="text-2xl">Dashboard Access Expired</CardTitle>
              <CardDescription>
                Your trial has ended. Subscribe to continue accessing your IoT sensor dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.href = '/subscription'} className="mt-4">
                View Subscription Plans
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Smart Agriculture Dashboard</h1>
            <p className="text-xl text-muted-foreground">
              Monitor your crops with real-time IoT sensor data
            </p>
          </div>

          {/* Trial Upgrade Banner */}
          {!isSubscribed && !trialEnded && showUpgradeBanner && (
            <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-100 rounded-full">
                      <Crown className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-800">Unlock Pro Features</p>
                      <p className="text-sm text-amber-700">
                        Upgrade to Premium for advanced analytics, unlimited sensors, and automation features
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => window.location.href = '/subscription'}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Upgrade Now
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowUpgradeBanner(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sensors">Live Sensors</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="manage">Manage</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Time Range:</label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Last 24h</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Device:</label>
                  <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map(device => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.sensor_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Crop:</label>
                  <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cropTypes.map(crop => (
                        <SelectItem key={crop.id} value={crop.id}>
                          {crop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sensor Metrics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((sensor, index) => {
                  const Icon = getSensorIconComponent(sensor.name);
                  const TrendIcon = getTrendIcon(sensor.trend);
                  
                  return (
                    <Card key={index} className="relative overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          {sensor.name}
                        </CardTitle>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{sensor.value}</div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          {getTrendIcon(sensor.trend)}
                          <span className={getStatusColor(sensor.status)}>{sensor.status}</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Range: {sensor.range}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Recent Alerts Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Recent Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alerts.slice(0, 3).map((alert, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          alert.alert_type === 'critical' ? 'bg-destructive' :
                          alert.alert_type === 'warning' ? 'bg-warning' : 'bg-info'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={alert.alert_type === 'critical' ? 'destructive' : 'secondary'}>
                          {alert.alert_type}
                        </Badge>
                      </div>
                    ))}
                    {alerts.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No active alerts
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {isSubscribed ? (
                      <>
                        <Button className="h-20 flex-col gap-2">
                          <Download className="h-5 w-5" />
                          Export Data
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2">
                          <Settings className="h-5 w-5" />
                          Configure
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2">
                          <Users className="h-5 w-5" />
                          Share Access
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2">
                          <Zap className="h-5 w-5" />
                          Automations
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button disabled className="h-20 flex-col gap-2">
                          <Download className="h-5 w-5" />
                          Export Data
                          <Badge variant="secondary" className="text-xs">Pro</Badge>
                        </Button>
                        <Button disabled variant="outline" className="h-20 flex-col gap-2">
                          <Settings className="h-5 w-5" />
                          Configure
                          <Badge variant="secondary" className="text-xs">Pro</Badge>
                        </Button>
                        <Button disabled variant="outline" className="h-20 flex-col gap-2">
                          <Users className="h-5 w-5" />
                          Share Access
                          <Badge variant="secondary" className="text-xs">Pro</Badge>
                        </Button>
                        <Button disabled variant="outline" className="h-20 flex-col gap-2">
                          <Zap className="h-5 w-5" />
                          Automations
                          <Badge variant="secondary" className="text-xs">Pro</Badge>
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sensors">
              <RealTimeSensorData />
            </TabsContent>

            <TabsContent value="alerts">
              <SensorAlerts />
            </TabsContent>

            <TabsContent value="manage">
              <SensorManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
