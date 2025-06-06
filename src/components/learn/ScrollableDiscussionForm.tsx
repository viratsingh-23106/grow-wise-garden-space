
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Sprout, Lightbulb } from "lucide-react";

interface ScrollableDiscussionFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

const ScrollableDiscussionForm = ({ onSubmit, isLoading = false }: ScrollableDiscussionFormProps) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: ""
  });

  // Urban gardening specific categories
  const categories = [
    "Container Gardening",
    "Vertical Gardening",
    "Balcony Gardens",
    "Indoor Growing",
    "Hydroponics",
    "Composting",
    "Plant Care",
    "Pest Control",
    "Soil & Fertilizer",
    "Tools & Equipment",
    "Harvesting",
    "Seasonal Tips",
    "Community Gardens",
    "Beginner Questions"
  ];

  // Urban gardening specific popular topics
  const popularTopics = [
    "Small Space Growing",
    "Container Vegetables", 
    "Apartment Herbs",
    "Balcony Setup",
    "LED Grow Lights",
    "Vertical Systems"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ title: "", content: "", category: "" });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white/80 backdrop-blur-sm border border-green-100 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
        <CardTitle className="flex items-center gap-2 text-xl">
          <MessageSquare className="h-6 w-6 text-green-600" />
          Start a New Urban Gardening Discussion
        </CardTitle>
        <p className="text-gray-600 text-sm">
          Share your urban gardening challenges, successes, or questions with the community
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <ScrollArea className="h-[500px] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-medium">Discussion Title</Label>
              <Input
                id="title"
                placeholder="e.g., Best vegetables for 6-inch deep containers?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-12 border-green-200 focus:border-green-400"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-base font-medium">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="h-12 border-green-200 focus:border-green-400">
                  <SelectValue placeholder="Choose the most relevant category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-base font-medium">Description</Label>
              <Textarea
                id="content"
                placeholder="Describe your question, share your experience, or start a conversation. Include details like your growing space, current setup, specific challenges, etc."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                className="border-green-200 focus:border-green-400 resize-none"
                required
              />
            </div>

            <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-800">Tips for Great Discussions</h4>
              </div>
              <div className="text-sm text-blue-700 space-y-2">
                <p>• <strong>Be specific:</strong> Include details about your space, plants, and growing conditions</p>
                <p>• <strong>Add photos:</strong> Visual examples help others understand your situation</p>
                <p>• <strong>Search first:</strong> Check if your question has been discussed recently</p>
                <p>• <strong>Be respectful:</strong> Everyone is learning and sharing their experiences</p>
                <p>• <strong>Follow up:</strong> Update the community on how solutions worked for you</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sprout className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-gray-900">Popular Urban Gardening Topics</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularTopics.map((topic) => (
                  <Button
                    key={topic}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => setFormData({ 
                      ...formData, 
                      title: formData.title + (formData.title ? " " : "") + topic 
                    })}
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-medium shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Discussion...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Start Discussion
                </>
              )}
            </Button>
          </form>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ScrollableDiscussionForm;
