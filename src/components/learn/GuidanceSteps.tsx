
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle, Clock, PlayCircle, FileText } from "lucide-react";
import NavBar from "@/components/NavBar";

const GuidanceSteps = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  const { data: guide } = useQuery({
    queryKey: ['growth-guide', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('growth_guides')
        .select(`
          *,
          guide_steps(*)
        `)
        .eq('id', categoryId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!categoryId
  });

  const { data: userProgress, refetch } = useQuery({
    queryKey: ['user-progress', user?.id, categoryId],
    queryFn: async () => {
      if (!user || !categoryId) return null;
      
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('guide_id', categoryId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!categoryId
  });

  const markStepComplete = async () => {
    if (!user || !categoryId) return;

    const newCompletedSteps = Math.max(currentStep, userProgress?.completed_steps || 0);
    const isCompleted = newCompletedSteps >= (guide?.total_steps || 0);

    if (userProgress) {
      await supabase
        .from('user_progress')
        .update({
          completed_steps: newCompletedSteps,
          is_completed: isCompleted,
          last_accessed: new Date().toISOString()
        })
        .eq('id', userProgress.id);
    } else {
      await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          guide_id: categoryId,
          completed_steps: newCompletedSteps,
          is_completed: isCompleted,
          last_accessed: new Date().toISOString()
        });
    }

    refetch();
  };

  if (!guide || !guide.guide_steps) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <NavBar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Guide not found</h1>
            <Button onClick={() => navigate('/learn')} className="bg-green-600 hover:bg-green-700">
              Back to Learn
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const sortedSteps = guide.guide_steps.sort((a: any, b: any) => a.step_number - b.step_number);
  const currentStepData = sortedSteps[currentStep - 1];
  const progressPercentage = ((userProgress?.completed_steps || 0) / (guide.total_steps || 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <NavBar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/learn')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Learn
          </Button>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{guide.title}</h1>
          <p className="text-xl text-gray-600 mb-6">{guide.description}</p>
          
          {/* Progress */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-600">
                {userProgress?.completed_steps || 0} of {guide.total_steps} steps completed
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        {/* Step Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-2">
            {sortedSteps.map((step: any, index: number) => (
              <Button
                key={step.id}
                variant={currentStep === index + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentStep(index + 1)}
                className={`relative ${
                  (userProgress?.completed_steps || 0) > index 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : ""
                }`}
              >
                {(userProgress?.completed_steps || 0) > index && (
                  <CheckCircle className="h-4 w-4 mr-1" />
                )}
                {index + 1}
              </Button>
            ))}
          </div>
          
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Step {currentStep} of {guide.total_steps}
          </Badge>
        </div>

        {/* Current Step Content */}
        {currentStepData && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
              {currentStepData.estimated_duration && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{currentStepData.estimated_duration}</span>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="space-y-6">
              {currentStepData.description && (
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {currentStepData.description}
                  </p>
                </div>
              )}

              {/* Video */}
              {currentStepData.video_url && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    Video Tutorial
                  </h4>
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <a 
                      href={currentStepData.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 underline"
                    >
                      Watch Video Tutorial
                    </a>
                  </div>
                </div>
              )}

              {/* Document */}
              {currentStepData.document_url && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Additional Resources
                  </h4>
                  <a 
                    href={currentStepData.document_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 underline"
                  >
                    Download Guide (PDF)
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation and Actions */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="space-x-4">
            {user && (userProgress?.completed_steps || 0) < currentStep && (
              <Button 
                onClick={markStepComplete}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}

            <Button 
              onClick={() => setCurrentStep(Math.min(guide.total_steps, currentStep + 1))}
              disabled={currentStep === guide.total_steps}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidanceSteps;
