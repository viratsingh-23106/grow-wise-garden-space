
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Ban, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchDiscussions = async () => {
    try {
      const { data: discussionsData, error } = await supabase
        .from('community_discussions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get author emails and reply counts
      const { data: authUsers } = await supabase.auth.admin.listUsers();

      const discussionsWithDetails = await Promise.all(
        (discussionsData || []).map(async (discussion) => {
          const { count } = await supabase
            .from('discussion_replies')
            .select('*', { count: 'exact', head: true })
            .eq('discussion_id', discussion.id);

          return {
            ...discussion,
            author_email: authUsers.users.find(u => u.id === discussion.author_id)?.email || 'N/A',
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
        .update({ status: newStatus })
        .eq('id', discussionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Discussion status updated successfully",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'closed':
        return 'secondary';
      case 'hidden':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading discussions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Community Management</h2>
      </div>

      <div className="grid gap-4">
        {discussions.map((discussion) => (
          <Card key={discussion.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{discussion.title}</CardTitle>
                <Badge variant={getStatusColor(discussion.status)}>
                  {discussion.status.charAt(0).toUpperCase() + discussion.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Author</p>
                  <p className="font-medium">{discussion.author_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium">{new Date(discussion.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Replies</p>
                  <p className="font-medium">{discussion.replies_count}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Content Preview</p>
                <p className="text-sm bg-gray-50 p-3 rounded line-clamp-3">
                  {discussion.content.substring(0, 200)}...
                </p>
              </div>

              <div className="flex gap-2">
                {discussion.status === 'active' && (
                  <>
                    <Button
                      onClick={() => updateDiscussionStatus(discussion.id, 'closed')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Ban className="w-4 h-4" />
                      Close
                    </Button>
                    <Button
                      onClick={() => updateDiscussionStatus(discussion.id, 'hidden')}
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Hide
                    </Button>
                  </>
                )}
                {discussion.status !== 'active' && (
                  <Button
                    onClick={() => updateDiscussionStatus(discussion.id, 'active')}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Reactivate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {discussions.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          No discussions found.
        </div>
      )}
    </div>
  );
};

export default AdminCommunity;
