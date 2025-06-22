
import { Wifi, WifiOff, Printer } from 'lucide-react';

interface HeaderProps {
  isBluetoothConnected: boolean;
  printer: BluetoothDevice | null;
}

export const Header = ({ isBluetoothConnected, printer }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Printer className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Bill Blaze POS</h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
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
    </header>
  );
};
