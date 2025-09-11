
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/contexts/AdminContext';
import { toast } from 'sonner';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  role: string;
  subscribed: boolean;
  subscription_tier: string;
  subscription_end: string;
}

export interface AdminOrder {
  id: string;
  user_id: string;
  user_email: string;
  total_amount: number;
  items_count: number;
  status: string;
  shipping_address: any;
  created_at: string;
}

export interface AdminBlog {
  id: string;
  title: string;
  content: string;
  status: string;
  author_id: string;
  author_email: string;
  created_at: string;
  updated_at: string;
  published_at: string;
}

export interface AdminWebinar {
  id: string;
  title: string;
  description: string;
  host_name: string;
  scheduled_date: string;
  duration_minutes: number;
  max_participants: number;
  status: string;
  zoom_meeting_link: string;
  recording_url: string;
  created_at: string;
  updated_at: string;
}

export interface AdminDiscussion {
  id: string;
  title: string;
  content: string;
  status: string;
  author_id: string;
  author_email: string;
  created_at: string;
  updated_at: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  type: string;
  price: number;
  stock_quantity: number;
  description: string;
  image_url: string;
  sensors: string[];
  created_at: string;
  updated_at: string;
}

export interface DashboardCounts {
  total_users: number;
  total_orders: number;
  total_revenue: number;
  pending_blogs: number;
  total_webinars: number;
  active_discussions: number;
}

export const useAdminData = () => {
  const { adminSessionToken } = useAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [webinars, setWebinars] = useState<AdminWebinar[]>([]);
  const [discussions, setDiscussions] = useState<AdminDiscussion[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [dashboardCounts, setDashboardCounts] = useState<DashboardCounts>({
    total_users: 0,
    total_orders: 0,
    total_revenue: 0,
    pending_blogs: 0,
    total_webinars: 0,
    active_discussions: 0,
  });
  const [loading, setLoading] = useState(false);

  // Fetch functions using secure admin RPCs
  const fetchUsers = async () => {
    if (!adminSessionToken) return;
    
    try {
      const { data, error } = await supabase.rpc('admin_get_users', {
        admin_token: adminSessionToken
      });

      if (error) throw error;
      setUsers((Array.isArray(data) ? data : []) as AdminUser[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const fetchOrders = async () => {
    if (!adminSessionToken) return;
    
    try {
      const { data, error } = await supabase.rpc('admin_get_orders', {
        admin_token: adminSessionToken
      });

      if (error) throw error;
      setOrders((Array.isArray(data) ? data : []) as AdminOrder[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    }
  };

  const fetchProducts = async () => {
    if (!adminSessionToken) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const fetchBlogs = async () => {
    if (!adminSessionToken) return;
    
    try {
      const { data, error } = await supabase.rpc('admin_list_blogs', {
        admin_token: adminSessionToken
      });

      if (error) throw error;
      setBlogs((Array.isArray(data) ? data : []) as AdminBlog[]);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error('Failed to fetch blogs');
    }
  };

  const fetchWebinars = async () => {
    if (!adminSessionToken) return;
    
    try {
      const { data, error } = await supabase.rpc('admin_list_webinars', {
        admin_token: adminSessionToken
      });

      if (error) throw error;
      setWebinars((Array.isArray(data) ? data : []) as AdminWebinar[]);
    } catch (error) {
      console.error('Error fetching webinars:', error);
      toast.error('Failed to fetch webinars');
    }
  };

  const fetchDiscussions = async () => {
    if (!adminSessionToken) return;
    
    try {
      const { data, error } = await supabase.rpc('admin_list_discussions', {
        admin_token: adminSessionToken
      });

      if (error) throw error;
      setDiscussions((Array.isArray(data) ? data : []) as AdminDiscussion[]);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      toast.error('Failed to fetch discussions');
    }
  };

  const fetchDashboardCounts = async () => {
    if (!adminSessionToken) return;
    
    try {
      const { data, error } = await supabase.rpc('admin_get_dashboard_counts', {
        admin_token: adminSessionToken
      });

      if (error) throw error;
      const counts = Array.isArray(data) && data.length > 0 ? data[0] : null;
      if (counts) {
        setDashboardCounts({
          total_users: Number(counts.total_users || 0),
          total_orders: Number(counts.total_orders || 0),
          total_revenue: Number(counts.total_revenue || 0),
          pending_blogs: Number(counts.pending_blogs || 0),
          total_webinars: Number(counts.total_webinars || 0),
          active_discussions: Number(counts.active_discussions || 0),
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard counts:', error);
      toast.error('Failed to fetch dashboard statistics');
    }
  };

  // Action functions
  const makeUserAdmin = async (userId: string) => {
    if (!adminSessionToken) return;
    
    try {
      const { error } = await supabase.rpc('admin_make_user_admin', {
        admin_token: adminSessionToken,
        target_user_id: userId
      });
      
      if (error) throw error;
      toast.success('User promoted to admin successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error making user admin:', error);
      toast.error('Failed to make user admin');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!adminSessionToken) return;
    
    try {
      const { error } = await supabase.rpc('admin_update_order_status', {
        admin_token: adminSessionToken,
        p_order_id: orderId,
        p_status: newStatus
      });
      
      if (error) throw error;
      toast.success('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const upsertProduct = async (productData: {
    name: string;
    type: string;
    price: number;
    stock_quantity?: number;
    description?: string;
    image_url?: string;
    sensors?: string[];
  }, productId?: string) => {
    if (!adminSessionToken) return;
    
    try {
      const { data, error } = await supabase.rpc('admin_upsert_product', {
        admin_token: adminSessionToken,
        p_name: productData.name,
        p_type: productData.type,
        p_price: productData.price,
        p_stock_quantity: productData.stock_quantity || 0,
        p_description: productData.description,
        p_image_url: productData.image_url,
        p_sensors: productData.sensors || [],
        p_id: productId || null
      });
      
      if (error) throw error;
      toast.success(productId ? 'Product updated successfully' : 'Product created successfully');
      fetchProducts();
      return data;
    } catch (error) {
      console.error('Error upserting product:', error);
      toast.error('Failed to save product');
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!adminSessionToken) return;
    
    try {
      const { error } = await supabase.rpc('admin_delete_product', {
        admin_token: adminSessionToken,
        p_id: productId
      });
      
      if (error) throw error;
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
      toast.error(`Delete failed: ${errorMessage}`);
    }
  };

  const updateBlogStatus = async (blogId: string, newStatus: string) => {
    if (!adminSessionToken) return;
    
    try {
      const { error } = await supabase.rpc('admin_set_blog_status', {
        admin_token: adminSessionToken,
        blog_id: blogId,
        new_status: newStatus
      });
      
      if (error) throw error;
      toast.success('Blog status updated successfully');
      fetchBlogs();
    } catch (error) {
      console.error('Error updating blog status:', error);
      toast.error('Failed to update blog status');
    }
  };

  const upsertBlog = async (title: string, content: string, status: string, blogId?: string) => {
    if (!adminSessionToken) return;
    
    try {
      const { data, error } = await supabase.rpc('admin_upsert_blog', {
        admin_token: adminSessionToken,
        blog_title: title,
        blog_content: content,
        blog_status: status,
        blog_id: blogId || null
      });
      
      if (error) throw error;
      toast.success(blogId ? 'Blog updated successfully' : 'Blog created successfully');
      fetchBlogs();
      return data;
    } catch (error) {
      console.error('Error upserting blog:', error);
      toast.error('Failed to save blog');
    }
  };

  const deleteBlog = async (blogId: string) => {
    if (!adminSessionToken) return;
    
    try {
      const { error } = await supabase.rpc('admin_delete_blog', {
        admin_token: adminSessionToken,
        blog_id: blogId
      });
      
      if (error) throw error;
      toast.success('Blog deleted successfully');
      fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog');
    }
  };

  const upsertWebinar = async (
    title: string,
    description: string,
    hostName: string,
    scheduledDate: string,
    status: string = 'upcoming',
    durationMinutes: number = 60,
    maxParticipants: number = 100,
    zoomLink?: string,
    recordingUrl?: string,
    webinarId?: string
  ) => {
    if (!adminSessionToken) return;
    
    try {
      const { data, error } = await supabase.rpc('admin_upsert_webinar', {
        admin_token: adminSessionToken,
        webinar_title: title,
        webinar_description: description,
        webinar_host_name: hostName,
        webinar_scheduled_date: scheduledDate,
        webinar_status: status,
        webinar_duration_minutes: durationMinutes,
        webinar_max_participants: maxParticipants,
        webinar_zoom_link: zoomLink,
        webinar_recording_url: recordingUrl,
        webinar_id: webinarId || null
      });
      
      if (error) throw error;
      toast.success(webinarId ? 'Webinar updated successfully' : 'Webinar created successfully');
      fetchWebinars();
      return data;
    } catch (error) {
      console.error('Error upserting webinar:', error);
      toast.error('Failed to save webinar');
    }
  };

  const deleteWebinar = async (webinarId: string) => {
    if (!adminSessionToken) return;
    
    try {
      const { error } = await supabase.rpc('admin_delete_webinar', {
        admin_token: adminSessionToken,
        webinar_id: webinarId
      });
      
      if (error) throw error;
      toast.success('Webinar deleted successfully');
      fetchWebinars();
    } catch (error) {
      console.error('Error deleting webinar:', error);
      toast.error('Failed to delete webinar');
    }
  };

  const updateDiscussionStatus = async (discussionId: string, newStatus: string) => {
    if (!adminSessionToken) return;
    
    try {
      const { error } = await supabase.rpc('admin_update_discussion_status', {
        admin_token: adminSessionToken,
        discussion_id: discussionId,
        new_status: newStatus
      });
      
      if (error) throw error;
      toast.success('Discussion status updated successfully');
      fetchDiscussions();
    } catch (error) {
      console.error('Error updating discussion status:', error);
      toast.error('Failed to update discussion status');
    }
  };

  const deleteDiscussion = async (discussionId: string) => {
    if (!adminSessionToken) return;
    
    try {
      const { error } = await supabase.rpc('admin_delete_discussion', {
        admin_token: adminSessionToken,
        discussion_id: discussionId
      });
      
      if (error) throw error;
      toast.success('Discussion deleted successfully');
      fetchDiscussions();
    } catch (error) {
      console.error('Error deleting discussion:', error);
      toast.error('Failed to delete discussion');
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!adminSessionToken) return;

    const ordersChannel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();

    const blogsChannel = supabase
      .channel('admin-blogs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, fetchBlogs)
      .subscribe();

    const webinarsChannel = supabase
      .channel('admin-webinars')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'webinars' }, fetchWebinars)
      .subscribe();

    const discussionsChannel = supabase
      .channel('admin-discussions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_discussions' }, fetchDiscussions)
      .subscribe();

    const productsChannel = supabase
      .channel('admin-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .subscribe();

    const rolesChannel = supabase
      .channel('admin-roles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, fetchUsers)
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(blogsChannel);
      supabase.removeChannel(webinarsChannel);
      supabase.removeChannel(discussionsChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(rolesChannel);
    };
  }, [adminSessionToken]);

  // Initial data fetch
  useEffect(() => {
    if (adminSessionToken) {
      setLoading(true);
      Promise.all([
        fetchUsers(),
        fetchOrders(),
        fetchProducts(),
        fetchBlogs(),
        fetchWebinars(),
        fetchDiscussions(),
        fetchDashboardCounts(),
      ]).finally(() => setLoading(false));
    }
  }, [adminSessionToken]);

  return {
    // Data
    users,
    orders,
    blogs,
    webinars,
    discussions,
    products,
    dashboardCounts,
    loading,
    
    // Fetch functions
    fetchUsers,
    fetchOrders,
    fetchProducts,
    fetchBlogs,
    fetchWebinars,
    fetchDiscussions,
    fetchDashboardCounts,
    
    // Action functions
    makeUserAdmin,
    updateOrderStatus,
    upsertProduct,
    deleteProduct,
    updateBlogStatus,
    upsertBlog,
    deleteBlog,
    upsertWebinar,
    deleteWebinar,
    updateDiscussionStatus,
    deleteDiscussion,
  };
};
