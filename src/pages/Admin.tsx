
import React from "react";
import { Users, Package, FileText, Video, MessageSquare, BarChart3, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminProvider, useAdmin } from "@/contexts/AdminContext";
import NavBar from "@/components/NavBar";
import AdminSecretLogin from "@/components/admin/AdminSecretLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminBlogs from "@/components/admin/AdminBlogs";
import AdminWebinars from "@/components/admin/AdminWebinars";
import AdminCommunity from "@/components/admin/AdminCommunity";
import ProductsCRUD from "@/components/admin/crud/ProductsCRUD";

const AdminContent: React.FC = () => {
  const { isAdminAuthenticated, loading, validateAdminSecret, signOutAdmin } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-lg">Loading admin panel...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <AdminSecretLogin onSubmit={validateAdminSecret} loading={loading} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Complete system management with secret code access</p>
          </div>
          <Button
            onClick={signOutAdmin}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:grid-cols-none lg:inline-flex">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Products</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
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

          <TabsContent value="products">
            <ProductsCRUD />
          </TabsContent>

          <TabsContent value="orders">
            <AdminOrders />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsers />
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

const Admin: React.FC = () => {
  return (
    <AdminProvider>
      <AdminContent />
    </AdminProvider>
  );
};

export default Admin;
