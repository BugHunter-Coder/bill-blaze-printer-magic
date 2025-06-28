import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Users, UserPlus, Shield, Eye, EyeOff, Trash2, Edit } from 'lucide-react';
import { ShopUser, CreateUserData, UserRole } from '@/types/pos';

const USER_ROLES: UserRole[] = [
  {
    id: 'admin',
    name: 'Shop Admin',
    permissions: ['all'],
    description: 'Full access to all features including user management and financial data'
  },
  {
    id: 'cashier',
    name: 'Cashier',
    permissions: ['pos', 'products', 'inventory'],
    description: 'Can process sales, manage products, and view inventory'
  },
  {
    id: 'sales',
    name: 'Sales Staff',
    permissions: ['pos', 'products'],
    description: 'Can process sales and view products'
  },
  {
    id: 'inventory',
    name: 'Inventory Manager',
    permissions: ['products', 'inventory'],
    description: 'Can manage products and inventory, no access to sales data'
  },
  {
    id: 'viewer',
    name: 'Viewer',
    permissions: ['products'],
    description: 'Can only view products, no access to sales or financial data'
  }
];

export const UserManagement = () => {
  const { user } = useAuth();
  const { selectedShop } = useShop();
  const { toast } = useToast();
  const [users, setUsers] = useState<ShopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUser, setNewUser] = useState<CreateUserData>({
    email: '',
    full_name: '',
    role: 'cashier',
    shop_id: ''
  });

  useEffect(() => {
    if (selectedShop) {
      fetchUsers();
    }
  }, [selectedShop]);

  const fetchUsers = async () => {
    if (!selectedShop) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('shop_id', selectedShop.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch users: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!selectedShop) return;

    try {
      // First, create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: 'temp123456', // Temporary password
        email_confirm: true,
        user_metadata: {
          full_name: newUser.full_name,
          role: newUser.role,
          shop_id: selectedShop.id
        }
      });

      if (authError) throw authError;

      // Then create the profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
          shop_id: selectedShop.id,
          is_active: true
        });

      if (profileError) throw profileError;

      toast({
        description: "User created successfully! They will receive an email to set their password.",
      });

      setShowAddDialog(false);
      setNewUser({ email: '', full_name: '', role: 'cashier', shop_id: '' });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create user: " + error.message,
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        description: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully.`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update user status: " + error.message,
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        description: "User role updated successfully.",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update user role: " + error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleInfo = (roleId: string) => {
    return USER_ROLES.find(role => role.id === roleId) || USER_ROLES[0];
  };

  const canManageUsers = () => {
    if (!user || !selectedShop) return false;
    // Only shop owners and admins can manage users
    return user.id === selectedShop.owner_id || getRoleInfo(user.role || 'viewer').permissions.includes('all');
  };

  if (!selectedShop) {
    return (
      <div className="text-center text-gray-500 py-8">
        <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>Please select a shop to manage users</p>
      </div>
    );
  }

  if (!canManageUsers()) {
    return (
      <div className="text-center text-gray-500 py-8">
        <Shield className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>You don't have permission to manage users</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage users and their access levels for {selectedShop.name}</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div>
                          <div className="font-medium">{role.name}</div>
                          <div className="text-sm text-gray-500">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser}>
                  Add User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500">No users found</p>
              <p className="text-sm text-gray-400">Add your first user to get started</p>
            </CardContent>
          </Card>
        ) : (
          users.map((user) => {
            const roleInfo = getRoleInfo(user.role);
            return (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-medium">{user.full_name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{roleInfo.name}</Badge>
                          <Badge variant={user.is_active ? "default" : "secondary"}>
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select value={user.role} onValueChange={(value) => updateUserRole(user.id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {USER_ROLES.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={() => toggleUserStatus(user.id, user.is_active)}
                      />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-600">{roleInfo.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {roleInfo.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}; 