
import { useState } from "react";
import { MessageSquare, Users, PlusCircle, Calendar, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import CommunityParticipantForm from "@/components/learn/CommunityParticipantForm";
import DiscussionForm from "@/components/learn/DiscussionForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CommunityTabProps {
  searchQuery: string;
}

const CommunityTab = ({ searchQuery }: CommunityTabProps) => {
  const { user } = useAuth();
  const [isParticipantFormOpen, setIsParticipantFormOpen] = useState(false);
  const [isDiscussionFormOpen, setIsDiscussionFormOpen] = useState(false);

  const { data: discussions, refetch } = useQuery({
    queryKey: ['community-discussions', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('community_discussions')
        .select(`
          *,
          discussion_categories(name),
          profiles(full_name),
          discussion_replies(count)
        `)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['discussion-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discussion_categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: participant } = useQuery({
    queryKey: ['community-participant', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('community_participants')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleParticipantSuccess = () => {
    setIsParticipantFormOpen(false);
    // Refetch participant data
  };

  const handleDiscussionSuccess = () => {
    setIsDiscussionFormOpen(false);
    refetch();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Community</h2>
          <p className="text-gray-600">
            Connect with fellow gardeners, share experiences, and get help
          </p>
        </div>
        
        {user && (
          <div className="flex gap-2">
            {!participant ? (
              <Dialog open={isParticipantFormOpen} onOpenChange={setIsParticipantFormOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Users className="mr-2 h-4 w-4" />
                    Join Community
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Join the Community</DialogTitle>
                  </DialogHeader>
                  <CommunityParticipantForm onSuccess={handleParticipantSuccess} />
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={isDiscussionFormOpen} onOpenChange={setIsDiscussionFormOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Start Discussion
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Start a New Discussion</DialogTitle>
                  </DialogHeader>
                  <DiscussionForm 
                    categories={categories || []}
                    onSuccess={handleDiscussionSuccess}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>

      {/* Categories */}
      {categories && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Discussion Categories</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {category.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Discussions */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Discussions</h3>
        
        <div className="space-y-4">
          {discussions?.map((discussion) => (
            <Card key={discussion.id} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {discussion.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 line-clamp-2">
                      {discussion.content.substring(0, 200)}...
                    </CardDescription>
                  </div>
                  
                  {discussion.discussion_categories && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 ml-4">
                      {discussion.discussion_categories.name}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {discussion.profiles?.full_name || 'Anonymous'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(discussion.created_at)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {discussion.discussion_replies?.length || 0} replies
                  </div>
                </div>
                
                <Button variant="ghost" className="w-full mt-4 text-green-600 hover:text-green-700 hover:bg-green-50">
                  Join Discussion
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {!discussions || discussions.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No discussions yet</h3>
            <p className="text-gray-600 mb-4">
              Be the first to start a conversation in the community!
            </p>
            {user && participant && (
              <Button onClick={() => setIsDiscussionFormOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
                <PlusCircle className="mr-2 h-4 w-4" />
                Start First Discussion
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityTab;
