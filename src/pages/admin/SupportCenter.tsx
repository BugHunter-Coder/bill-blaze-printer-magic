import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Users, Clock, CheckCircle, AlertTriangle, Plus, Search, Filter, Mail, Phone, Headphones } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SupportTicket {
  id: string;
  shop_name: string;
  owner_email: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  response?: string;
}

const SupportCenter = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [response, setResponse] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);

      // In a real app, you'd fetch from a support_tickets table
      // For now, we'll create mock data based on shops and users
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('*');

      if (shopsError) throw shopsError;

      // Create mock support tickets
      const mockTickets: SupportTicket[] = shops?.slice(0, 10).map((shop, index) => ({
        id: `ticket-${shop.id}`,
        shop_name: shop.name,
        owner_email: `owner${index + 1}@example.com`,
        subject: getMockSubject(index),
        description: getMockDescription(index),
        priority: getMockPriority(index),
        status: getMockStatus(index),
        category: getMockCategory(index),
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        assigned_to: index % 3 === 0 ? 'support@billblaze.com' : undefined,
        response: index % 2 === 0 ? 'Thank you for contacting support. We are investigating this issue.' : undefined
      })) || [];

      setTickets(mockTickets);

    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch support tickets.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMockSubject = (index: number) => {
    const subjects = [
      'Payment processing issue',
      'Cannot access dashboard',
      'Printer not working',
      'Product sync problem',
      'Login authentication error',
      'Report generation failed',
      'Mobile app crash',
      'Data export issue',
      'Subscription renewal problem',
      'API integration error'
    ];
    return subjects[index % subjects.length];
  };

  const getMockDescription = (index: number) => {
    const descriptions = [
      'Unable to process payments through the POS system. Getting error code 500.',
      'Dashboard is showing blank screen after login. Tried clearing cache but no success.',
      'Bluetooth printer is connected but not printing receipts. Shows "printer offline" error.',
      'Products are not syncing between web and mobile app. Changes made on web don\'t appear on mobile.',
      'Getting "Invalid credentials" error when trying to login. Password reset didn\'t help.',
      'Sales reports are not generating. System shows "processing" but never completes.',
      'Mobile app crashes immediately after opening. Works fine on other devices.',
      'Cannot export data to Excel. Download starts but file is corrupted.',
      'Subscription shows as expired but payment was made. Need urgent resolution.',
      'API calls are returning 403 errors. API key is valid and permissions are correct.'
    ];
    return descriptions[index % descriptions.length];
  };

  const getMockPriority = (index: number): 'low' | 'medium' | 'high' | 'urgent' => {
    const priorities: Array<'low' | 'medium' | 'high' | 'urgent'> = ['low', 'medium', 'high', 'urgent'];
    return priorities[index % priorities.length];
  };

  const getMockStatus = (index: number): 'open' | 'in_progress' | 'resolved' | 'closed' => {
    const statuses: Array<'open' | 'in_progress' | 'resolved' | 'closed'> = ['open', 'in_progress', 'resolved', 'closed'];
    return statuses[index % statuses.length];
  };

  const getMockCategory = (index: number) => {
    const categories = ['Technical', 'Billing', 'Feature Request', 'Bug Report', 'Account'];
    return categories[index % categories.length];
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket || !response.trim()) return;

    try {
      setSaving(true);

      // In a real app, you'd update the ticket in the database
      const updatedTickets = tickets.map(ticket =>
        ticket.id === selectedTicket.id
          ? { ...ticket, response, status: 'in_progress' as const, updated_at: new Date().toISOString() }
          : ticket
      );

      setTickets(updatedTickets);
      setDialogOpen(false);
      setSelectedTicket(null);
      setResponse('');

      toast({
        title: "Success",
        description: "Ticket updated successfully.",
      });

    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Urgent</Badge>;
      case 'high':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" />Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="text-blue-600">Open</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="text-yellow-600">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="default" className="text-green-600">Resolved</Badge>;
      case 'closed':
        return <Badge variant="outline" className="text-gray-600">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.owner_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
        <p className="text-gray-600">Manage customer support tickets and inquiries</p>
      </div>

      {/* Support Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats.resolved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats.urgent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Management */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tickets by shop, email, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredTickets.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No tickets found</p>
            ) : (
              filteredTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{ticket.subject}</h3>
                      <p className="text-sm text-gray-500">{ticket.shop_name} • {ticket.owner_email}</p>
                      <p className="text-xs text-gray-400">
                        {ticket.category} • {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      {getPriorityBadge(ticket.priority)}
                      {getStatusBadge(ticket.status)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setResponse(ticket.response || '');
                        setDialogOpen(true);
                      }}
                    >
                      {ticket.response ? 'Update' : 'Respond'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Ticket</DialogTitle>
            <DialogDescription>
              Provide a response to the support ticket.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{selectedTicket.subject}</h3>
                <p className="text-sm text-gray-500">{selectedTicket.shop_name} • {selectedTicket.owner_email}</p>
                <p className="text-sm text-gray-600 mt-2">{selectedTicket.description}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Response</label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Enter your response..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTicket}
              disabled={saving || !response.trim()}
            >
              {saving ? 'Saving...' : 'Send Response'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportCenter; 