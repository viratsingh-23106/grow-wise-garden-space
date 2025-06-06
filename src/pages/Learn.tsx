
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Sprout, Users, BookOpen, Video } from "lucide-react";
import NavBar from "@/components/NavBar";
import GuidesTab from "@/components/learn/GuidesTab";
import BlogTab from "@/components/learn/BlogTab";
import CommunityTab from "@/components/learn/CommunityTab";
import WebinarsTab from "@/components/learn/WebinarsTab";

const Learn = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("guides");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Header with Urban Gardening Theme */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Sprout className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Urban Garden Hub
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
            Master the art of urban gardening with expert guides, connect with fellow city gardeners, 
            and transform your space into a thriving green oasis
          </p>
          
          {/* Enhanced Search Bar */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search guides, tips, discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg border-2 border-green-200 focus:border-green-400 rounded-xl"
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-green-100">
              <BookOpen className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">50+</div>
              <div className="text-sm text-gray-600">Expert Guides</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-green-100">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">2.8k</div>
              <div className="text-sm text-gray-600">Gardeners</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-green-100">
              <Video className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">20+</div>
              <div className="text-sm text-gray-600">Webinars</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-green-100">
              <Sprout className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">1.2k</div>
              <div className="text-sm text-gray-600">Success Stories</div>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 h-14 bg-white/80 backdrop-blur-sm border border-green-100">
            <TabsTrigger value="guides" className="flex items-center gap-2 text-base font-medium">
              <BookOpen className="h-4 w-4" />
              Guides
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center gap-2 text-base font-medium">
              <Sprout className="h-4 w-4" />
              Blog
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2 text-base font-medium">
              <Users className="h-4 w-4" />
              Community
            </TabsTrigger>
            <TabsTrigger value="webinars" className="flex items-center gap-2 text-base font-medium">
              <Video className="h-4 w-4" />
              Webinars
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guides" className="mt-0">
            <GuidesTab searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="blog" className="mt-0">
            <BlogTab searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="community" className="mt-0">
            <CommunityTab searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="webinars" className="mt-0">
            <WebinarsTab searchQuery={searchQuery} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Learn;
