
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Package, FileText, Video, MessageSquare, BarChart3, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import NavBar from "@/components/NavBar";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminBlogs from "@/components/admin/AdminBlogs";
import AdminWebinars from "@/components/admin/AdminWebinars";
import AdminCommunity from "@/components/admin/AdminCommunity";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      console.log('Admin check - Auth loading:', authLoading, 'User:', user?.email);
      
      if (authLoading) {
        console.log('Auth still loading, waiting...');
        return;
      }

      if (!user) {
        console.log('No user found, redirecting to auth');
        toast({
          title: "Authentication Required",
          description: "Please sign in to access the admin panel",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      try {
        console.log('Checking admin role for user:', user.id);
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        console.log('Admin check result:', { data, error });

        if (error) {
          console.error('Error checking admin role:', error);
          toast({
            title: "Error",
            description: "Failed to verify admin access",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        if (data) {
          console.log('User is admin, granting access');
          setIsAdmin(true);
          toast({
            title: "Welcome Admin",
            description: "Admin access granted successfully",
          });
        } else {
          console.log('User is not admin, redirecting to home');
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive",
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Error in admin check:', error);
        toast({
          title: "Error",
          description: "An error occurred while checking admin access",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-lg">Checking admin access...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-lg text-red-600">Access Denied</div>
            <p className="text-gray-600 mt-2">You don't have admin privileges</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage your AeroFarm Pro platform</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-none lg:inline-flex">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="blogs" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Blogs</span>
            </TabsTrigger>
            <TabsTrigger value="webinars" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Webinars</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="orders">
            <AdminOrders />
          </TabsContent>

          <TabsContent value="blogs">
            <AdminBlogs />
          </TabsContent>

          <TabsContent value="webinars">
            <AdminWebinars />
          </TabsContent>

          <TabsContent value="community">
            <AdminCommunity />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
