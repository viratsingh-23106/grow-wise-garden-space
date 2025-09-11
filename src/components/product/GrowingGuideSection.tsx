
import { useState } from "react";
import { CheckCircle, Clock, FileText, Play, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GrowingGuideSectionProps {
  productId: string;
  growthGuide: any;
}

const GrowingGuideSection = ({ productId, growthGuide }: GrowingGuideSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  // Fetch guide steps
  const { data: guideSteps } = useQuery({
    queryKey: ['guide-steps', growthGuide?.id],
    queryFn: async () => {
      if (!growthGuide?.id) return [];
      
      const { data, error } = await supabase
        .from('guide_steps')
        .select('*')
        .eq('guide_id', growthGuide.id)
        .order('step_number');
      
      if (error) throw error;
      return data;
    },
    enabled: !!growthGuide?.id,
  });

  const { data: userProgress } = useQuery({
    queryKey: ['userProgress', productId, user?.id],
    queryFn: async () => {
      if (!user || !growthGuide) return null;
      
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('guide_id', growthGuide.id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!growthGuide,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ stepNumber, isCompleted }: { stepNumber: number; isCompleted: boolean }) => {
      if (!user || !growthGuide) {
        console.log('Missing user or growthGuide for mutation:', { user: !!user, growthGuide: !!growthGuide });
        return;
      }

      const completedSteps = isCompleted 
        ? Math.max(stepNumber, userProgress?.completed_steps || 0)
        : Math.min(stepNumber - 1, userProgress?.completed_steps || 0);

      console.log('Updating progress:', {
        guide_id: growthGuide.id,
        user_id: user.id,
        completed_steps: completedSteps,
        is_completed: completedSteps >= (guideSteps?.length || 0)
      });

      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          guide_id: growthGuide.id,
          user_id: user.id,
          completed_steps: completedSteps,
          is_completed: completedSteps >= (guideSteps?.length || 0),
          last_accessed: new Date().toISOString(),
        }, {
          onConflict: 'guide_id,user_id'
        })
        .select();

      if (error) {
        console.error('Progress update error:', error);
        throw error;
      }
      
      console.log('Progress updated successfully:', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProgress', productId, user?.id] });
    },
    onError: (error) => {
      console.error('Progress mutation failed:', error);
    }
  });

  const handleStepToggle = (stepNumber: number) => {
    if (!user) {
      console.log('No user found for step toggle');
      return;
    }
    
    const isCompleted = (userProgress?.completed_steps || 0) >= stepNumber;
    console.log('Toggling step:', stepNumber, 'Currently completed:', isCompleted);
    updateProgressMutation.mutate({ stepNumber, isCompleted: !isCompleted });
  };

  const progressPercentage = guideSteps?.length 
    ? ((userProgress?.completed_steps || 0) / guideSteps.length) * 100 
    : 0;

  if (!growthGuide) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 rounded-lg p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Growth Guide Available</h3>
          <p className="text-gray-600">Check back soon for detailed growing instructions!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{growthGuide.title}</h2>
        <p className="text-gray-700 mb-4">{growthGuide.description}</p>
        
        {user && userProgress && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Your Progress</span>
              <span className="text-sm text-gray-600">
                {userProgress.completed_steps || 0} of {guideSteps?.length || 0} steps
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {guideSteps?.map((step: any, index: number) => {
          const isCompleted = user && (userProgress?.completed_steps || 0) >= step.step_number;
          const isExpanded = expandedStep === step.step_number;
          
          return (
            <div 
              key={step.id} 
              className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
              } ${isExpanded ? 'shadow-lg' : 'shadow-sm'}`}
            >
              <div 
                className="p-6 cursor-pointer"
                onClick={() => setExpandedStep(isExpanded ? null : step.step_number)}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : step.step_number}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                      {step.estimated_duration && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {step.estimated_duration}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3">{step.description}</p>
                    
                    {user && (
                      <Button
                        size="sm"
                        variant={isCompleted ? "outline" : "default"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStepToggle(step.step_number);
                        }}
                        className={`${isCompleted ? 'border-green-500 text-green-600' : 'bg-green-600 hover:bg-green-700'}`}
                      >
                        {isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {isExpanded && (step.video_url || step.document_url) && (
                <div className="border-t bg-gray-50 p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {step.video_url && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          Video Guide
                        </h4>
                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                          <iframe 
                            className="w-full h-full"
                            src={step.video_url}
                            title={`${step.title} - Video Guide`}
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                    
                    {step.document_url && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Documentation
                        </h4>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => window.open(step.document_url, '_blank')}
                        >
                          View Documentation
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GrowingGuideSection;
