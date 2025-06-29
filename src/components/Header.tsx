import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Avatar, AvatarImage, AvatarFallback,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Store, User, Settings, LogOut, Calendar, Mail, Phone, MapPin,
  BarChart3, Package, ShoppingCart, Home, Users, Plus,
  Upload, Menu as MenuIcon,
} from 'lucide-react';
import { UpdateProfile } from './UpdateProfile';
import { GlobalShopSelector } from './GlobalShopSelector';
import { BluetoothPrinterNav } from './BluetoothPrinterNav';
import { useShop } from '@/hooks/useShop';

/* ————————————————————————————————————————————— */
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
/* ————————————————————————————————————————————— */

export default function Header({
  user,
  onLogout,
  onProfileUpdate,
  showBackToLanding,
  onBackToLanding,
  onOpenManagement,
  isPrinterConnected = false,
  onPrinterConnectionChange,
  onPrinterChange,
}: HeaderProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { toast } = useToast();
  const { selectedShop } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const isPOS = location.pathname === '/pos';

  /* ────────────────── helpers ────────────────── */
  const handleUpdate = (data: any) => {
    onProfileUpdate(data);
    setEditOpen(false);
    toast({ title: 'Profile Updated', description: 'Saved successfully.' });
  };

  const go = (path: string) => {
    setDrawerOpen(false);
    navigate(path);
  };

  /* ────────────────── render ──────────────────── */
  return (
    <header className="sticky top-0 z-50 h-16 bg-white/80 backdrop-blur shadow-sm border-b flex items-center px-4 sm:px-6">
      {/* ——— left side ——— */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <Store className="h-7 w-7 text-blue-600 shrink-0" />
        <h1 className="font-bold text-lg sm:text-2xl truncate">BillBlaze&nbsp;POS</h1>

        {/* back-to-home CTA (optional) */}
        {showBackToLanding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToLanding}
            className="ml-1 hidden xl:flex"
          >
            ← Back Home
          </Button>
        )}

        {/* POS context (only on /pos) */}
        {isPOS && selectedShop && (
          <div className="hidden sm:flex items-center gap-3 pl-3">
            <div className="h-5 w-px bg-gray-300" />
            <div className="flex items-center gap-2 min-w-0">
              <div className="rounded-md p-1 bg-blue-100">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-none truncate">Point of Sale</p>
                <p className="text-xs text-gray-600 truncate">{selectedShop.name}</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/products/add')}
              size="sm"
              variant="outline"
              className="h-8 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            >
              <Plus className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        )}
      </div>

      {/* ——— right side ——— */}
      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        {/* Shop selector */}
        <GlobalShopSelector />

        {/* Bluetooth (POS only) */}
        {isPOS && onPrinterConnectionChange && onPrinterChange && (
          <BluetoothPrinterNav
            isConnected={isPrinterConnected}
            onConnectionChange={onPrinterConnectionChange}
            onPrinterChange={onPrinterChange}
          />
        )}

        {/* ===== Sheet Trigger (hamburger on phones) ===== */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              aria-label="Open navigation"
            >
              <MenuIcon className="h-6 w-6" />
            </Button>
          </SheetTrigger>

          {/* ===== Avatar trigger (≥ sm) ===== */}
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex p-0"
              aria-label="Open profile & navigation"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {user?.user_metadata?.full_name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </SheetTrigger>

          {/* ——— Drawer content ——— */}
          <SheetContent side="right" className="w-full max-w-xs sm:max-w-sm md:w-[420px] p-0">
            <DrawerBody
              user={user}
              navPath={location.pathname}
              go={go}
              onLogout={onLogout}
              openEdit={() => {
                setDrawerOpen(false);
                setEditOpen(true);
              }}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* modal: edit profile */}
      <UpdateProfile open={editOpen} setOpen={setEditOpen} onUpdate={handleUpdate} />
    </header>
  );
}

/* ————————————————————————————————————————————— */
/* Drawer body (extract to keep parent tidy)      */
/* ————————————————————————————————————————————— */
function DrawerBody({ user, navPath, go, onLogout, openEdit }) {
  const { selectedShop } = useShop();

  return (
    <div className="flex h-full flex-col">
      {/* header + search */}
      <div className="sticky top-0 z-10 border-b bg-white p-6 pb-3">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">Navigation</SheetTitle>
        </SheetHeader>
        <input
          placeholder="Search…"
          className="mt-3 w-full rounded-md border px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* nav + profile */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6 pt-4 space-y-6">
        {/* main links */}
        <NavButton path="/dashboard" current={navPath} icon={Home} label="Dashboard" go={go} />
        <NavButton path="/pos" current={navPath} icon={ShoppingCart} label="POS System" go={go} />

        {/* collapsible groups */}
        <CollapsibleNavGroup
          title="Products"
          icon={Package}
          base="/products"
          active={navPath.startsWith('/products')}
          items={[
            { label: 'Catalog', icon: Package, path: '/products/catalog' },
            { label: 'Inventory', icon: Package, path: '/products/inventory' },
            { label: 'Categories', icon: Package, path: '/products/categories' },
          ]}
          go={go}
        />

        <CollapsibleNavGroup
          title="Analytics"
          icon={BarChart3}
          base="/analytics"
          active={navPath.startsWith('/analytics')}
          items={[
            { label: 'Sales', icon: BarChart3, path: '/analytics/sales' },
            { label: 'Customers', icon: Users, path: '/analytics/customers' },
            { label: 'Products', icon: Package, path: '/analytics/products' },
          ]}
          go={go}
        />

        {/* quick actions */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => go('/products/add')}>
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
            <Button variant="outline" onClick={() => go('/products/add?tab=bulk')}>
              <Upload className="mr-2 h-4 w-4" /> Bulk
            </Button>
            <Button variant="outline" onClick={() => go('/pos')}>
              <ShoppingCart className="mr-2 h-4 w-4" /> Sale
            </Button>
          </div>
        </div>

        {/* profile card */}
        <ProfileCard user={user} openEdit={openEdit} />

        {/* shop card */}
        {selectedShop && <ShopCard shop={selectedShop} />}
      </div>

      {/* logout */}
      <div className="border-t bg-white p-6">
        <Button variant="destructive" className="w-full" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
    </div>
  );
}

/* — helper sub-components — */
function NavButton({ path, current, icon: Icon, label, go }) {
  return (
    <Button
      variant={current === path ? 'secondary' : 'ghost'}
      className="mb-1 w-full justify-start gap-2"
      onClick={() => go(path)}
    >
      <Icon className="h-4 w-4" /> {label}
    </Button>
  );
}

function CollapsibleNavGroup({
  title, icon: Icon, active, items, go, base,
}: any) {
  const [open, setOpen] = useState(active);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={`
          flex w-full items-center rounded-lg px-3 py-2 text-left font-medium
          transition-colors
          ${open ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
        `}
      >
        <Icon className="mr-2 h-4 w-4" /> {title}
        <span className="ml-auto text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-1 space-y-1 pl-6">
          {items.map((it: any) => (
            <Button
              key={it.path}
              variant={it.path === base ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2"
              onClick={() => go(it.path)}
            >
              <it.icon className="h-4 w-4" /> {it.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileCard({ user, openEdit }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Profile</p>
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback>{user?.user_metadata?.full_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-medium">{user?.user_metadata?.full_name || user.email}</p>
          <p className="truncate text-xs text-gray-600">{user.email}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="mt-3 w-full" onClick={openEdit}>
        <Settings className="mr-2 h-4 w-4" /> Edit Profile
      </Button>
    </div>
  );
}

function ShopCard({ shop }) {
  return (
    <div className="pt-6">
      <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Current Shop</p>
      <div className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-lg">{shop.name}</h3>
        {shop.address && (
          <p className="flex items-start text-sm">
            <MapPin className="mr-2 mt-0.5 h-4 w-4 text-gray-500" />
            {shop.address}
          </p>
        )}
        {shop.phone && (
          <p className="flex items-center text-sm">
            <Phone className="mr-2 h-4 w-4 text-gray-500" />
            {shop.phone}
          </p>
        )}
        {shop.email && (
          <p className="flex items-center text-sm">
            <Mail className="mr-2 h-4 w-4 text-gray-500" />
            {shop.email}
          </p>
        )}
        <div className="flex justify-between border-t pt-2 text-sm">
          <span>Tax Rate:</span>
          <span className="font-medium">
            {((shop.tax_rate || 0) * 100).toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
