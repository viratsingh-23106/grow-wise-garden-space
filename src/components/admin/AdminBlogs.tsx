
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  status: string;
  author_id: string;
  created_at: string;
  author_email?: string;
}

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();

    // Set up real-time subscription
    const channel = supabase
      .channel('blogs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, fetchBlogs)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBlogs = async () => {
    try {
      const { data: blogsData, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get author emails
      const { data: authUsersResponse } = await supabase.auth.admin.listUsers();
      const authUsers = authUsersResponse?.users || [];

      const blogsWithAuthors = blogsData?.map(blog => ({
        ...blog,
        author_email: authUsers.find((u: any) => u.id === blog.author_id)?.email || 'N/A'
      })) || [];

      setBlogs(blogsWithAuthors);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch blogs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBlogStatus = async (blogId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ status: newStatus })
        .eq('id', blogId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Blog ${newStatus} successfully`,
      });

      fetchBlogs(); // Refresh the list
    } catch (error) {
      console.error('Error updating blog status:', error);
      toast({
        title: "Error",
        description: "Failed to update blog status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading blogs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Blog Management</h2>
      </div>

      <div className="grid gap-4">
        {blogs.map((blog) => (
          <Card key={blog.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{blog.title}</CardTitle>
                <Badge variant={getStatusColor(blog.status)}>
                  {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Author</p>
                  <p className="font-medium">{blog.author_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted</p>
                  <p className="font-medium">{new Date(blog.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Content Preview</p>
                <p className="text-sm bg-gray-50 p-3 rounded line-clamp-3">
                  {blog.content.substring(0, 200)}...
                </p>
              </div>

              {blog.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateBlogStatus(blog.id, 'approved')}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => updateBlogStatus(blog.id, 'rejected')}
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {blogs.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          No blog posts found.
        </div>
      )}
    </div>
  );
};

export default AdminBlogs;
