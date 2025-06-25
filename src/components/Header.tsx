import { useState } from 'react';
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Store, User } from 'lucide-react';
import { UpdateProfile } from './UpdateProfile';

interface HeaderProps {
  user: any;
  onLogout: () => void;
  onProfileUpdate: (data: any) => void;
  showBackToLanding?: boolean;
  onBackToLanding?: () => void;
}

const Header = ({ user, onLogout, onProfileUpdate, showBackToLanding, onBackToLanding }: HeaderProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast()

  const handleUpdate = async (data: any) => {
    onProfileUpdate(data);
    setOpen(false);
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    })
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <Store className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">BillBlaze POS</h1>
        {showBackToLanding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToLanding}
            className="ml-4"
          >
            ← Back to Home
          </Button>
        )}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name} />
              <AvatarFallback>{user?.user_metadata?.full_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout}>Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <UpdateProfile open={open} setOpen={setOpen} onUpdate={handleUpdate} />
    </header>
  );
};

export default Header;
