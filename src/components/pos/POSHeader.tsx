import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  Settings, 
  Printer, 
  Store 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface POSHeaderProps {
  shopName: string;
  user: User;
  printerConnected: boolean;
  onPrinterToggle: (connected: boolean) => void;
}

export function POSHeader({ 
  shopName, 
  user, 
  printerConnected, 
  onPrinterToggle 
}: POSHeaderProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Store className="h-5 w-5 text-primary" />
        <div>
          <h1 className="font-semibold text-card-foreground">{shopName}</h1>
          <p className="text-xs text-muted-foreground">Point of Sale</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant={printerConnected ? "default" : "outline"}
          size="sm"
          onClick={() => onPrinterToggle(!printerConnected)}
          className="hidden sm:flex"
        >
          <Printer className="h-4 w-4 mr-2" />
          Printer
          <Badge 
            variant={printerConnected ? "secondary" : "destructive"}
            className="ml-2 text-xs"
          >
            {printerConnected ? 'ON' : 'OFF'}
          </Badge>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                {user.email?.[0]?.toUpperCase()}
              </div>
              <span className="hidden sm:inline">{user.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/dashboard')}>
              <Settings className="h-4 w-4 mr-2" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}