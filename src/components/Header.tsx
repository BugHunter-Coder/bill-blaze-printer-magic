
import { Store, Bluetooth, BluetoothConnected, Wifi, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Shop } from '@/types/pos';

interface HeaderProps {
  isBluetoothConnected: boolean;
  printer: BluetoothDevice | null;
  shop: Shop;
}

export const Header = ({ isBluetoothConnected, printer, shop }: HeaderProps) => {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <Store className="h-8 w-8 text-blue-600" />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
        <p className="text-sm text-gray-600">{shop.address}</p>
      </div>
      
      <div className="flex items-center space-x-2 ml-auto">
        <div className="flex items-center space-x-1">
          {isBluetoothConnected ? (
            <BluetoothConnected className="h-4 w-4 text-green-600" />
          ) : (
            <Bluetooth className="h-4 w-4 text-gray-400" />
          )}
          <span className="text-xs text-gray-600">
            {isBluetoothConnected ? printer?.name || 'Connected' : 'Not connected'}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Wifi className="h-4 w-4 text-green-600" />
          <span className="text-xs text-gray-600">Online</span>
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="flex items-center space-x-1"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
};
