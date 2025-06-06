
import { useState } from "react";
import { MessageSquare, Users, TrendingUp, Clock, ArrowRight, Sprout, Leaf, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScrollableDiscussionForm from "./ScrollableDiscussionForm";
import CommunityParticipantDialog from "./CommunityParticipantDialog";

interface CommunityTabProps {
  searchQuery: string;
}

const CommunityTab = ({ searchQuery }: CommunityTabProps) => {
  const [showForm, setShowForm] = useState(false);
  const [showParticipantDialog, setShowParticipantDialog] = useState(false);

  // Enhanced mock data with urban gardening focus
  const discussions = [
    {
      id: 1,
      title: "Best vegetables for small balcony containers?",
      author: "UrbanGardener_Maya",
      category: "Container Gardening",
      replies: 18,
      views: 145,
      timeAgo: "2 hours ago",
      isHot: true,
      excerpt: "Looking for advice on which vegetables work best in small containers on a city balcony..."
    },
    {
      id: 2,
      title: "DIY vertical garden systems - share your builds!",
      author: "CityGreenThumb",
      category: "Vertical Gardening", 
      replies: 23,
      views: 189,
      timeAgo: "5 hours ago",
      isHot: true,
      excerpt: "Let's share our vertical garden setups and help each other maximize growing space..."
    },
    {
      id: 3,
      title: "Dealing with limited sunlight in urban spaces",
      author: "ShadowGardener",
      category: "Light Solutions",
      replies: 12,
      views: 98,
      timeAgo: "1 day ago",
      isHot: false,
      excerpt: "My apartment only gets 3-4 hours of direct sunlight. What grows well in low light?"
    },
    {
      id: 4,
      title: "Community garden organization tips",
      author: "NeighborhoodGreen",
      category: "Community Gardens",
      replies: 31,
      views: 267,
      timeAgo: "2 days ago",
      isHot: true,
      excerpt: "Starting a community garden in my neighborhood. Looking for organizational advice..."
    }
  ];

  const communityStats = [
    { label: "Urban Gardeners", value: "2,847", icon: Users, color: "text-blue-600" },
    { label: "Active Discussions", value: "1,234", icon: MessageSquare, color: "text-green-600" },
    { label: "Problems Solved", value: "5,678", icon: TrendingUp, color: "text-purple-600" }
  ];

  const featuredTopics = [
    { name: "Container Gardening", icon: Sprout, count: 156, color: "bg-green-100 text-green-700" },
    { name: "Vertical Gardens", icon: Leaf, count: 89, color: "bg-emerald-100 text-emerald-700" },
    { name: "Urban Composting", icon: Sun, count: 67, color: "bg-yellow-100 text-yellow-700" }
  ];

  const handleDiscussionSubmit = (data: any) => {
    console.log("New discussion:", data);
    setShowForm(false);
    // Here you would typically submit to your backend
  };

  const handleJoinDiscussion = () => {
    setShowParticipantDialog(true);
  };

  const handleNewDiscussion = () => {
    setShowParticipantDialog(true);
  };

  const filteredDiscussions = discussions.filter(discussion => 
    !searchQuery || 
    discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    discussion.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    discussion.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Community Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        {communityStats.map((stat, index) => (
          <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">Active this month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Featured Topics */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Trending Urban Gardening Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {featuredTopics.map((topic, index) => (
              <div key={index} className={`p-4 rounded-lg ${topic.color} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <topic.icon className="h-5 w-5" />
                  <span className="font-medium">{topic.name}</span>
                </div>
                <Badge variant="secondary">{topic.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Community Tabs */}
      <Tabs defaultValue="discussions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="discussions">Recent Discussions</TabsTrigger>
          <TabsTrigger value="start-discussion">Start Discussion</TabsTrigger>
        </TabsList>

        <TabsContent value="discussions" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Community Discussions</h2>
              <Button 
                onClick={handleNewDiscussion}
                className="bg-green-600 hover:bg-green-700 shadow-lg"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Discussion
              </Button>
            </div>

            <div className="space-y-4">
              {filteredDiscussions.map((discussion) => (
                <Card key={discussion.id} className="hover:shadow-lg transition-all cursor-pointer bg-white/80 backdrop-blur-sm border border-green-100 hover:border-green-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg hover:text-green-600 transition-colors">
                            {discussion.title}
                          </CardTitle>
                          {discussion.isHot && (
                            <Badge className="bg-orange-500 text-white text-xs">🔥 Hot</Badge>
                          )}
                        </div>
                        <CardDescription className="text-gray-700">
                          {discussion.excerpt}
                        </CardDescription>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {discussion.author}
                          </span>
                          <Badge variant="outline" className="text-xs">{discussion.category}</Badge>
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
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {discussion.replies} replies
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {discussion.views} views
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleJoinDiscussion} className="hover:bg-green-50">
                        Join Discussion <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredDiscussions.length === 0 && searchQuery && (
              <Card className="p-8 text-center bg-white/80 backdrop-blur-sm">
                <div className="text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No discussions found</h3>
                  <p>Try adjusting your search terms or start a new discussion!</p>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="start-discussion" className="mt-6">
          <ScrollableDiscussionForm 
            onSubmit={handleDiscussionSubmit}
            isLoading={false}
          />
        </TabsContent>
      </Tabs>

      <CommunityParticipantDialog
        open={showParticipantDialog}
        onOpenChange={setShowParticipantDialog}
        onSuccess={() => {
          console.log("Participant joined successfully");
        }}
      />
    </div>
  );
};

export default CommunityTab;
