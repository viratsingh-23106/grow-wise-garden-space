
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Plus, Edit, Trash2, Search, Eye, EyeOff, Ban, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";

interface Discussion {
  id: string;
  title: string;
  content: string;
  status: string;
  author_id: string;
  created_at: string;
  author_email?: string;
  replies_count?: number;
}

const AdminCommunity = () => {
  const { logAdminActivity } = useAdmin();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [filteredDiscussions, setFilteredDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'active'
  });

  useEffect(() => {
    fetchDiscussions();

    // Set up real-time subscription
    const channel = supabase
      .channel('discussions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_discussions' }, fetchDiscussions)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = discussions;

    if (searchTerm) {
      filtered = filtered.filter(discussion =>
        discussion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        discussion.author_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(discussion => discussion.status === statusFilter);
    }

    setFilteredDiscussions(filtered);
  }, [discussions, searchTerm, statusFilter]);

  const fetchDiscussions = async () => {
    try {
      const { data: discussionsData, error } = await supabase
        .from('community_discussions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get author emails and reply counts
      const { data: authUsersResponse } = await supabase.auth.admin.listUsers();
      const authUsers = authUsersResponse?.users || [];

      const discussionsWithDetails = await Promise.all(
        (discussionsData || []).map(async (discussion) => {
          const { count } = await supabase
            .from('discussion_replies')
            .select('*', { count: 'exact', head: true })
            .eq('discussion_id', discussion.id);

          return {
            ...discussion,
            author_email: authUsers.find((u: any) => u.id === discussion.author_id)?.email || 'N/A',
            replies_count: count || 0
          };
        })
      );

      setDiscussions(discussionsWithDetails);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch discussions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDiscussionStatus = async (discussionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('community_discussions')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', discussionId);

      if (error) throw error;

      await logAdminActivity('UPDATE', 'community_discussions', discussionId, { status: newStatus });
      
      toast({
        title: "Success",
        description: `Discussion ${newStatus === 'active' ? 'activated' : 'hidden'}`,
      });

      fetchDiscussions();
    } catch (error) {
      console.error('Error updating discussion status:', error);
      toast({
        title: "Error",
        description: "Failed to update discussion status",
        variant: "destructive",
      });
    }
  };

  const handleCreate = () => {
    setFormData({ title: '', content: '', status: 'active' });
    setSelectedDiscussion(null);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (discussion: Discussion) => {
    setFormData({
      title: discussion.title,
      content: discussion.content,
      status: discussion.status
    });
    setSelectedDiscussion(discussion);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && selectedDiscussion) {
        const { error } = await supabase
          .from('community_discussions')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedDiscussion.id);

        if (error) throw error;

        await logAdminActivity('UPDATE', 'community_discussions', selectedDiscussion.id, formData);
        toast({
          title: "Success",
          description: "Discussion updated successfully",
        });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        const { error } = await supabase
          .from('community_discussions')
          .insert([{
            ...formData,
            author_id: user.id
          }]);

        if (error) throw error;

        await logAdminActivity('CREATE', 'community_discussions', undefined, formData);
        toast({
          title: "Success",
          description: "Discussion created successfully",
        });
      }

      setIsDialogOpen(false);
      fetchDiscussions();
    } catch (error) {
      console.error('Error saving discussion:', error);
      toast({
        title: "Error",
        description: "Failed to save discussion",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (discussion: Discussion) => {
    if (!confirm(`Are you sure you want to delete "${discussion.title}"?`)) return;

    try {
      // First delete all replies
      const { error: repliesError } = await supabase
        .from('discussion_replies')
        .delete()
        .eq('discussion_id', discussion.id);

      if (repliesError) throw repliesError;

      // Then delete the discussion
      const { error } = await supabase
        .from('community_discussions')
        .delete()
        .eq('id', discussion.id);

      if (error) throw error;

      await logAdminActivity('DELETE', 'community_discussions', discussion.id, { title: discussion.title });
      toast({
        title: "Success",
        description: "Discussion deleted successfully",
      });
      fetchDiscussions();
    } catch (error) {
      console.error('Error deleting discussion:', error);
      toast({
        title: "Error",
        description: "Failed to delete discussion",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'hidden':
        return 'secondary';
      case 'archived':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading discussions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Community Management</h2>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Discussion
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search discussions..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredDiscussions.map((discussion) => (
          <Card key={discussion.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  {discussion.title}
                </CardTitle>
                <Badge variant={getStatusColor(discussion.status)}>
                  {discussion.status.charAt(0).toUpperCase() + discussion.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Author: {discussion.author_email}</span>
                    <span>Replies: {discussion.replies_count}</span>
                    <span>Created: {new Date(discussion.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm line-clamp-2">{discussion.content}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(discussion)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(discussion)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                {discussion.status === 'active' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateDiscussionStatus(discussion.id, 'hidden')}
                    className="flex items-center gap-2"
                  >
                    <EyeOff className="w-4 h-4" />
                    Hide Discussion
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => updateDiscussionStatus(discussion.id, 'active')}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Show Discussion
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDiscussions.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          No discussions found.
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Discussion' : 'Create New Discussion'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Discussion Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder="Discussion Content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                required
              />
            </div>

            <div className="space-y-2">
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? 'Update Discussion' : 'Create Discussion'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCommunity;
