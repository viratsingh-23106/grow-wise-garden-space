import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SensorAlert {
  id: string;
  sensor_id: string;
  alert_type: 'critical' | 'warning' | 'info';
  sensor_type: string;
  current_value: number;
  threshold_value: number;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

const SensorAlerts = () => {
  const [alerts, setAlerts] = useState<SensorAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAlerts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sensor_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAlerts((data || []) as SensorAlert[]);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sensor alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('sensor_alerts')
        .update({ 
          is_resolved: true, 
          resolved_at: new Date().toISOString() 
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(alerts.filter(alert => alert.id !== alertId));
      toast({
        title: "Alert Resolved",
        description: "Alert has been marked as resolved",
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Set up real-time subscription for new alerts
    const channel = supabase
      .channel('sensor-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_alerts',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          const newAlert = payload.new as SensorAlert;
          setAlerts(prev => [newAlert, ...prev].slice(0, 10));
          
          // Show toast notification for critical alerts
          if (newAlert.alert_type === 'critical') {
            toast({
              title: "Critical Alert!",
              description: newAlert.message,
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <Info className="h-5 w-5 text-info" />;
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'critical':
        return 'destructive' as const;
      case 'warning':
        return 'default' as const;
      default:
        return 'default' as const;
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-muted rounded-lg h-32"></div>;
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 border">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-5 w-5 text-success" />
          <h3 className="font-semibold">All Systems Normal</h3>
        </div>
        <p className="text-muted-foreground text-sm">No active alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        Active Alerts ({alerts.length})
      </h3>
      
      {alerts.map((alert) => (
        <Alert key={alert.id} variant={getAlertVariant(alert.alert_type)}>
          <div className="flex items-start justify-between w-full">
            <div className="flex items-start gap-2">
              {getAlertIcon(alert.alert_type)}
              <div className="flex-1">
                <AlertDescription className="font-medium">
                  {alert.message}
                </AlertDescription>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resolveAlert(alert.id)}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
};

export default SensorAlerts;