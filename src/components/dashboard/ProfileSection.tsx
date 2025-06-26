
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

  // Check if user is shop owner
  const isShopOwner = shops.some(shop => shop.owner_id === user?.id);
  const userOwnedShop = shops.find(shop => shop.owner_id === user?.id);

  useEffect(() => {
    if (user && profile) {
      setProfileFullName(profile.full_name || '');
      
      // Set role based on shop ownership
      if (isShopOwner) {
        setProfileRole('admin'); // Shop owners are always admin
      } else {
        setProfileRole(profile.role || 'cashier');
      }
      
      // Set shop ID - for shop owners, use their owned shop
      if (isShopOwner && userOwnedShop) {
        setProfileShopId(userOwnedShop.id);
      } else {
        setProfileShopId(profile.shop_id || '');
      }
    }
  }, [user, profile, isShopOwner, userOwnedShop]);

  const handleProfileUpdate = () => {
    const updateData: any = {
      full_name: profileFullName,
    };

    // Only include role and shop_id for non-shop-owners
    if (!isShopOwner) {
      updateData.role = profileRole;
      updateData.shop_id = profileShopId;
    } else {
      // Shop owners are always admin with their own shop
      updateData.role = 'admin';
      updateData.shop_id = userOwnedShop?.id;
    }

    onUpdate(updateData);
  };

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
        
        {/* Show role selection only for non-shop-owners */}
        {!isShopOwner && (
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              onValueChange={(value: 'admin' | 'cashier' | 'manager') => setProfileRole(value)} 
              value={profileRole}
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
          </div>
        )}

        {/* Show role info for shop owners */}
        {isShopOwner && (
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between">
                <span className="font-medium">Administrator</span>
                <Badge variant="default">Owner</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                As a shop owner, you have full administrative privileges
              </p>
            </div>
          </div>
        )}

        {/* Show shop assignment only if user has shops to choose from and is not the owner */}
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
        {isShopOwner && userOwnedShop && (
          <div className="space-y-2">
            <Label>Your Shop</Label>
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="font-medium">{userOwnedShop.name}</div>
              <div className="text-sm text-gray-600">
                {userOwnedShop.address || 'No address set'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Shop ID: {userOwnedShop.id}
              </div>
            </div>
          </div>
        )}

        {/* Show message if no shops exist and user is not a shop owner */}
        {shops.length === 0 && !isShopOwner && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              No shops available. Create a shop first or ask a shop owner to assign you to their shop.
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
