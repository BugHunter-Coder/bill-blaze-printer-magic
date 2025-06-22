
import { Wifi, WifiOff, Printer } from 'lucide-react';
import { ShopDetails } from '@/types/pos';

interface HeaderProps {
  isBluetoothConnected: boolean;
  printer: BluetoothDevice | null;
  shopDetails: ShopDetails;
}

export const Header = ({ isBluetoothConnected, printer, shopDetails }: HeaderProps) => {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Printer className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{shopDetails.name}</h1>
          <p className="text-xs text-gray-500">{shopDetails.address}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4 ml-auto">
        <div className="flex items-center space-x-2">
          {isBluetoothConnected ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-gray-400" />
          )}
          <span className="text-sm text-gray-600">
            {isBluetoothConnected 
              ? `Connected: ${printer?.name || 'Thermal Printer'}`
              : 'Printer Disconnected'
            }
          </span>
        </div>
      </div>
    </div>
  );
};
