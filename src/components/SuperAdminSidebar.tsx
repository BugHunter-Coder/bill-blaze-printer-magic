import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Database,
  Globe,
  Activity,
  Bell,
  Star,
  Award,
  Zap,
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
  Signal,
  CreditCard,
  Brain,
  Store,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SuperAdminSidebarProps {
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

const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({ isCollapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
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
      title: 'System Dashboard',
      path: '/admin',
      icon: Shield,
      description: 'System overview and monitoring',
      isActive: isActiveRoute('/admin')
    },
    {
      title: 'Shop Management',
      path: '/admin/shops',
      icon: Store,
      description: 'Manage all shops and owners',
      children: [
        {
          title: 'All Shops',
          path: '/admin/shops',
          icon: Store,
          description: 'View and manage all shops'
        },
        {
          title: 'Shop Analytics',
          path: '/admin/shops/analytics',
          icon: BarChart3,
          description: 'System-wide shop performance'
        },
        {
          title: 'Shop Approvals',
          path: '/admin/shops/approvals',
          icon: CheckCircle,
          description: 'Review new shop requests'
        }
      ]
    },
    {
      title: 'User Management',
      path: '/admin/users',
      icon: Users,
      description: 'Manage system users and roles',
      children: [
        {
          title: 'All Users',
          path: '/admin/users',
          icon: Users,
          description: 'View all system users'
        },
        {
          title: 'User Roles',
          path: '/admin/users/roles',
          icon: Shield,
          description: 'Manage user permissions'
        },
        {
          title: 'User Activity',
          path: '/admin/users/activity',
          icon: Activity,
          description: 'User login and activity logs'
        }
      ]
    },
    {
      title: 'Subscriptions',
      path: '/admin/subscriptions',
      icon: CreditCard,
      description: 'Manage shop subscriptions',
      children: [
        {
          title: 'All Subscriptions',
          path: '/admin/subscriptions',
          icon: CreditCard,
          description: 'View all shop subscriptions'
        },
        {
          title: 'Billing Management',
          path: '/admin/subscriptions/billing',
          icon: DollarSign,
          description: 'Manage billing and payments'
        },
        {
          title: 'Subscription Plans',
          path: '/admin/subscriptions/plans',
          icon: Star,
          description: 'Configure subscription tiers'
        }
      ]
    },
    {
      title: 'System Analytics',
      path: '/admin/analytics',
      icon: BarChart3,
      description: 'System-wide analytics and reports',
      children: [
        {
          title: 'System Overview',
          path: '/admin/analytics/overview',
          icon: PieChart,
          description: 'System performance metrics'
        },
        {
          title: 'Revenue Analytics',
          path: '/admin/analytics/revenue',
          icon: DollarSign,
          description: 'System revenue and growth'
        },
        {
          title: 'User Analytics',
          path: '/admin/analytics/users',
          icon: Users,
          description: 'User behavior and trends'
        }
      ]
    },
    {
      title: 'System Settings',
      path: '/admin/settings',
      icon: Settings,
      description: 'System configuration and preferences',
      children: [
        {
          title: 'General Settings',
          path: '/admin/settings/general',
          icon: Settings,
          description: 'System-wide settings'
        },
        {
          title: 'AI Configuration',
          path: '/admin/settings/ai',
          icon: Brain,
          description: 'AI and automation settings'
        },
        {
          title: 'Security Settings',
          path: '/admin/settings/security',
          icon: Lock,
          description: 'Security and access control'
        },
        {
          title: 'Integration Settings',
          path: '/admin/settings/integrations',
          icon: Globe,
          description: 'Third-party integrations'
        }
      ]
    },
    {
      title: 'System Monitoring',
      path: '/admin/monitoring',
      icon: Activity,
      description: 'System health and performance',
      children: [
        {
          title: 'System Health',
          path: '/admin/monitoring/health',
          icon: CheckCircle,
          description: 'System status and uptime'
        },
        {
          title: 'Performance Metrics',
          path: '/admin/monitoring/performance',
          icon: Zap,
          description: 'System performance data'
        },
        {
          title: 'Error Logs',
          path: '/admin/monitoring/logs',
          icon: AlertTriangle,
          description: 'System error and debug logs'
        }
      ]
    }
  ];

  const systemItems: NavItem[] = [
    {
      title: 'System Status',
      path: '/admin/status',
      icon: Activity,
      badge: '99.9%',
      description: 'System health and monitoring'
    },
    {
      title: 'Support Center',
      path: '/admin/support',
      icon: Bell,
      description: 'Customer support and tickets'
    }
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

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
                      variant={item.badge === '99.9%' ? 'default' : 'secondary'}
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
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">BillBlaze</h2>
              <p className="text-xs text-red-600 font-medium">
                Super Admin Panel
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
            System Management
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
            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.full_name || user?.email}
                </p>
                <p className="text-xs text-red-600 font-medium truncate">
                  Super Administrator
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                <Settings className="h-3 w-3 mr-1" />
                Settings
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={handleLogout}>
                <LogOut className="h-3 w-3 mr-1" />
                Logout
              </Button>
            </div>

            {/* System Status */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>System Online</span>
              </div>
              <span>v1.0.0</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminSidebar; 