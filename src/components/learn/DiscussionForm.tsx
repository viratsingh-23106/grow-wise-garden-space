
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Users } from "lucide-react";

interface DiscussionFormProps {
  categories: Array<{ id: string; name: string }>;
  onSuccess: () => void;
}

const DiscussionForm = ({ categories, onSuccess }: DiscussionFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [communityPlatform, setCommunityPlatform] = useState("discord");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category_id: ""
  });

  // Community links - in a real app, these would be stored in the database or environment variables
  const communityLinks = {
    discord: "https://discord.gg/gardening-community",
    whatsapp: "https://chat.whatsapp.com/gardening-group"
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('community_discussions')
        .insert({
          title: formData.title,
          content: formData.content,
          author_id: user.id,
          category_id: formData.category_id || null,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Discussion started!",
        description: `Your discussion has been posted. Redirecting to ${communityPlatform === 'discord' ? 'Discord' : 'WhatsApp'} community...`,
      });

      // Redirect to the selected community platform
      setTimeout(() => {
        window.open(communityLinks[communityPlatform as keyof typeof communityLinks], '_blank');
        onSuccess();
      }, 2000);

    } catch (error) {
      console.error('Error creating discussion:', error);
      toast({
        title: "Error",
        description: "Failed to create discussion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Discussion Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="What would you like to discuss?"
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
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Share your thoughts, ask questions, or start a conversation..."
          rows={8}
          required
        />
      </div>

      <div className="space-y-3">
        <Label>Choose Community Platform</Label>
        <RadioGroup value={communityPlatform} onValueChange={setCommunityPlatform}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="discord" id="discord" />
            <Label htmlFor="discord" className="flex items-center gap-2 cursor-pointer">
              <MessageCircle className="h-4 w-4" />
              Discord Community
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="whatsapp" id="whatsapp" />
            <Label htmlFor="whatsapp" className="flex items-center gap-2 cursor-pointer">
              <Users className="h-4 w-4" />
              WhatsApp Group
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Community Guidelines</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Be respectful and supportive to all community members</li>
          <li>• Share knowledge and help others learn</li>
          <li>• Use appropriate channels for different types of discussions</li>
          <li>• Include photos when they help illustrate your point</li>
        </ul>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-800 mb-2">What happens next?</h4>
        <p className="text-sm text-green-700">
          After submitting, you'll be redirected to our {communityPlatform === 'discord' ? 'Discord server' : 'WhatsApp group'} 
          where you can continue the discussion with fellow gardeners in real-time!
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white">
        {isSubmitting ? "Posting Discussion..." : `Start Discussion & Join ${communityPlatform === 'discord' ? 'Discord' : 'WhatsApp'}`}
      </Button>
    </form>
  );
};

export default DiscussionForm;
