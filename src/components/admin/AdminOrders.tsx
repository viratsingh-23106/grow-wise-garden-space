
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Eye, Package, Truck, CheckCircle, XCircle, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  shipping_address: any;
  created_at: string;
  updated_at: string;
  user_email?: string;
  items_count?: number;
}

const AdminOrders = () => {
  const { logAdminActivity } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            products (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user emails from auth.users (this requires admin privileges)
      const { data: authUsersResponse } = await supabase.auth.admin.listUsers();
      const authUsers = authUsersResponse?.users || [];

      const ordersWithDetails = ordersData?.map(order => ({
        ...order,
        user_email: authUsers.find((u: any) => u.id === order.user_id)?.email || 'N/A',
        items_count: order.order_items?.length || 0
      })) || [];

      setOrders(ordersWithDetails);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      await logAdminActivity('UPDATE', 'orders', orderId, { status: newStatus });
      
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });

      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'processing':
        return 'default';
      case 'shipped':
        return 'default';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Package className="w-4 h-4" />;
      case 'confirmed':
      case 'processing':
        return <Package className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (loading) {
    return <div className="text-center p-8">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Orders Management</h2>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by order ID or user email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {orderStatuses.map(status => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="grid gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Order #{order.id.slice(-8)}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(order.status)} className="flex items-center gap-1">
                    {getStatusIcon(order.status)}
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{order.user_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-medium">₹{order.total_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Items</p>
                  <p className="font-medium">{order.items_count} items</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {order.shipping_address && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Shipping Address</p>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p>{order.shipping_address.street}</p>
                    <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {orderStatuses
                  .filter(status => status !== order.status)
                  .map(status => (
                    <Button
                      key={status}
                      variant="outline"
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, status)}
                      className="flex items-center gap-1"
                    >
                      {getStatusIcon(status)}
                      Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          No orders found.
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
