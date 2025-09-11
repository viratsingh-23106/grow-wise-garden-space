import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Tag } from "lucide-react";

interface BlogDetailDialogProps {
  blog: any;
  isOpen: boolean;
  onClose: () => void;
}

const BlogDetailDialog = ({ blog, isOpen, onClose }: BlogDetailDialogProps) => {
  if (!blog) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-left">
            {blog.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Featured image */}
          {blog.featured_image && (
            <div className="aspect-video overflow-hidden rounded-lg">
              <img 
                src={blog.featured_image} 
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Meta information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 border-b pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(blog.published_at || blog.created_at)}
            </div>
            
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Author
            </div>
            
            {blog.blog_categories && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {blog.blog_categories.name}
              </Badge>
            )}
          </div>
          
          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Full content */}
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {blog.content}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlogDetailDialog;