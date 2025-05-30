
import { useState } from "react";
import { MessageSquare, Users, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScrollableDiscussionForm from "./ScrollableDiscussionForm";

interface CommunityTabProps {
  searchQuery: string;
}

const CommunityTab = ({ searchQuery }: CommunityTabProps) => {
  const [showForm, setShowForm] = useState(false);

  // Mock data for community features
  const discussions = [
    {
      id: 1,
      title: "Best tomato varieties for beginners?",
      author: "GreenThumb_Sarah",
      category: "Plant Care",
      replies: 12,
      views: 89,
      timeAgo: "2 hours ago",
      isHot: true
    },
    {
      id: 2,
      title: "Dealing with aphids on my pepper plants",
      author: "VeggieGardener",
      category: "Pest Control", 
      replies: 8,
      views: 45,
      timeAgo: "4 hours ago",
      isHot: false
    },
    {
      id: 3,
      title: "When to harvest lettuce for best flavor?",
      author: "FreshSalad",
      category: "Harvesting",
      replies: 15,
      views: 123,
      timeAgo: "1 day ago",
      isHot: true
    }
  ];

  const communityStats = [
    { label: "Active Members", value: "2,847", icon: Users },
    { label: "Discussions", value: "1,234", icon: MessageSquare },
    { label: "Questions Answered", value: "5,678", icon: TrendingUp }
  ];

  const handleDiscussionSubmit = (data: any) => {
    console.log("New discussion:", data);
    setShowForm(false);
    // Here you would typically submit to your backend
  };

  return (
    <div className="space-y-8">
      {/* Community Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        {communityStats.map((stat, index) => (
          <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Community Tabs */}
      <Tabs defaultValue="discussions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="start-discussion">Start Discussion</TabsTrigger>
        </TabsList>

        <TabsContent value="discussions" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Recent Discussions</h2>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                New Discussion
              </Button>
            </div>

            <div className="space-y-4">
              {discussions
                .filter(discussion => 
                  !searchQuery || 
                  discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  discussion.category.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((discussion) => (
                <Card key={discussion.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg hover:text-green-600 transition-colors">
                            {discussion.title}
                          </CardTitle>
                          {discussion.isHot && (
                            <Badge className="bg-orange-500 text-white">Hot</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>by {discussion.author}</span>
                          <Badge variant="outline">{discussion.category}</Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {discussion.timeAgo}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{discussion.replies} replies</span>
                        <span>{discussion.views} views</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        Join Discussion <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="start-discussion" className="mt-6">
          <ScrollableDiscussionForm 
            onSubmit={handleDiscussionSubmit}
            isLoading={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityTab;
