import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Store, User, Settings, LogOut, Calendar, Mail, Phone, MapPin, BarChart3, Package, ShoppingCart, Home, Users } from 'lucide-react';
import { UpdateProfile } from './UpdateProfile';
import { GlobalShopSelector } from './GlobalShopSelector';
import { useShop } from '@/hooks/useShop';

interface HeaderProps {
  user: any;
  onLogout: () => void;
  onProfileUpdate: (data: any) => void;
  showBackToLanding?: boolean;
  onBackToLanding?: () => void;
}

const Header = ({ user, onLogout, onProfileUpdate, showBackToLanding, onBackToLanding }: HeaderProps) => {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { toast } = useToast();
  const { selectedShop } = useShop();
  const navigate = useNavigate();

  const handleUpdate = async (data: any) => {
    onProfileUpdate(data);
    setOpen(false);
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    })
  }

  const handleNavigation = (path: string) => {
    setDrawerOpen(false);
    navigate(path);
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
      
      <div className="flex items-center space-x-4">
        <GlobalShopSelector />
        
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name} />
                <AvatarFallback>{user?.user_metadata?.full_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-96">
            <SheetHeader>
              <SheetTitle>Navigation & Profile</SheetTitle>
            </SheetHeader>
            
            <div className="mt-6 space-y-6">
              {/* Quick Navigation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Home className="h-5 w-5 mr-2" />
                    Quick Navigation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleNavigation('/dashboard')}
                    className="w-full justify-start"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => handleNavigation('/pos')}
                    className="w-full justify-start"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    POS System
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setDrawerOpen(false);
                      // Navigate to POS and show management
                      navigate('/pos?management=true');
                    }}
                    className="w-full justify-start"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Shop Management
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setDrawerOpen(false);
                      // Navigate to POS and show management with products tab
                      navigate('/pos?management=products');
                    }}
                    className="w-full justify-start"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Product Management
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setDrawerOpen(false);
                      // Navigate to POS and show management with sales tab
                      navigate('/pos?management=sales');
                    }}
                    className="w-full justify-start"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Sales Reports
                  </Button>
                </CardContent>
              </Card>

              {/* User Profile Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    User Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name} />
                      <AvatarFallback>{user?.user_metadata?.full_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{user?.user_metadata?.full_name || user?.email}</h3>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{user?.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span>Joined {new Date(user?.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setDrawerOpen(false);
                      setOpen(true);
                    }}
                    className="w-full"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Shop Details Section */}
              {selectedShop && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Store className="h-5 w-5 mr-2" />
                      Current Shop
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedShop.name}</h3>
                      <Badge variant="outline" className="mt-1">
                        {selectedShop.currency || 'INR'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {selectedShop.address && (
                        <div className="flex items-start text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                          <span>{selectedShop.address}</span>
                        </div>
                      )}
                      {selectedShop.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{selectedShop.phone}</span>
                        </div>
                      )}
                      {selectedShop.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{selectedShop.email}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Tax Rate:</span>
                        <span className="font-medium">{((selectedShop.tax_rate || 0) * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Logout Button */}
              <Button 
                variant="destructive" 
                onClick={onLogout}
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      <UpdateProfile open={open} setOpen={setOpen} onUpdate={handleUpdate} />
    </header>
  );
};

export default Header;
