
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

interface CommunityParticipantFormProps {
  onSuccess: () => void;
}

const CommunityParticipantForm = ({ onSuccess }: CommunityParticipantFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    experience_level: "",
    location: "",
    interests: [] as string[]
  });
  const [newInterest, setNewInterest] = useState("");

  const handleAddInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (interestToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(interest => interest !== interestToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('community_participants')
        .insert({
          user_id: user.id,
          name: formData.name,
          experience_level: formData.experience_level,
          location: formData.location || null,
          interests: formData.interests
        });

      if (error) throw error;

      toast({
        title: "Welcome to the community!",
        description: "Your profile has been created. You can now participate in discussions.",
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating participant profile:', error);
      toast({
        title: "Error",
        description: "Failed to create community profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Display Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="How should we address you in the community?"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="experience_level">Experience Level</Label>
        <Select 
          value={formData.experience_level} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, experience_level: value }))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your gardening experience level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Beginner - Just starting out</SelectItem>
            <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
            <SelectItem value="advanced">Advanced - Very experienced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location (optional)</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          placeholder="City, State/Country (helps with regional advice)"
        />
      </div>

      <div className="space-y-2">
        <Label>Interests</Label>
        <div className="flex gap-2">
          <Input
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            placeholder="Add an interest (e.g., tomatoes, indoor plants)"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
          />
          <Button type="button" onClick={handleAddInterest} variant="outline" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {formData.interests.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.interests.map((interest) => (
              <Badge key={interest} variant="secondary" className="flex items-center gap-1">
                {interest}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleRemoveInterest(interest)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Community Guidelines</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Be respectful and helpful to other community members</li>
          <li>• Share knowledge and experiences constructively</li>
          <li>• Ask questions - everyone is here to learn and help</li>
          <li>• Stay on topic and keep discussions gardening-related</li>
        </ul>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white">
        {isSubmitting ? "Creating Profile..." : "Join Community"}
      </Button>
    </form>
  );
};

export default CommunityParticipantForm;
