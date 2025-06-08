
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Webinar {
  id: string;
  title: string;
  description: string;
  host_name: string;
  scheduled_date: string;
  duration_minutes: number;
  max_participants: number;
  status: string;
  registration_count?: number;
}

const AdminWebinars = () => {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    host_name: '',
    scheduled_date: '',
    duration_minutes: 60,
    max_participants: 100,
  });

  useEffect(() => {
    fetchWebinars();

    // Set up real-time subscription
    const channel = supabase
      .channel('webinars-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'webinars' }, fetchWebinars)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchWebinars = async () => {
    try {
      const { data: webinarsData, error } = await supabase
        .from('webinars')
        .select('*')
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      // Get registration counts
      const webinarsWithCounts = await Promise.all(
        (webinarsData || []).map(async (webinar) => {
          const { count } = await supabase
            .from('webinar_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('webinar_id', webinar.id);

          return {
            ...webinar,
            registration_count: count || 0
          };
        })
      );

      setWebinars(webinarsWithCounts);
    } catch (error) {
      console.error('Error fetching webinars:', error);
      toast({
        title: "Error",
        description: "Failed to fetch webinars",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createWebinar = async () => {
    try {
      const { error } = await supabase
        .from('webinars')
        .insert([{
          ...formData,
          scheduled_date: new Date(formData.scheduled_date).toISOString(),
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Webinar created successfully",
      });

      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        host_name: '',
        scheduled_date: '',
        duration_minutes: 60,
        max_participants: 100,
      });
      fetchWebinars();
    } catch (error) {
      console.error('Error creating webinar:', error);
      toast({
        title: "Error",
        description: "Failed to create webinar",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'default';
      case 'live':
        return 'secondary';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading webinars...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Webinar Management</h2>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Webinar
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Webinar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Webinar Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Input
                placeholder="Host Name"
                value={formData.host_name}
                onChange={(e) => setFormData({ ...formData, host_name: e.target.value })}
              />
              <Input
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Duration (minutes)"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
              />
              <Input
                type="number"
                placeholder="Max Participants"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
              />
            </div>
            <Textarea
              placeholder="Webinar Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={createWebinar}>Create Webinar</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {webinars.map((webinar) => (
          <Card key={webinar.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{webinar.title}</CardTitle>
                <Badge variant={getStatusColor(webinar.status)}>
                  {webinar.status.charAt(0).toUpperCase() + webinar.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Host</p>
                  <p className="font-medium">{webinar.host_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Scheduled</p>
                    <p className="font-medium">{new Date(webinar.scheduled_date).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Registrations</p>
                    <p className="font-medium">{webinar.registration_count} / {webinar.max_participants}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-sm bg-gray-50 p-3 rounded">
                  {webinar.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {webinars.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          No webinars found.
        </div>
      )}
    </div>
  );
};

export default AdminWebinars;
