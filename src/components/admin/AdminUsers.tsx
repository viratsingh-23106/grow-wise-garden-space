
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  subscription?: {
    subscribed: boolean;
    subscription_tier: string;
  };
  role?: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Get profiles with subscription data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          created_at
        `);

      if (profilesError) throw profilesError;

      // Get subscription data
      const { data: subscribers } = await supabase
        .from('subscribers')
        .select('user_id, subscribed, subscription_tier');

      // Get user roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Get auth users for email
      const { data: authUsers } = await supabase.auth.admin.listUsers();

      // Combine all data
      const combinedUsers = profiles?.map(profile => {
        const authUser = authUsers?.users.find(u => u.id === profile.id);
        const subscription = subscribers?.find(s => s.user_id === profile.id);
        const userRole = roles?.find(r => r.user_id === profile.id);

        return {
          ...profile,
          email: authUser?.email || 'N/A',
          subscription,
          role: userRole?.role
        };
      }) || [];

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const makeAdmin = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: { email }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User has been made an admin",
      });

      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error making user admin:', error);
      toast({
        title: "Error",
        description: "Failed to make user admin",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center p-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{user.full_name || 'No name'}</h3>
                    {user.role === 'admin' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                    {user.subscription && (
                      <Badge variant={user.subscription.subscribed ? "default" : "outline"}>
                        {user.subscription.subscribed 
                          ? `${user.subscription.subscription_tier} Subscriber`
                          : 'Free User'
                        }
                      </Badge>
                    )}
                  </div>
                </div>
                
                {user.role !== 'admin' && (
                  <Button
                    onClick={() => makeAdmin(user.id, user.email)}
                    variant="outline"
                    size="sm"
                  >
                    Make Admin
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          No users found matching your search.
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
