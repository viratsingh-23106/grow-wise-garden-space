
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, FileText, Video, MessageSquare, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingBlogs: number;
  totalWebinars: number;
  activeCommunity: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingBlogs: 0,
    totalWebinars: 0,
    activeCommunity: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total users
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Get total orders and revenue
        const { data: orders } = await supabase
          .from('orders')
          .select('total_amount');

        // Get pending blogs
        const { count: pendingBlogsCount } = await supabase
          .from('blog_posts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Get total webinars
        const { count: webinarsCount } = await supabase
          .from('webinars')
          .select('*', { count: 'exact', head: true });

        // Get active community discussions
        const { count: communityCount } = await supabase
          .from('community_discussions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

        setStats({
          totalUsers: usersCount || 0,
          totalOrders: orders?.length || 0,
          totalRevenue,
          pendingBlogs: pendingBlogsCount || 0,
          totalWebinars: webinarsCount || 0,
          activeCommunity: communityCount || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Set up real-time subscriptions for stats updates
    const ordersChannel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchStats)
      .subscribe();

    const blogsChannel = supabase
      .channel('blogs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(blogsChannel);
    };
  }, []);

  if (loading) {
    return <div className="text-center p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Blogs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingBlogs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Webinars</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWebinars}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Discussions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCommunity}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
