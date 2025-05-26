
import { ArrowRight, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";

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

const Guidance = () => {
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Guidance & Learning
          </h1>
          <p className="text-xl text-gray-600">
            Step-by-step guidance for successful gardening with IoT-powered insights
          </p>
        </div>

        {/* Current Month Section */}
        <div className="mb-12">
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

        {/* Guidance Categories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Learning Categories
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {guidanceCategories.map((category, index) => (
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

        {/* Monthly Calendar */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Year-Round Gardening Calendar
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthlyTips.map((tip, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{tip.month}</CardTitle>
                    {tip.month === currentMonth && (
                      <Badge className="bg-green-600 text-white">Current</Badge>
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    {tip.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full border-green-600 text-green-600 hover:bg-green-50">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guidance;
