import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useShop } from '@/hooks/useShop';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield, 
  Mail, 
  Phone, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface StaffMember {
  id: string;
  shop_id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'cashier' | 'super_admin';
  updated_at: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export const StaffManagement = () => {
  const { selectedShop } = useShop();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'cashier' as 'admin' | 'manager' | 'cashier' | 'super_admin'
  });

  useEffect(() => {
    if (selectedShop) {
      fetchStaff();
    }
  }, [selectedShop]);

  const fetchStaff = async () => {
    if (!selectedShop) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('shop_id', selectedShop.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const staffMembers = (data || []).map(profile => ({
        id: profile.id,
        shop_id: profile.shop_id || '',
        name: profile.full_name || '',
        email: profile.email || '',
        phone: '', // Not available in profiles
        role: profile.role || 'cashier',
        is_active: profile.is_active || false,
        created_at: profile.created_at || '',
        updated_at: profile.updated_at || ''
      }));
      setStaff(staffMembers);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error",
        description: "Failed to fetch staff members.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'cashier'
    });
    setEditingStaff(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop) return;

    try {
      if (editingStaff) {
        // Update existing staff member
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.name,
            email: formData.email,
            role: formData.role as 'admin' | 'manager' | 'cashier' | 'super_admin',
            updated_at: new Date().toISOString()
          })
          .eq('id', editingStaff.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Staff member updated successfully.",
        });
      } else {
        // Invite new staff member via Auth
        const randomPassword = Math.random().toString(36).slice(-10) + 'Aa1!';
        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: randomPassword,
          options: {
            emailRedirectTo: window.location.origin + '/auth/callback',
            data: {
              full_name: formData.name,
              role: formData.role,
              shop_id: selectedShop.id
            }
          }
        });
        if (signUpError) throw signUpError;
        toast({
          title: "Invite sent!",
          description: "Staff member must complete registration from their email.",
        });
      }

      await fetchStaff();
      resetForm();
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error saving staff member:', error);
      toast({
        title: "Error",
        description: "Failed to save staff member.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (staffMember: StaffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone,
      role: staffMember.role
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', staffId);

      if (error) throw error;
      
      await fetchStaff();
      toast({
        title: "Success",
        description: "Staff member removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting staff member:', error);
      toast({
        title: "Error",
        description: "Failed to remove staff member.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (staffMember: StaffMember) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !staffMember.is_active })
        .eq('id', staffMember.id);

      if (error) throw error;
      
      await fetchStaff();
      toast({
        title: "Success",
        description: `Staff member ${staffMember.is_active ? 'deactivated' : 'activated'} successfully.`,
      });
    } catch (error) {
      console.error('Error toggling staff status:', error);
      toast({
        title: "Error",
        description: "Failed to update staff status.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'manager': return 'secondary';
      case 'cashier': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading staff members...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          <p className="text-gray-600">Manage your team members and their permissions</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Enter full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  placeholder="staff@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91 1234567890"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingStaff ? 'Update' : 'Add'} Staff Member
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Staff Members ({staff.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staff.length > 0 ? (
              staff.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{member.name}</h3>
                        <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </Badge>
                        <Badge variant={member.is_active ? "default" : "secondary"} className="text-xs">
                          {member.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Added: {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(member)}
                      title={member.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {member.is_active ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(member)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members yet</h3>
                <p className="text-gray-600 mb-4">Add your first staff member to get started.</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <span>Role Permissions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Owner</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Full system access</li>
                  <li>• Manage all settings</li>
                  <li>• View all reports</li>
                  <li>• Manage staff</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Manager</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Manage products and inventory</li>
                  <li>• View sales reports</li>
                  <li>• Process transactions</li>
                  <li>• Basic settings access</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Cashier</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Process transactions</li>
                  <li>• View product catalog</li>
                  <li>• Basic customer service</li>
                  <li>• Limited reports access</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Staff</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• View products</li>
                  <li>• Basic customer support</li>
                  <li>• Limited system access</li>
                  <li>• Read-only reports</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 