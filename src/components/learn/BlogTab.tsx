
import { useState } from "react";
import { PlusCircle, Calendar, User, Tag, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import BlogSubmissionForm from "@/components/learn/BlogSubmissionForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface BlogTabProps {
  searchQuery: string;
}

const BlogTab = ({ searchQuery }: BlogTabProps) => {
  const { user } = useAuth();
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);

  const { data: blogPosts, refetch } = useQuery({
    queryKey: ['blog-posts', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories(name),
          profiles(full_name)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header with Submit Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Blog Posts</h2>
          <p className="text-gray-600">
            Share your gardening knowledge and learn from the community
          </p>
        </div>
        
        {user && (
          <Dialog open={isSubmissionOpen} onOpenChange={setIsSubmissionOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <PlusCircle className="mr-2 h-4 w-4" />
                Submit Blog Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submit a New Blog Post</DialogTitle>
              </DialogHeader>
              <BlogSubmissionForm 
                categories={categories || []}
                onSuccess={() => {
                  setIsSubmissionOpen(false);
                  refetch();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Featured Categories */}
      {categories && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge key={category.id} variant="outline" className="cursor-pointer hover:bg-green-50">
                {category.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Blog Posts Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogPosts?.map((post) => (
          <Card key={post.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden cursor-pointer">
            {post.featured_image && (
              <div className="aspect-video overflow-hidden">
                <img 
                  src={post.featured_image} 
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            )}
            
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Calendar className="h-4 w-4" />
                {formatDate(post.published_at || post.created_at)}
              </div>
              
              <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                {post.title}
              </CardTitle>
              
              <CardDescription className="text-gray-600 line-clamp-3">
                {post.content.substring(0, 150)}...
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  {post.profiles?.full_name || 'Anonymous'}
                </div>
                
                {post.blog_categories && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    {post.blog_categories.name}
                  </Badge>
                )}
              </div>
              
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {post.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              <Button variant="ghost" className="w-full mt-4 text-green-600 hover:text-green-700 hover:bg-green-50">
                Read More <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {!blogPosts || blogPosts.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No blog posts yet</h3>
          <p className="text-gray-600 mb-4">
            Be the first to share your gardening knowledge with the community!
          </p>
          {user && (
            <Button onClick={() => setIsSubmissionOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              Write First Post
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default BlogTab;
