
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Crown } from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { users, loading, makeUserAdmin } = useAdminData();

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
                    onClick={() => makeUserAdmin(user.id)}
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
