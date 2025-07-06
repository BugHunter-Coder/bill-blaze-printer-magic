import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, XCircle, Activity, Server, Database, Globe, Wifi, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemHealth {
  overallStatus: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastCheck: string;
  services: Array<{
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    responseTime: number;
    lastCheck: string;
    description: string;
  }>;
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  incidents: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    status: 'resolved' | 'investigating' | 'monitoring';
    createdAt: string;
    resolvedAt?: string;
  }>;
}

const SystemHealth = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSystemHealth();
  }, []);

  const fetchSystemHealth = async () => {
    try {
      setLoading(true);

      // Test database connection
      const { data: dbTest, error: dbError } = await supabase
        .from('shops')
        .select('count')
        .limit(1);

      // Mock system health data
      const services = [
        {
          name: 'Database',
          status: dbError ? 'critical' as const : 'healthy' as const,
          responseTime: dbError ? 5000 : 45,
          lastCheck: new Date().toISOString(),
          description: 'PostgreSQL database connection'
        },
        {
          name: 'API Gateway',
          status: 'healthy' as const,
          responseTime: 23,
          lastCheck: new Date().toISOString(),
          description: 'REST API endpoints'
        },
        {
          name: 'Authentication',
          status: 'healthy' as const,
          responseTime: 67,
          lastCheck: new Date().toISOString(),
          description: 'User authentication service'
        },
        {
          name: 'File Storage',
          status: 'warning' as const,
          responseTime: 234,
          lastCheck: new Date().toISOString(),
          description: 'Supabase storage service'
        },
        {
          name: 'Email Service',
          status: 'healthy' as const,
          responseTime: 89,
          lastCheck: new Date().toISOString(),
          description: 'Email delivery service'
        }
      ];

      const metrics = {
        cpu: 45,
        memory: 67,
        disk: 23,
        network: 89
      };

      const incidents = [
        {
          id: '1',
          title: 'File Storage Performance Degradation',
          description: 'Increased response times for file uploads and downloads',
          severity: 'medium' as const,
          status: 'investigating' as const,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          title: 'Database Connection Pool Exhaustion',
          description: 'High number of concurrent database connections',
          severity: 'high' as const,
          status: 'resolved' as const,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          resolvedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        }
      ];

      // Calculate overall status
      const criticalServices = services.filter(s => s.status === 'critical').length;
      const warningServices = services.filter(s => s.status === 'warning').length;
      
      let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (criticalServices > 0) {
        overallStatus = 'critical';
      } else if (warningServices > 0) {
        overallStatus = 'warning';
      }

      setHealth({
        overallStatus,
        uptime: 99.9,
        lastCheck: new Date().toISOString(),
        services,
        metrics,
        incidents
      });

    } catch (error) {
      console.error('Error fetching system health:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system health data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSystemHealth();
    setRefreshing(false);
    toast({
      title: "Success",
      description: "System health data refreshed.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Healthy</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Warning</Badge>;
      case 'critical':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Critical</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getIncidentStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge variant="default" className="text-green-600">Resolved</Badge>;
      case 'investigating':
        return <Badge variant="secondary" className="text-yellow-600">Investigating</Badge>;
      case 'monitoring':
        return <Badge variant="outline" className="text-blue-600">Monitoring</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-600">Monitor system status and uptime</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getStatusIcon(health?.overallStatus || 'healthy')}
            <span>Overall System Status</span>
            {getStatusBadge(health?.overallStatus || 'healthy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{health?.uptime}%</div>
              <p className="text-sm text-gray-500">Uptime (30 days)</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {health?.services.filter(s => s.status === 'healthy').length}
              </div>
              <p className="text-sm text-gray-500">Healthy Services</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">
                {new Date(health?.lastCheck || '').toLocaleTimeString()}
              </div>
              <p className="text-sm text-gray-500">Last Check</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {health?.services.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(service.status)}
                  <div>
                    <h3 className="font-medium">{service.name}</h3>
                    <p className="text-sm text-gray-500">{service.description}</p>
                    <p className="text-xs text-gray-400">
                      Last check: {new Date(service.lastCheck).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{service.responseTime}ms</div>
                  <div className="text-sm text-gray-500">Response time</div>
                  {getStatusBadge(service.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <span className="text-sm text-gray-500">{health?.metrics.cpu}%</span>
                </div>
                <Progress value={health?.metrics.cpu} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <span className="text-sm text-gray-500">{health?.metrics.memory}%</span>
                </div>
                <Progress value={health?.metrics.memory} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Disk Usage</span>
                  <span className="text-sm text-gray-500">{health?.metrics.disk}%</span>
                </div>
                <Progress value={health?.metrics.disk} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Network</span>
                  <span className="text-sm text-gray-500">{health?.metrics.network}%</span>
                </div>
                <Progress value={health?.metrics.network} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {health?.incidents.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No recent incidents</p>
              ) : (
                health?.incidents.map((incident) => (
                  <div key={incident.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{incident.title}</h3>
                      {getIncidentStatusBadge(incident.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Created: {new Date(incident.createdAt).toLocaleString()}</span>
                      {incident.resolvedAt && (
                        <span>Resolved: {new Date(incident.resolvedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemHealth; 