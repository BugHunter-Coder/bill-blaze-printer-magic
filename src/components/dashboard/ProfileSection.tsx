
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfileSectionProps {
  user: any;
  profile: any;
  shops: any[];
  onUpdate: (data: any) => void;
  isUpdating: boolean;
}

export const ProfileSection = ({ user, profile, shops, onUpdate, isUpdating }: ProfileSectionProps) => {
  const [profileFullName, setProfileFullName] = useState('');
  const [profileRole, setProfileRole] = useState<'admin' | 'cashier' | 'manager'>('cashier');
  const [profileShopId, setProfileShopId] = useState('');

  useEffect(() => {
    if (user && profile) {
      setProfileFullName(profile.full_name || '');
      setProfileRole(profile.role || 'cashier');
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Management</CardTitle>
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
          <Select onValueChange={(value: 'admin' | 'cashier' | 'manager') => setProfileRole(value)} value={profileRole}>
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
        <div className="space-y-2">
          <Label htmlFor="shop-id">Shop ID</Label>
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
        <Button onClick={handleProfileUpdate} disabled={isUpdating}>
          {isUpdating ? 'Updating...' : 'Update Profile'}
        </Button>
      </CardContent>
    </Card>
  );
};
