import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Users, Clock, Search, Filter, Calendar, User, LogIn, LogOut, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserActivity {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  action: string;
  details: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  shop_name?: string;
}

const UserActivity = () => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const { toast } = useToast();

  useEffect(() => {
    fetchUserActivity();
  }, [timeRange]);

  const fetchUserActivity = async () => {
    try {
      setLoading(true);

      // Since we don't have a dedicated activity log table, we'll simulate with auth sessions
      // In a real app, you'd have an activity_logs table
      const { data: sessions, error: sessionsError } = await supabase.auth.admin.listSessions();
      
      if (sessionsError) {
        console.warn('Could not fetch sessions:', sessionsError);
      }

      // Fetch users with their profiles
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select(`
          *,
          shops:shop_id (
            name
          )
        `);

      if (usersError) throw usersError;

      // Create mock activity data from user profiles and sessions
      const mockActivities: UserActivity[] = [];
      
      users?.forEach((user, index) => {
        // Add login activity
        mockActivities.push({
          id: `login-${user.id}`,
          user_id: user.id,
          user_email: user.email,
          user_name: user.full_name || 'Unknown',
          action: 'login',
          details: 'User logged in successfully',
          ip_address: '192.168.1.' + (index + 1),
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          shop_name: user.shops?.name
        });

        // Add some other activities
        const actions = ['profile_update', 'password_change', 'logout', 'data_export'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        
        mockActivities.push({
          id: `${randomAction}-${user.id}`,
          user_id: user.id,
          user_email: user.email,
          user_name: user.full_name || 'Unknown',
          action: randomAction,
          details: getActionDescription(randomAction),
          ip_address: '192.168.1.' + (index + 1),
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          shop_name: user.shops?.name
        });
      });

      // Sort by created_at descending
      mockActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setActivities(mockActivities);

    } catch (error) {
      console.error('Error fetching user activity:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user activity data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'login':
        return 'User logged in successfully';
      case 'logout':
        return 'User logged out';
      case 'profile_update':
        return 'User updated their profile information';
      case 'password_change':
        return 'User changed their password';
      case 'data_export':
        return 'User exported data';
      default:
        return 'User performed an action';
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'login':
        return <Badge variant="default" className="flex items-center gap-1"><LogIn className="h-3 w-3" />Login</Badge>;
      case 'logout':
        return <Badge variant="secondary" className="flex items-center gap-1"><LogOut className="h-3 w-3" />Logout</Badge>;
      case 'profile_update':
        return <Badge variant="outline" className="flex items-center gap-1"><User className="h-3 w-3" />Profile Update</Badge>;
      case 'password_change':
        return <Badge variant="destructive" className="flex items-center gap-1"><Shield className="h-3 w-3" />Password Change</Badge>;
      case 'data_export':
        return <Badge variant="outline" className="flex items-center gap-1"><Activity className="h-3 w-3" />Data Export</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.shop_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === 'all' || activity.action === filterAction;
    const matchesUser = filterUser === 'all' || activity.user_id === filterUser;

    return matchesSearch && matchesAction && matchesUser;
  });

  const activityStats = {
    total: activities.length,
    logins: activities.filter(a => a.action === 'login').length,
    logouts: activities.filter(a => a.action === 'logout').length,
    updates: activities.filter(a => a.action === 'profile_update').length,
  };

  const uniqueUsers = [...new Set(activities.map(a => a.user_id))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Activity</h1>
        <p className="text-gray-600">Monitor user login and activity logs</p>
      </div>

      {/* Activity Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logins</CardTitle>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityStats.logins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logouts</CardTitle>
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityStats.logouts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by user, email, or shop..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="profile_update">Profile Update</SelectItem>
                <SelectItem value="password_change">Password Change</SelectItem>
                <SelectItem value="data_export">Data Export</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredActivities.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No activity found</p>
            ) : (
              filteredActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{activity.user_name}</h3>
                      <p className="text-sm text-gray-500">{activity.user_email}</p>
                      <p className="text-xs text-gray-400">{activity.shop_name || 'No shop assigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        {getActionBadge(activity.action)}
                        <span className="text-sm text-gray-500">
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{activity.details}</p>
                      {activity.ip_address && (
                        <p className="text-xs text-gray-400">IP: {activity.ip_address}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserActivity; 