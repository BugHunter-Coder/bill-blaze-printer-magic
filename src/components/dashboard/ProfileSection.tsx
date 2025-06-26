
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ProfileSectionProps {
  user: any;
  profile: any;
  shops: any[];
  onUpdate: (data: any) => void;
  isUpdating: boolean;
}

export const ProfileSection = ({ user, profile, shops, onUpdate, isUpdating }: ProfileSectionProps) => {
  const [profileFullName, setProfileFullName] = useState('');
  const [profileRole, setProfileRole] = useState<'admin' | 'cashier' | 'manager'>('admin');
  const [profileShopId, setProfileShopId] = useState('');

  useEffect(() => {
    if (user && profile) {
      setProfileFullName(profile.full_name || '');
      // Set admin as default role for shop owners
      setProfileRole(profile.role || 'admin');
      setProfileShopId(profile.shop_id || '');
    }
  }, [user, profile]);

  const handleProfileUpdate = () => {
    onUpdate({
      full_name: profileFullName,
      role: profileRole,
      shop_id: profileShopId,
    });
  };

  // Check if user is shop owner (should have admin role by default)
  const isShopOwner = shops.some(shop => shop.owner_id === user?.id);
  const userShop = shops.find(shop => shop.owner_id === user?.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Profile Management
          {isShopOwner && (
            <Badge variant="default">Shop Owner</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full-name">Full Name</Label>
          <Input
            id="full-name"
            type="text"
            value={profileFullName}
            onChange={(e) => setProfileFullName(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select 
            onValueChange={(value: 'admin' | 'cashier' | 'manager') => setProfileRole(value)} 
            value={profileRole}
            disabled={isShopOwner} // Shop owners should always be admin
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="cashier">Cashier</SelectItem>
            </SelectContent>
          </Select>
          {isShopOwner && (
            <p className="text-xs text-gray-500">
              As a shop owner, your role is automatically set to Admin
            </p>
          )}
        </div>

        {/* Only show shop selection if user has shops to choose from and is not the owner */}
        {shops.length > 0 && !isShopOwner && (
          <div className="space-y-2">
            <Label htmlFor="shop-id">Shop Assignment</Label>
            <Select onValueChange={(value) => setProfileShopId(value)} value={profileShopId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a shop" />
              </SelectTrigger>
              <SelectContent>
                {shops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id}>{shop.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Show current shop info for shop owners */}
        {isShopOwner && userShop && (
          <div className="space-y-2">
            <Label>Your Shop</Label>
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="font-medium">{userShop.name}</div>
              <div className="text-sm text-gray-600">
                {userShop.address || 'No address set'}
              </div>
            </div>
          </div>
        )}

        {/* Show message if no shops exist */}
        {shops.length === 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              No shops available. Create a shop first to assign roles.
            </p>
          </div>
        )}

        <Button onClick={handleProfileUpdate} disabled={isUpdating}>
          {isUpdating ? 'Updating...' : 'Update Profile'}
        </Button>
      </CardContent>
    </Card>
  );
};
