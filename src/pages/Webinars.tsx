
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Users, Video, ExternalLink, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NavBar from "@/components/NavBar";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import WebinarRegistrationDialog from "@/components/webinars/WebinarRegistrationDialog";

const Webinars = () => {
  const [selectedWebinar, setSelectedWebinar] = useState<any>(null);
  const [showRegistration, setShowRegistration] = useState(false);

  const { data: webinars = [], isLoading } = useQuery({
    queryKey: ['webinars'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webinars')
        .select('*')
        .order('scheduled_date', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const upcomingWebinars = webinars.filter(w => w.status === 'upcoming');
  const completedWebinars = webinars.filter(w => w.status === 'completed');

  const handleRegisterClick = (webinar: any) => {
    setSelectedWebinar(webinar);
    setShowRegistration(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500';
      case 'live': return 'bg-red-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Loading webinars...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Gardening Webinars
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Join expert-led sessions to enhance your gardening knowledge
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Upcoming Webinars
              </CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{upcomingWebinars.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Sessions
              </CardTitle>
              <Video className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{webinars.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Recordings Available
              </CardTitle>
              <Play className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{completedWebinars.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Webinars Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="upcoming">Upcoming Webinars</TabsTrigger>
            <TabsTrigger value="recordings">Past Recordings</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            {upcomingWebinars.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-600">No upcoming webinars at the moment. Check back soon!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {upcomingWebinars.map((webinar) => (
                  <Card key={webinar.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl mb-2">{webinar.title}</CardTitle>
                          <CardDescription className="text-sm text-gray-600">
                            {webinar.description}
                          </CardDescription>
                        </div>
                        <Badge className={`${getStatusColor(webinar.status)} text-white`}>
                          {webinar.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(webinar.scheduled_date), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {format(new Date(webinar.scheduled_date), 'HH:mm')}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Max {webinar.max_participants} participants
                        </div>
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          {webinar.duration_minutes} minutes
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <p className="text-sm text-gray-700 mb-3">
                          <strong>Host:</strong> {webinar.host_name}
                        </p>
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleRegisterClick(webinar)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            Register Now
                          </Button>
                          {webinar.zoom_meeting_link && (
                            <Button 
                              variant="outline"
                              onClick={() => window.open(webinar.zoom_meeting_link, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recordings" className="space-y-6">
            {completedWebinars.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-600">No recordings available yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {completedWebinars.map((webinar) => (
                  <Card key={webinar.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl mb-2">{webinar.title}</CardTitle>
                          <CardDescription className="text-sm text-gray-600">
                            {webinar.description}
                          </CardDescription>
                        </div>
                        <Badge className="bg-gray-500 text-white">
                          Completed
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(webinar.scheduled_date), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {webinar.duration_minutes} minutes
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <p className="text-sm text-gray-700 mb-3">
                          <strong>Host:</strong> {webinar.host_name}
                        </p>
                        
                        {webinar.recording_url ? (
                          <Button 
                            onClick={() => window.open(webinar.recording_url, '_blank')}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Watch Recording
                          </Button>
                        ) : (
                          <Button disabled className="w-full">
                            Recording Not Available
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedWebinar && (
        <WebinarRegistrationDialog
          webinar={selectedWebinar}
          open={showRegistration}
          onOpenChange={setShowRegistration}
          onSuccess={() => {
            setShowRegistration(false);
            setSelectedWebinar(null);
          }}
        />
      )}
    </div>
  );
};

export default Webinars;
