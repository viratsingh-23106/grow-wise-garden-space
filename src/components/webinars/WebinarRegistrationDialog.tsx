
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, Users, Video } from "lucide-react";
import { format } from "date-fns";

interface WebinarRegistrationDialogProps {
  webinar: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const WebinarRegistrationDialog = ({ webinar, open, onOpenChange, onSuccess }: WebinarRegistrationDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    participant_name: "",
    participant_email: "",
    participant_phone: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('webinar_registrations')
        .insert({
          webinar_id: webinar.id,
          user_id: user?.id || null,
          participant_name: formData.participant_name,
          participant_email: formData.participant_email,
          participant_phone: formData.participant_phone
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Registered",
            description: "You are already registered for this webinar. Check your email for details.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Registration Successful!",
        description: `You're registered for "${webinar.title}". Check your email for the Zoom link.`,
      });

      // Reset form and close dialog
      setFormData({ participant_name: "", participant_email: "", participant_phone: "" });
      onSuccess();

    } catch (error) {
      console.error('Error registering for webinar:', error);
      toast({
        title: "Registration Failed",
        description: "There was an error registering for the webinar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Register for Webinar</DialogTitle>
          <DialogDescription>
            Sign up for "{webinar?.title}"
          </DialogDescription>
        </DialogHeader>

        {webinar && (
          <div className="space-y-6">
            {/* Webinar Details */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-green-800">{webinar.title}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(webinar.scheduled_date), 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(webinar.scheduled_date), 'HH:mm')}
                </div>
                <div className="flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  {webinar.duration_minutes} minutes
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Host: {webinar.host_name}
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="participant_name">Full Name *</Label>
                <Input
                  id="participant_name"
                  value={formData.participant_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, participant_name: e.target.value }))}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="participant_email">Email Address *</Label>
                <Input
                  id="participant_email"
                  type="email"
                  value={formData.participant_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, participant_email: e.target.value }))}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="participant_phone">Phone Number</Label>
                <Input
                  id="participant_phone"
                  type="tel"
                  value={formData.participant_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, participant_phone: e.target.value }))}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  After registration, you'll receive a confirmation email with the Zoom meeting link and calendar invite.
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? "Registering..." : "Register"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WebinarRegistrationDialog;
