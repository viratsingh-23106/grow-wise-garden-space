import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Calendar, Users, Edit, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";

interface Webinar {
  id: string;
  title: string;
  description: string;
  host_name: string;
  scheduled_date: string;
  duration_minutes: number;
  max_participants: number;
  status: string;
  zoom_meeting_link?: string;
  recording_url?: string;
  registration_count?: number;
}

const AdminWebinars = () => {
  const { logAdminActivity } = useAdmin();
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [filteredWebinars, setFilteredWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    host_name: '',
    scheduled_date: '',
    duration_minutes: 60,
    max_participants: 100,
    zoom_meeting_link: '',
    recording_url: '',
    status: 'upcoming'
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

  useEffect(() => {
    let filtered = webinars;

    if (searchTerm) {
      filtered = filtered.filter(webinar =>
        webinar.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        webinar.host_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(webinar => webinar.status === statusFilter);
    }

    setFilteredWebinars(filtered);
  }, [webinars, searchTerm, statusFilter]);

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

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      host_name: '',
      scheduled_date: '',
      duration_minutes: 60,
      max_participants: 100,
      zoom_meeting_link: '',
      recording_url: '',
      status: 'upcoming'
    });
    setSelectedWebinar(null);
    setIsEditing(false);
  };

  const handleCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (webinar: Webinar) => {
    setSelectedWebinar(webinar);
    setFormData({
      title: webinar.title,
      description: webinar.description || '',
      host_name: webinar.host_name,
      scheduled_date: new Date(webinar.scheduled_date).toISOString().slice(0, 16),
      duration_minutes: webinar.duration_minutes || 60,
      max_participants: webinar.max_participants || 100,
      zoom_meeting_link: webinar.zoom_meeting_link || '',
      recording_url: webinar.recording_url || '',
      status: webinar.status
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
      };

      if (isEditing && selectedWebinar) {
        const { error } = await supabase
          .from('webinars')
          .update({ ...submitData, updated_at: new Date().toISOString() })
          .eq('id', selectedWebinar.id);

        if (error) throw error;

        await logAdminActivity('UPDATE', 'webinars', selectedWebinar.id, submitData);
        toast({
          title: "Success",
          description: "Webinar updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('webinars')
          .insert([submitData]);

        if (error) throw error;

        await logAdminActivity('CREATE', 'webinars', undefined, submitData);
        toast({
          title: "Success",
          description: "Webinar created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchWebinars();
    } catch (error) {
      console.error('Error saving webinar:', error);
      toast({
        title: "Error",
        description: "Failed to save webinar",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (webinar: Webinar) => {
    if (!confirm(`Are you sure you want to delete "${webinar.title}"?`)) return;

    try {
      const { error } = await supabase
        .from('webinars')
        .delete()
        .eq('id', webinar.id);

      if (error) throw error;

      await logAdminActivity('DELETE', 'webinars', webinar.id, { title: webinar.title });
      toast({
        title: "Success",
        description: "Webinar deleted successfully",
      });
      fetchWebinars();
    } catch (error) {
      console.error('Error deleting webinar:', error);
      toast({
        title: "Error",
        description: "Failed to delete webinar",
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
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Webinar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search webinars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredWebinars.map((webinar) => (
          <Card key={webinar.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{webinar.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(webinar.status)}>
                    {webinar.status.charAt(0).toUpperCase() + webinar.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(webinar)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(webinar)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
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

      {filteredWebinars.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          No webinars found.
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Webinar' : 'Create New Webinar'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Webinar Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <Input
                placeholder="Host Name"
                value={formData.host_name}
                onChange={(e) => setFormData({ ...formData, host_name: e.target.value })}
                required
              />
              <Input
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                required
              />
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Duration (minutes)"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
              />
              <Input
                type="number"
                placeholder="Max Participants"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 100 })}
              />
            </div>
            <Textarea
              placeholder="Webinar Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
            <Input
              placeholder="Zoom Meeting Link"
              value={formData.zoom_meeting_link}
              onChange={(e) => setFormData({ ...formData, zoom_meeting_link: e.target.value })}
            />
            <Input
              placeholder="Recording URL"
              value={formData.recording_url}
              onChange={(e) => setFormData({ ...formData, recording_url: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? 'Update Webinar' : 'Create Webinar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWebinars;