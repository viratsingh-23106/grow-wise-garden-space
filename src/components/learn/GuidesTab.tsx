
import { useState, useEffect } from "react";
import { Calendar, ArrowRight, User, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface GuidesTabProps {
  searchQuery: string;
}

const GuidesTab = ({ searchQuery }: GuidesTabProps) => {
  const { user } = useAuth();
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  const { data: categories } = useQuery({
    queryKey: ['guidance-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guidance_categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: userProgress } = useQuery({
    queryKey: ['user-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_progress')
        .select('*, growth_guides(*)')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const monthlyTips = [
    {
      month: "January",
      title: "Winter Planning & Preparation",
      description: "Plan your garden layout and order seeds for spring planting",
      tasks: ["Plan garden layout", "Order seeds", "Maintain indoor plants", "Service garden tools"]
    },
    {
      month: "February", 
      title: "Seed Starting Indoors",
      description: "Start seeds indoors for warm-season crops",
      tasks: ["Start tomato seeds", "Begin pepper seedlings", "Prepare seed starting equipment"]
    },
    {
      month: "March",
      title: "Early Spring Preparation",
      description: "Prepare soil and plant cool-season crops",
      tasks: ["Prepare garden beds", "Plant lettuce", "Start herb garden", "Prune fruit trees"]
    }
  ];

  const guidanceCategories = [
    {
      title: "Beginner Basics",
      description: "Essential knowledge for new gardeners",
      stepCount: 12,
      image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500"
    },
    {
      title: "Seasonal Planting",
      description: "When and what to plant throughout the year",
      stepCount: 24,
      image: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=500"
    },
    {
      title: "Pest & Disease Management",
      description: "Identify and treat common garden problems",
      stepCount: 18,
      image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500"
    },
    {
      title: "IoT Integration",
      description: "Setting up and using sensor technology",
      stepCount: 15,
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Current Month Section */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-6 w-6 text-green-600" />
          <h2 className="text-3xl font-bold text-gray-900">
            This Month: {currentMonth}
          </h2>
        </div>
        
        {monthlyTips
          .filter(tip => tip.month === currentMonth)
          .map((tip, index) => (
            <Card key={index} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">{tip.title}</CardTitle>
                <CardDescription className="text-green-100 text-lg">
                  {tip.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-3">Key Tasks This Month:</h4>
                    <ul className="space-y-2">
                      {tip.tasks.map((task, taskIndex) => (
                        <li key={taskIndex} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center justify-center">
                    <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
                      View Detailed Guide <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* User Progress Section */}
      {user && userProgress && userProgress.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Your Learning Progress</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userProgress.slice(0, 3).map((progress) => (
              <Card key={progress.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">{progress.growth_guides?.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {progress.completed_steps}/{progress.growth_guides?.total_steps || 0} steps
                    </Badge>
                    {progress.is_completed && (
                      <Badge className="bg-green-600 text-white">Completed</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full border-green-600 text-green-600 hover:bg-green-50">
                    Continue Learning
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Learning Categories */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Learning Categories
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {guidanceCategories
            .filter(category => 
              !searchQuery || 
              category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              category.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((category, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden cursor-pointer">
              <div className="aspect-square overflow-hidden">
                <img 
                  src={category.image} 
                  alt={category.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {category.title}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {category.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {category.stepCount} steps
                  </Badge>
                </div>
                
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Start Learning <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GuidesTab;
