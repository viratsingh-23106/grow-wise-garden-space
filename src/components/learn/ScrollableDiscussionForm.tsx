
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";

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

  const categories = [
    "General Discussion",
    "Plant Care",
    "Pest Control",
    "Soil & Fertilizer",
    "Tools & Equipment",
    "Harvesting",
    "Seasonal Tips",
    "Beginner Questions"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ title: "", content: "", category: "" });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Start a New Discussion
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Discussion Title</Label>
              <Input
                id="title"
                placeholder="What would you like to discuss?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
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
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Share your thoughts, ask questions, or start a conversation..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                required
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Discussion Guidelines</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Be respectful and constructive in your discussions</p>
                <p>• Search existing discussions before creating a new one</p>
                <p>• Use clear, descriptive titles</p>
                <p>• Include relevant details and context</p>
                <p>• Add photos if they help illustrate your point</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Popular Topics</h4>
              <div className="flex flex-wrap gap-2">
                {["Tomato Growing", "Pest Control", "Soil Health", "Watering Tips", "Harvest Time"].map((topic) => (
                  <Button
                    key={topic}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, title: formData.title + (formData.title ? " " : "") + topic })}
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? "Creating Discussion..." : "Start Discussion"}
            </Button>
          </form>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ScrollableDiscussionForm;
