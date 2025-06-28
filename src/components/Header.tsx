import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { Store, User, Settings, LogOut, Calendar, Mail, Phone, MapPin, BarChart3, Package, ShoppingCart, Home, Users, Plus, Upload } from 'lucide-react';
import { UpdateProfile } from './UpdateProfile';
import { GlobalShopSelector } from './GlobalShopSelector';
import { BluetoothPrinterNav } from './BluetoothPrinterNav';
import { useShop } from '@/hooks/useShop';

interface HeaderProps {
  user: any;
  onLogout: () => void;
  onProfileUpdate: (data: any) => void;
  showBackToLanding?: boolean;
  onBackToLanding?: () => void;
  onOpenManagement?: () => void;
  isPrinterConnected?: boolean;
  onPrinterConnectionChange?: (isConnected: boolean) => void;
  onPrinterChange?: (device: BluetoothDevice | null) => void;
}

const Header = ({ 
  user, 
  onLogout, 
  onProfileUpdate, 
  showBackToLanding, 
  onBackToLanding, 
  onOpenManagement,
  isPrinterConnected = false,
  onPrinterConnectionChange,
  onPrinterChange,
}: HeaderProps) => {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { toast } = useToast();
  const { selectedShop } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnPOSPage = location.pathname === '/pos';

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
        
        {/* POS Page Title and Controls */}
        {isOnPOSPage && selectedShop && (
          <div className="flex items-center space-x-3 ml-4">
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 rounded-lg p-1">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Point of Sale</h2>
                <p className="text-xs text-gray-600">{selectedShop.name}</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/products/add')} 
              size="sm" 
              variant="outline"
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 h-8 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        <GlobalShopSelector />
        
        {/* Bluetooth Printer Nav - Only show on POS page */}
        {isOnPOSPage && onPrinterConnectionChange && onPrinterChange && (
          <BluetoothPrinterNav
            isConnected={isPrinterConnected}
            onConnectionChange={onPrinterConnectionChange}
            onPrinterChange={onPrinterChange}
          />
        )}
        
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name} />
                <AvatarFallback>{user?.user_metadata?.full_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[420px] max-w-full p-0">
            <div className="h-full flex flex-col">
              {/* Header & Search */}
              <div className="p-6 pb-2 border-b border-gray-200 bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                  <SheetHeader>
                    <SheetTitle className="text-2xl font-bold">Navigation & Profile</SheetTitle>
                  </SheetHeader>
                </div>
                <div className="mb-2">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    // Optionally, add search logic here
                  />
                </div>
              </div>
              {/* Navigation */}
              <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6 bg-gray-50">
                {/* Main Navigation */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Main Navigation</div>
                  <div className="space-y-1">
                    <Button variant={location.pathname === '/dashboard' ? 'secondary' : 'ghost'} onClick={() => handleNavigation('/dashboard')} className="w-full justify-start flex items-center gap-2">
                      <Home className="h-4 w-4" /> Dashboard
                    </Button>
                    <Button variant={location.pathname === '/pos' ? 'secondary' : 'ghost'} onClick={() => handleNavigation('/pos')} className="w-full justify-start flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" /> POS System
                    </Button>
                  </div>
                </div>
                {/* Collapsible Groups */}
                <CollapsibleNavGroup
                  title="Products"
                  icon={Package}
                  isActive={location.pathname.startsWith('/products')}
                  items={[
                    { label: 'Product Catalog', icon: Package, path: '/products/catalog' },
                    { label: 'Inventory', icon: Package, path: '/products/inventory' },
                    { label: 'Categories', icon: Package, path: '/products/categories' },
                  ]}
                  handleNavigation={handleNavigation}
                  currentPath={location.pathname}
                />
                <CollapsibleNavGroup
                  title="Analytics"
                  icon={BarChart3}
                  isActive={location.pathname.startsWith('/analytics')}
                  items={[
                    { label: 'Sales', icon: BarChart3, path: '/analytics/sales' },
                    { label: 'Customers', icon: Users, path: '/analytics/customers' },
                    { label: 'Products', icon: Package, path: '/analytics/products' },
                  ]}
                  handleNavigation={handleNavigation}
                  currentPath={location.pathname}
                />
                <CollapsibleNavGroup
                  title="Reports"
                  icon={BarChart3}
                  isActive={location.pathname.startsWith('/reports')}
                  items={[
                    { label: 'Sales Reports', icon: BarChart3, path: '/reports/sales' },
                    { label: 'Inventory Reports', icon: Package, path: '/reports/inventory' },
                    { label: 'Customer Reports', icon: Users, path: '/reports/customers' },
                  ]}
                  handleNavigation={handleNavigation}
                  currentPath={location.pathname}
                />
                <div>
                  <Button variant={location.pathname === '/shop' ? 'secondary' : 'ghost'} onClick={() => handleNavigation('/shop')} className="w-full justify-start flex items-center gap-2">
                    <Store className="h-4 w-4" /> Shop Management
                  </Button>
                  <Button variant={location.pathname === '/settings' ? 'secondary' : 'ghost'} onClick={() => handleNavigation('/settings')} className="w-full justify-start flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Settings
                  </Button>
                </div>
                {/* Quick Actions */}
                <div className="mt-6">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Actions</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="justify-start" onClick={() => {
                      setDrawerOpen(false);
                      navigate('/products/add');
                    }}>
                      <Plus className="h-4 w-4 mr-2" /> Add Product
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => {
                      setDrawerOpen(false);
                      navigate('/products/add?tab=bulk');
                    }}>
                      <Upload className="h-4 w-4 mr-2" /> Bulk Upload
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => handleNavigation('/pos')}>
                      <ShoppingCart className="h-4 w-4 mr-2" /> New Sale
                    </Button>
                  </div>
                </div>
                {/* User Profile Section */}
                <div className="mt-6">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">User Profile</div>
                  <Card className="shadow-none border-0 bg-transparent">
                    <CardContent className="space-y-4 p-0">
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
                </div>
                {/* Shop Details Section */}
                {selectedShop && (
                  <div className="mt-6">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Shop</div>
                    <Card className="shadow-none border-0 bg-transparent">
                      <CardContent className="space-y-4 p-0">
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
                  </div>
                )}
              </div>
              {/* Logout Button */}
              <div className="p-6 border-t border-gray-200 bg-white">
                <Button 
                  variant="destructive" 
                  onClick={onLogout}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      <UpdateProfile open={open} setOpen={setOpen} onUpdate={handleUpdate} />
    </header>
  );
};

export default Header;

function CollapsibleNavGroup({ title, icon: Icon, isActive, items, handleNavigation, currentPath }) {
  const [open, setOpen] = useState(isActive);
  return (
    <div className="mb-2">
      <button
        className={`flex items-center w-full px-3 py-2 rounded-lg text-left font-medium transition-colors ${open ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon className="h-4 w-4 mr-2" />
        {title}
        <span className="ml-auto">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="pl-6 mt-1 space-y-1">
          {items.map((item) => (
            <Button
              key={item.path}
              variant={currentPath === item.path ? 'secondary' : 'ghost'}
              onClick={() => handleNavigation(item.path)}
              className="w-full justify-start flex items-center gap-2"
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
