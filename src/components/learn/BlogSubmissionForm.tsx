
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface BlogSubmissionFormProps {
  categories: Array<{ id: string; name: string }>;
  onSuccess: () => void;
}

const BlogSubmissionForm = ({ categories, onSuccess }: BlogSubmissionFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category_id: "",
    featured_image: "",
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('blog_posts')
        .insert({
          title: formData.title,
          content: formData.content,
          author_id: user.id,
          category_id: formData.category_id || null,
          featured_image: formData.featured_image || null,
          tags: formData.tags,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Blog post submitted!",
        description: "Your post has been submitted for review and will be published after approval.",
      });

      onSuccess();
    } catch (error) {
      console.error('Error submitting blog post:', error);
      toast({
        title: "Error",
        description: "Failed to submit blog post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter your blog post title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Write your blog post content here..."
          rows={10}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="featured_image">Featured Image URL (optional)</Label>
        <Input
          id="featured_image"
          value={formData.featured_image}
          onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
          placeholder="https://example.com/image.jpg"
          type="url"
        />
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add a tag"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
          />
          <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleRemoveTag(tag)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2">Submission Guidelines</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Your post will be reviewed by our team before publication</li>
          <li>• Please ensure content is original and gardening-related</li>
          <li>• Include clear, helpful information for other gardeners</li>
          <li>• You'll be notified once your post is approved</li>
        </ul>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
          {isSubmitting ? "Submitting..." : "Submit for Review"}
        </Button>
      </div>
    </form>
  );
};

export default BlogSubmissionForm;
