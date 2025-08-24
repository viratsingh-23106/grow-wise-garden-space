
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Search, Video, Calendar, Users } from "lucide-react";
import { useAdminData, AdminWebinar } from "@/hooks/useAdminData";

const AdminWebinars = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { webinars, loading, upsertWebinar, deleteWebinar } = useAdminData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWebinar, setSelectedWebinar] = useState<AdminWebinar | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    host_name: '',
    scheduled_date: '',
    duration_minutes: 60,
    max_participants: 100,
    status: 'upcoming',
    zoom_meeting_link: '',
    recording_url: ''
  });

  const handleCreate = () => {
    setFormData({
      title: '',
      description: '',
      host_name: '',
      scheduled_date: '',
      duration_minutes: 60,
      max_participants: 100,
      status: 'upcoming',
      zoom_meeting_link: '',
      recording_url: ''
    });
    setSelectedWebinar(null);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (webinar: AdminWebinar) => {
    const scheduledDate = new Date(webinar.scheduled_date);
    const formattedDate = scheduledDate.toISOString().slice(0, 16);
    
    setFormData({
      title: webinar.title,
      description: webinar.description || '',
      host_name: webinar.host_name,
      scheduled_date: formattedDate,
      duration_minutes: webinar.duration_minutes,
      max_participants: webinar.max_participants,
      status: webinar.status,
      zoom_meeting_link: webinar.zoom_meeting_link || '',
      recording_url: webinar.recording_url || ''
    });
    setSelectedWebinar(webinar);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.host_name || !formData.scheduled_date) {
      return;
    }

    await upsertWebinar(
      formData.title,
      formData.description,
      formData.host_name,
      new Date(formData.scheduled_date).toISOString(),
      formData.status,
      formData.duration_minutes,
      formData.max_participants,
      formData.zoom_meeting_link,
      formData.recording_url,
      isEditing ? selectedWebinar?.id : undefined
    );
    
    setIsDialogOpen(false);
  };

  const handleDelete = async (webinar: AdminWebinar) => {
    if (!confirm(`Are you sure you want to delete "${webinar.title}"?`)) return;
    await deleteWebinar(webinar.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'default';
      case 'live': return 'destructive';
      case 'completed': return 'secondary';
      case 'cancelled': return 'outline';
      default: return 'secondary';
    }
  };

  const filteredWebinars = webinars.filter(webinar =>
    webinar.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    webinar.host_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center p-8">Loading webinars...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Video className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Webinar Management</h2>
          <Badge variant="secondary">{webinars.length} Webinars</Badge>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Webinar
        </Button>
      </div>

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
      </div>

      <div className="grid gap-4">
        {filteredWebinars.map((webinar) => (
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
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <p className="text-sm text-gray-600">{webinar.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(webinar.scheduled_date).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Max: {webinar.max_participants}
                    </div>
                    <span>Duration: {webinar.duration_minutes}min</span>
                  </div>
                  <p className="text-sm text-gray-600">Host: {webinar.host_name}</p>
                  {webinar.zoom_meeting_link && (
                    <p className="text-sm">
                      <a 
                        href={webinar.zoom_meeting_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        Zoom Meeting Link
                      </a>
                    </p>
                  )}
                  {webinar.recording_url && (
                    <p className="text-sm">
                      <a 
                        href={webinar.recording_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        Recording Available
                      </a>
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(webinar)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(webinar)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Webinar' : 'Create New Webinar'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Webinar Title *</Label>
              <Input
                placeholder="Enter webinar title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Webinar description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Host Name *</Label>
                <Input
                  placeholder="Enter host name"
                  value={formData.host_name}
                  onChange={(e) => setFormData({ ...formData, host_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Scheduled Date & Time *</Label>
              <Input
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                />
              </div>
              <div>
                <Label>Max Participants</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 100 })}
                />
              </div>
            </div>

            <div>
              <Label>Zoom Meeting Link</Label>
              <Input
                placeholder="https://zoom.us/j/..."
                value={formData.zoom_meeting_link}
                onChange={(e) => setFormData({ ...formData, zoom_meeting_link: e.target.value })}
              />
            </div>

            <div>
              <Label>Recording URL</Label>
              <Input
                placeholder="https://..."
                value={formData.recording_url}
                onChange={(e) => setFormData({ ...formData, recording_url: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
