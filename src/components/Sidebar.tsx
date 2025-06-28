import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Home,
  ShoppingCart,
  BarChart3,
  Package,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
  CreditCard,
  Receipt,
  TrendingUp,
  Activity,
  Bell,
  Star,
  Award,
  Zap,
  Database,
  Shield,
  Globe,
  Smartphone,
  Truck,
  Calendar,
  FileText,
  PieChart,
  LineChart,
  Target,
  DollarSign,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  User,
  Key,
  Lock,
  Unlock,
  Wifi,
  Battery,
  Signal
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
  children?: NavItem[];
  isActive?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const { selectedShop } = useShop();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navigationItems: NavItem[] = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: Home,
      description: 'Business overview and analytics',
      isActive: isActiveRoute('/dashboard')
    },
    {
      title: 'POS System',
      path: '/pos',
      icon: ShoppingCart,
      badge: 'Live',
      description: 'Point of sale and transactions',
      isActive: isActiveRoute('/pos')
    },
    {
      title: 'Analytics',
      path: '/analytics',
      icon: BarChart3,
      description: 'Business intelligence and reports',
      children: [
        {
          title: 'Sales Analytics',
          path: '/analytics/sales',
          icon: TrendingUp,
          description: 'Sales performance and trends'
        },
        {
          title: 'Customer Analytics',
          path: '/analytics/customers',
          icon: Users,
          description: 'Customer behavior and insights'
        },
        {
          title: 'Product Analytics',
          path: '/analytics/products',
          icon: Package,
          description: 'Product performance and inventory'
        },
        {
          title: 'Financial Reports',
          path: '/analytics/financial',
          icon: DollarSign,
          description: 'Financial statements and metrics'
        }
      ]
    },
    {
      title: 'Products',
      path: '/products',
      icon: Package,
      description: 'Product catalog and inventory',
      children: [
        {
          title: 'Product Catalog',
          path: '/products/catalog',
          icon: Package,
          description: 'Manage product catalog'
        },
        {
          title: 'Inventory Management',
          path: '/products/inventory',
          icon: Database,
          description: 'Stock levels and alerts'
        },
        {
          title: 'Categories',
          path: '/products/categories',
          icon: PieChart,
          description: 'Product categories and organization'
        },
        {
          title: 'Bulk Import',
          path: '/products/import',
          icon: Upload,
          description: 'Import products from CSV'
        }
      ]
    },
    {
      title: 'Customers',
      path: '/customers',
      icon: Users,
      description: 'Customer management and insights',
      children: [
        {
          title: 'Customer List',
          path: '/customers/list',
          icon: Users,
          description: 'View all customers'
        },
        {
          title: 'Customer Analytics',
          path: '/customers/analytics',
          icon: BarChart3,
          description: 'Customer behavior insights'
        },
        {
          title: 'Loyalty Program',
          path: '/customers/loyalty',
          icon: Star,
          description: 'Loyalty and rewards system'
        }
      ]
    },
    {
      title: 'Transactions',
      path: '/transactions',
      icon: Receipt,
      description: 'Transaction history and management',
      children: [
        {
          title: 'Transaction History',
          path: '/transactions/history',
          icon: Receipt,
          description: 'View all transactions'
        },
        {
          title: 'Refunds & Returns',
          path: '/transactions/refunds',
          icon: RefreshCw,
          description: 'Handle refunds and returns'
        },
        {
          title: 'Payment Methods',
          path: '/transactions/payments',
          icon: CreditCard,
          description: 'Payment method management'
        }
      ]
    },
    {
      title: 'Shop Management',
      path: '/shop',
      icon: Store,
      description: 'Shop settings and configuration',
      children: [
        {
          title: 'Shop Settings',
          path: '/shop/settings',
          icon: Settings,
          description: 'General shop configuration'
        },
        {
          title: 'Staff Management',
          path: '/shop/staff',
          icon: Users,
          description: 'Manage staff and permissions'
        },
        {
          title: 'Printer Setup',
          path: '/shop/printer',
          icon: Receipt,
          description: 'Thermal printer configuration'
        },
        {
          title: 'Integrations',
          path: '/shop/integrations',
          icon: Globe,
          description: 'Third-party integrations'
        }
      ]
    },
    {
      title: 'Reports',
      path: '/reports',
      icon: FileText,
      description: 'Generate and export reports',
      children: [
        {
          title: 'Sales Reports',
          path: '/reports/sales',
          icon: TrendingUp,
          description: 'Sales performance reports'
        },
        {
          title: 'Inventory Reports',
          path: '/reports/inventory',
          icon: Package,
          description: 'Inventory status reports'
        },
        {
          title: 'Customer Reports',
          path: '/reports/customers',
          icon: Users,
          description: 'Customer analysis reports'
        },
        {
          title: 'Financial Reports',
          path: '/reports/financial',
          icon: DollarSign,
          description: 'Financial statements'
        }
      ]
    }
  ];

  const systemItems: NavItem[] = [
    {
      title: 'System Status',
      path: '/system',
      icon: Activity,
      badge: '99.9%',
      description: 'System health and monitoring'
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: Settings,
      description: 'Application settings and preferences'
    }
  ];

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const isExpanded = expandedItems.includes(item.title);
    const hasChildren = item.children && item.children.length > 0;
    const isActive = item.isActive || isActiveRoute(item.path);

    return (
      <div key={item.title} className="space-y-1">
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start h-auto p-3 transition-all duration-200",
            level > 0 && "ml-4",
            isActive && "bg-blue-50 text-blue-700 border-blue-200",
            !isCollapsed && "hover:bg-gray-100"
          )}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.title);
            } else {
              navigate(item.path);
            }
          }}
        >
          <div className="flex items-center w-full">
            <item.icon className={cn(
              "h-4 w-4 mr-3 flex-shrink-0",
              isActive ? "text-blue-600" : "text-gray-600"
            )} />
            
            {!isCollapsed && (
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.title}</span>
                  {item.badge && (
                    <Badge 
                      variant={item.badge === 'Live' ? 'default' : 'secondary'}
                      className="ml-2 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {item.description}
                  </p>
                )}
              </div>
            )}

            {hasChildren && !isCollapsed && (
              <ChevronRight 
                className={cn(
                  "h-4 w-4 ml-2 transition-transform duration-200",
                  isExpanded && "rotate-90"
                )} 
              />
            )}
          </div>
        </Button>

        {/* Render children */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="ml-4 space-y-1">
            {item.children!.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-80"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">BillBlaze</h2>
              <p className="text-xs text-gray-500">
                {selectedShop?.name || 'Select Shop'}
              </p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-2">
          <div className={cn(
            "text-xs font-semibold text-gray-500 uppercase tracking-wider",
            isCollapsed && "sr-only"
          )}>
            Main Navigation
          </div>
          <div className="space-y-1">
            {navigationItems.map(item => renderNavItem(item))}
          </div>
        </div>

        <Separator />

        {/* System Navigation */}
        <div className="space-y-2">
          <div className={cn(
            "text-xs font-semibold text-gray-500 uppercase tracking-wider",
            isCollapsed && "sr-only"
          )}>
            System
          </div>
          <div className="space-y-1">
            {systemItems.map(item => renderNavItem(item))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed ? (
          <div className="space-y-3">
            {/* User Profile */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.full_name || user?.email}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                <Settings className="h-3 w-3 mr-1" />
                Settings
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <LogOut className="h-3 w-3 mr-1" />
                Logout
              </Button>
            </div>

            {/* System Status */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Online</span>
              </div>
              <span>v1.0.0</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <User className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar; 