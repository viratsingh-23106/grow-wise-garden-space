
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, MessageSquare, Trash2, Search, CheckCircle, XCircle } from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";

const AdminCommunity = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { discussions, loading, updateDiscussionStatus, deleteDiscussion } = useAdminData();

  const filteredDiscussions = discussions.filter(discussion => {
    const matchesSearch = discussion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         discussion.author_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || discussion.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'locked': return 'secondary';
      case 'archived': return 'outline';
      case 'flagged': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleDelete = async (discussion: any) => {
    if (!confirm(`Are you sure you want to delete "${discussion.title}"?`)) return;
    await deleteDiscussion(discussion.id);
  };

  if (loading) {
    return <div className="text-center p-8">Loading community discussions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Community Management</h2>
          <Badge variant="secondary">{discussions.length} Discussions</Badge>
        </div>
      </div>

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
            <SelectItem value="locked">Locked</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredDiscussions.map((discussion) => (
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
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Author: {discussion.author_email}</p>
                  <p className="text-sm text-gray-600">
                    Created: {new Date(discussion.created_at).toLocaleDateString()}
                  </p>
                  {discussion.updated_at !== discussion.created_at && (
                    <p className="text-sm text-gray-600">
                      Updated: {new Date(discussion.updated_at).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-sm line-clamp-2">{discussion.content}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(discussion)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {discussion.status !== 'active' && (
                  <Button
                    size="sm"
                    onClick={() => updateDiscussionStatus(discussion.id, 'active')}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Activate
                  </Button>
                )}
                {discussion.status !== 'locked' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateDiscussionStatus(discussion.id, 'locked')}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Lock
                  </Button>
                )}
                {discussion.status !== 'archived' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateDiscussionStatus(discussion.id, 'archived')}
                  >
                    Archive
                  </Button>
                )}
                {discussion.status !== 'flagged' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateDiscussionStatus(discussion.id, 'flagged')}
                  >
                    Flag
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
    </div>
  );
};

export default AdminCommunity;
