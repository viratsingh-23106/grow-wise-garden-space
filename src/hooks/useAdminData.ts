import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/contexts/AdminContext';
import { toast } from 'sonner';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  subscription: any;
  role: string;
}

export interface AdminOrder {
  id: string;
  user_id: string;
  user_email: string;
  total_amount: number;
  status: string;
  shipping_address: any;
  created_at: string;
  updated_at: string;
  items_count: number;
}

export interface AdminBlog {
  id: string;
  title: string;
  content: string;
  status: string;
  author_id: string;
  author_email: string;
  created_at: string;
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
  registrations_count: number;
}

export interface AdminDiscussion {
  id: string;
  title: string;
  content: string;
  status: string;
  author_id: string;
  author_email: string;
  created_at: string;
  replies_count: number;
}

export const useAdminData = () => {
  const { adminSessionToken } = useAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [webinars, setWebinars] = useState<AdminWebinar[]>([]);
  const [discussions, setDiscussions] = useState<AdminDiscussion[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all data with admin privileges using service role
  const fetchUsers = async () => {
    if (!adminSessionToken) return;
    
    try {
      // Fetch profiles with subscription and role data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast.error('Failed to fetch user profiles');
        return;
      }

      // Fetch subscribers data
      const { data: subscribersData } = await supabase
        .from('subscribers')
        .select('user_id, subscribed, subscription_tier, subscription_end');

      // Fetch user roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // For admin operations, we'll simulate the admin access for now
      // In production, you would use the admin service role key
      const usersData: AdminUser[] = profilesData.map(profile => {
        const subscription = subscribersData?.find(sub => sub.user_id === profile.id);
        const userRole = rolesData?.find(role => role.user_id === profile.id);

        return {
          id: profile.id,
          email: `user-${profile.id.slice(0, 8)}@example.com`, // Simulated for demo
          full_name: profile.full_name || 'Unknown',
          created_at: profile.created_at,
          subscription: subscription || null,
          role: userRole?.role || 'user'
        };
      });

      setUsers(usersData);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast.error('Failed to fetch users');
    }
  };

  const fetchOrders = async () => {
    if (!adminSessionToken) return;
    
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          total_amount,
          status,
          shipping_address,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to fetch orders');
        return;
      }

      // Get items count for each order
      const ordersWithDetails = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { count } = await supabase
            .from('order_items')
            .select('id', { count: 'exact' })
            .eq('order_id', order.id);

          return {
            ...order,
            user_email: `user-${order.user_id.slice(0, 8)}@example.com`, // Simulated for demo
            items_count: count || 0
          };
        })
      );

      setOrders(ordersWithDetails);
    } catch (error) {
      console.error('Error in fetchOrders:', error);
      toast.error('Failed to fetch orders');
    }
  };

  const fetchBlogs = async () => {
    if (!adminSessionToken) return;
    
    try {
      const { data: blogsData, error } = await supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          content,
          status,
          author_id,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching blogs:', error);
        toast.error('Failed to fetch blogs');
        return;
      }

      const blogsWithAuthors = (blogsData || []).map(blog => ({
        ...blog,
        author_email: `author-${blog.author_id.slice(0, 8)}@example.com` // Simulated for demo
      }));

      setBlogs(blogsWithAuthors);
    } catch (error) {
      console.error('Error in fetchBlogs:', error);
      toast.error('Failed to fetch blogs');
    }
  };

  const fetchWebinars = async () => {
    if (!adminSessionToken) return;
    
    try {
      const { data: webinarsData, error } = await supabase
        .from('webinars')
        .select(`
          id,
          title,
          description,
          host_name,
          scheduled_date,
          duration_minutes,
          max_participants,
          status,
          zoom_meeting_link,
          recording_url,
          created_at
        `)
        .order('scheduled_date', { ascending: false });

      if (error) {
        console.error('Error fetching webinars:', error);
        toast.error('Failed to fetch webinars');
        return;
      }

      // Get registration counts
      const webinarsWithCounts = await Promise.all(
        (webinarsData || []).map(async (webinar) => {
          const { count } = await supabase
            .from('webinar_registrations')
            .select('id', { count: 'exact' })
            .eq('webinar_id', webinar.id);

          return {
            ...webinar,
            registrations_count: count || 0
          };
        })
      );

      setWebinars(webinarsWithCounts);
    } catch (error) {
      console.error('Error in fetchWebinars:', error);
      toast.error('Failed to fetch webinars');
    }
  };

  const fetchDiscussions = async () => {
    if (!adminSessionToken) return;
    
    try {
      const { data: discussionsData, error } = await supabase
        .from('community_discussions')
        .select(`
          id,
          title,
          content,
          status,
          author_id,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching discussions:', error);
        toast.error('Failed to fetch discussions');
        return;
      }

      // Get reply counts
      const discussionsWithCounts = await Promise.all(
        (discussionsData || []).map(async (discussion) => {
          const { count } = await supabase
            .from('discussion_replies')
            .select('id', { count: 'exact' })
            .eq('discussion_id', discussion.id);

          return {
            ...discussion,
            author_email: `author-${discussion.author_id.slice(0, 8)}@example.com`, // Simulated for demo
            replies_count: count || 0
          };
        })
      );

      setDiscussions(discussionsWithCounts);
    } catch (error) {
      console.error('Error in fetchDiscussions:', error);
      toast.error('Failed to fetch discussions');
    }
  };

  // Action functions using direct database access (admin privileges required)
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!adminSessionToken) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) {
        console.error('Error updating order status:', error);
        toast.error('Failed to update order status');
        return;
      }
      
      toast.success('Order status updated successfully');
      fetchOrders(); // Refresh data
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      toast.error('Failed to update order status');
    }
  };

  const updateBlogStatus = async (blogId: string, newStatus: string) => {
    if (!adminSessionToken) return;
    
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      // If approving, set published_at
      if (newStatus === 'published') {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', blogId);
      
      if (error) {
        console.error('Error updating blog status:', error);
        toast.error('Failed to update blog status');
        return;
      }
      
      toast.success('Blog status updated successfully');
      fetchBlogs(); // Refresh data
    } catch (error) {
      console.error('Error in updateBlogStatus:', error);
      toast.error('Failed to update blog status');
    }
  };

  const upsertBlog = async (title: string, content: string, status: string, blogId?: string) => {
    if (!adminSessionToken) return;
    
    try {
      let result;
      
      if (blogId) {
        // Update existing blog
        const { data, error } = await supabase
          .from('blog_posts')
          .update({ 
            title, 
            content, 
            status, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', blogId)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      } else {
        // Create new blog - get first admin user as author
        const { data: adminUser } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin')
          .limit(1)
          .single();

        const { data, error } = await supabase
          .from('blog_posts')
          .insert({ 
            title, 
            content, 
            status, 
            author_id: adminUser?.user_id || '00000000-0000-0000-0000-000000000000'
          })
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      }
      
      toast.success(blogId ? 'Blog updated successfully' : 'Blog created successfully');
      fetchBlogs(); // Refresh data
      return result;
    } catch (error) {
      console.error('Error in upsertBlog:', error);
      toast.error('Failed to save blog');
    }
  };

  const deleteBlog = async (blogId: string) => {
    if (!adminSessionToken) return;
    
    try {
      // Delete blog comments first
      await supabase
        .from('blog_comments')
        .delete()
        .eq('post_id', blogId);
      
      // Delete blog
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', blogId);
      
      if (error) {
        console.error('Error deleting blog:', error);
        toast.error('Failed to delete blog');
        return;
      }
      
      toast.success('Blog deleted successfully');
      fetchBlogs(); // Refresh data
    } catch (error) {
      console.error('Error in deleteBlog:', error);
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
      let result;
      
      if (webinarId) {
        // Update existing webinar
        const { data, error } = await supabase
          .from('webinars')
          .update({
            title,
            description,
            host_name: hostName,
            scheduled_date: scheduledDate,
            duration_minutes: durationMinutes,
            max_participants: maxParticipants,
            status,
            zoom_meeting_link: zoomLink,
            recording_url: recordingUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', webinarId)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      } else {
        // Create new webinar
        const { data, error } = await supabase
          .from('webinars')
          .insert({
            title,
            description,
            host_name: hostName,
            scheduled_date: scheduledDate,
            duration_minutes: durationMinutes,
            max_participants: maxParticipants,
            status,
            zoom_meeting_link: zoomLink,
            recording_url: recordingUrl
          })
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      }
      
      toast.success(webinarId ? 'Webinar updated successfully' : 'Webinar created successfully');
      fetchWebinars(); // Refresh data
      return result;
    } catch (error) {
      console.error('Error in upsertWebinar:', error);
      toast.error('Failed to save webinar');
    }
  };

  const deleteWebinar = async (webinarId: string) => {
    if (!adminSessionToken) return;
    
    try {
      // Delete webinar registrations first
      await supabase
        .from('webinar_registrations')
        .delete()
        .eq('webinar_id', webinarId);
      
      // Delete webinar
      const { error } = await supabase
        .from('webinars')
        .delete()
        .eq('id', webinarId);
      
      if (error) {
        console.error('Error deleting webinar:', error);
        toast.error('Failed to delete webinar');
        return;
      }
      
      toast.success('Webinar deleted successfully');
      fetchWebinars(); // Refresh data
    } catch (error) {
      console.error('Error in deleteWebinar:', error);
      toast.error('Failed to delete webinar');
    }
  };

  const updateDiscussionStatus = async (discussionId: string, newStatus: string) => {
    if (!adminSessionToken) return;
    
    try {
      const { error } = await supabase
        .from('community_discussions')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', discussionId);
      
      if (error) {
        console.error('Error updating discussion status:', error);
        toast.error('Failed to update discussion status');
        return;
      }
      
      toast.success('Discussion status updated successfully');
      fetchDiscussions(); // Refresh data
    } catch (error) {
      console.error('Error in updateDiscussionStatus:', error);
      toast.error('Failed to update discussion status');
    }
  };

  const makeUserAdmin = async (userId: string) => {
    if (!adminSessionToken) return;
    
    try {
      // Insert admin role if it doesn't exist
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' })
        .select();
      
      if (error && !error.message.includes('duplicate')) {
        console.error('Error making user admin:', error);
        toast.error('Failed to make user admin');
        return;
      }
      
      toast.success('User promoted to admin successfully');
      fetchUsers(); // Refresh data
    } catch (error) {
      console.error('Error in makeUserAdmin:', error);
      toast.error('Failed to make user admin');
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!adminSessionToken) return;

    // Set up real-time subscriptions for all admin tables
    const ordersChannel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    const blogsChannel = supabase
      .channel('admin-blogs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, () => {
        fetchBlogs();
      })
      .subscribe();

    const webinarsChannel = supabase
      .channel('admin-webinars')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'webinars' }, () => {
        fetchWebinars();
      })
      .subscribe();

    const discussionsChannel = supabase
      .channel('admin-discussions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_discussions' }, () => {
        fetchDiscussions();
      })
      .subscribe();

    const profilesChannel = supabase
      .channel('admin-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsers();
      })
      .subscribe();

    const rolesChannel = supabase
      .channel('admin-roles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(blogsChannel);
      supabase.removeChannel(webinarsChannel);
      supabase.removeChannel(discussionsChannel);
      supabase.removeChannel(profilesChannel);
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
        fetchBlogs(),
        fetchWebinars(),
        fetchDiscussions(),
      ]).finally(() => setLoading(false));
    }
  }, [adminSessionToken]);

  return {
    users,
    orders,
    blogs,
    webinars,
    discussions,
    loading,
    fetchUsers,
    fetchOrders,
    fetchBlogs,
    fetchWebinars,
    fetchDiscussions,
    updateOrderStatus,
    updateBlogStatus,
    upsertBlog,
    deleteBlog,
    upsertWebinar,
    deleteWebinar,
    updateDiscussionStatus,
    makeUserAdmin,
  };
};