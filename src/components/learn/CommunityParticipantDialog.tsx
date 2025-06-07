
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircle, Phone } from "lucide-react";

interface CommunityParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CommunityParticipantDialog = ({ open, onOpenChange, onSuccess }: CommunityParticipantDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    experience_level: "",
    location: "",
    interests: [] as string[],
    bio: ""
  });

  const experienceLevels = [
    "Beginner",
    "Intermediate", 
    "Advanced",
    "Expert"
  ];

  const interestOptions = [
    "Vegetable Gardening",
    "Flower Gardening",
    "Indoor Plants",
    "Hydroponic Systems",
    "Organic Farming",
    "Pest Control",
    "Soil Management",
    "Smart Gardening/IoT"
  ];

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
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
          email: formData.email,
          phone: formData.phone,
          experience_level: formData.experience_level,
          location: formData.location,
          interests: formData.interests,
          bio: formData.bio
        });

      if (error) throw error;

      toast({
        title: "Welcome to the community!",
        description: "Your details have been saved. Redirecting to WhatsApp...",
      });

      // Redirect to the correct WhatsApp number: 8090193598
      setTimeout(() => {
        const whatsappMessage = encodeURIComponent(`Hi! I'm ${formData.name} and I'd like to join the gardening community discussion. I'm a ${formData.experience_level} level gardener from ${formData.location}.`);
        window.open(`https://wa.me/+918090193598?text=${whatsappMessage}`, '_blank');
        onSuccess();
        onOpenChange(false);
      }, 2000);

    } catch (error) {
      console.error('Error saving participant details:', error);
      toast({
        title: "Error",
        description: "Failed to save your details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Join Our Community
          </DialogTitle>
          <DialogDescription>
            Please share your details to connect with fellow gardeners
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+91 XXXXX XXXXX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Experience Level *</Label>
            <Select value={formData.experience_level} onValueChange={(value) => setFormData(prev => ({ ...prev, experience_level: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select your gardening experience" />
              </SelectTrigger>
              <SelectContent>
                {experienceLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="City, State"
            />
          </div>

          <div className="space-y-2">
            <Label>Interests (select multiple)</Label>
            <div className="grid grid-cols-2 gap-2">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`p-2 text-xs rounded border transition-colors ${
                    formData.interests.includes(interest)
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Tell us about yourself</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Share your gardening goals, challenges, or anything else..."
              rows={3}
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h4 className="font-semibold text-green-800 mb-1 flex items-center gap-1">
              <Phone className="h-4 w-4" />
              What happens next?
            </h4>
            <p className="text-sm text-green-700">
              After submitting, you'll be redirected to WhatsApp to join our gardening community chat where you can connect with fellow gardeners!
            </p>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white">
            {isSubmitting ? "Joining Community..." : "Join Community & Open WhatsApp"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CommunityParticipantDialog;
