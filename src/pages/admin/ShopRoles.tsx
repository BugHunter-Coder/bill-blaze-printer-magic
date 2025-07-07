import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useShop } from '@/hooks/useShop';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Edit, Trash2, UserPlus, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PERMISSIONS = [
  { key: 'pos', label: 'POS (Sales)' },
  { key: 'products', label: 'Products' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'reports', label: 'Reports' },
  { key: 'users', label: 'User Management' },
  { key: 'settings', label: 'Settings' },
];

export default function ShopRoles() {
  const { selectedShop } = useShop();
  const { profile: user } = useAuth();
  const { toast } = useToast();
  const [roles, setRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [roleName, setRoleName] = useState('');
  const [rolePerms, setRolePerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<any>(null);

  useEffect(() => {
    if (selectedShop) {
      fetchRoles();
      fetchUsers();
    }
  }, [selectedShop]);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user || !selectedShop) return;
      const { data: userRoleData } = await supabase
        .from('user_roles')
        .select('role_id, roles!inner(permissions)')
        .eq('user_id', user.id)
        .eq('roles.shop_id', selectedShop.id)
        .single();
      setUserRole(userRoleData?.roles || null);
    };
    fetchUserRole();
  }, [user, selectedShop]);

  const fetchRoles = async () => {
    if (!selectedShop) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('shop_id', selectedShop.id)
      .order('created_at');
    if (!error) setRoles(data || []);
    setLoading(false);
  };

  const fetchUsers = async () => {
    if (!selectedShop) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, is_active')
      .eq('shop_id', selectedShop.id);
    if (!error) setUsers(data || []);
  };

  const handleSaveRole = async () => {
    if (!roleName.trim() || rolePerms.length === 0) return;
    setSaving(true);
    if (editingRole) {
      // Update
      const { error } = await supabase
        .from('roles')
        .update({ name: roleName.trim(), permissions: rolePerms })
        .eq('id', editingRole.id);
      if (!error) toast({ title: 'Role updated' });
    } else {
      // Create
      const { error } = await supabase
        .from('roles')
        .insert({ name: roleName.trim(), permissions: rolePerms, shop_id: selectedShop.id });
      if (!error) toast({ title: 'Role created' });
    }
    setShowRoleDialog(false);
    setRoleName('');
    setRolePerms([]);
    setEditingRole(null);
    setSaving(false);
    fetchRoles();
  };

  const handleEditRole = (role: any) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRolePerms(role.permissions || []);
    setShowRoleDialog(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('Delete this role?')) return;
    await supabase.from('roles').delete().eq('id', roleId);
    fetchRoles();
  };

  const handleAssignRole = async (userId: string, roleId: string) => {
    // Remove existing role
    await supabase.from('user_roles').delete().eq('user_id', userId);
    // Assign new
    await supabase.from('user_roles').insert({ user_id: userId, role_id: roleId });
    toast({ title: 'Role assigned' });
  };

  // Allow if owner or if assigned role has 'users' or 'settings' permission
  const canManage = user && selectedShop && (
    user.id === selectedShop.owner_id ||
    (userRole && userRole.permissions && (userRole.permissions.includes('users') || userRole.permissions.includes('settings')))
  );

  if (!selectedShop) {
    return <div className="text-center py-12 text-gray-500">Select a shop to manage roles.</div>;
  }
  if (!canManage) {
    return <div className="text-center py-12 text-gray-500">You do not have permission to manage roles for this shop.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Roles & Permissions</CardTitle>
          <Button onClick={() => { setShowRoleDialog(true); setEditingRole(null); setRoleName(''); setRolePerms([]); }}>
            <UserPlus className="h-4 w-4 mr-2" /> New Role
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? <div>Loading...</div> : (
            <div className="space-y-4">
              {roles.length === 0 && <div className="text-gray-500">No roles yet.</div>}
              {roles.map(role => (
                <div key={role.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <div className="font-semibold text-lg">{role.name}</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {role.permissions.map((perm: string) => (
                        <Badge key={perm} variant="outline">{PERMISSIONS.find(p => p.key === perm)?.label || perm}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditRole(role)}><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteRole(role.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'New Role'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Role name (e.g. Manager)"
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
              maxLength={32}
            />
            <div>
              <div className="font-medium mb-2">Permissions</div>
              <div className="flex flex-wrap gap-3">
                {PERMISSIONS.map(perm => (
                  <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePerms.includes(perm.key)}
                      onChange={e => {
                        if (e.target.checked) setRolePerms([...rolePerms, perm.key]);
                        else setRolePerms(rolePerms.filter(p => p !== perm.key));
                      }}
                    />
                    <span>{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRoleDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveRole} disabled={!roleName.trim() || rolePerms.length === 0 || saving}>{editingRole ? 'Save' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Role Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Assign Roles to Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.length === 0 && <div className="text-gray-500">No users found.</div>}
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <div className="font-medium">{user.full_name || user.email}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                <Select
                  value={(() => {
                    const ur = roles.find(r => r.user_ids?.includes(user.id));
                    return ur ? ur.id : '';
                  })()}
                  onValueChange={roleId => handleAssignRole(user.id, roleId)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 