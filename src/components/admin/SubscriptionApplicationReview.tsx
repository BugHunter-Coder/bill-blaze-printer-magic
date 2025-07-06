import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Store, 
  User, 
  Calendar,
  MessageSquare,
  Star,
  Crown,
  Zap
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface SubscriptionApplication {
  id: string;
  shop_id: string;
  shop_name: string;
  owner_id: string;
  requested_tier: 'basic' | 'premium' | 'enterprise';
  application_reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export const SubscriptionApplicationReview = () => {
  const [applications, setApplications] = useState<SubscriptionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<SubscriptionApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications((data || []).map(app => ({
        ...app,
        requested_tier: app.requested_tier as 'basic' | 'premium' | 'enterprise',
        status: app.status as 'pending' | 'approved' | 'rejected' | 'cancelled'
      })));
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subscription applications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (applicationId: string, status: 'approved' | 'rejected') => {
    if (!selectedApplication) return;

    try {
      setProcessing(true);

      // Update application status
      const { error: updateError } = await supabase
        .from('subscription_applications')
        .update({
          status,
          review_notes: reviewNotes,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // If approved, create or update subscriber record
      if (status === 'approved') {
        const { error: subscriberError } = await supabase
          .from('subscribers')
          .upsert({
            email: '', // Will be filled from profile
            user_id: selectedApplication.owner_id,
            subscribed: true,
            subscription_tier: selectedApplication.requested_tier,
            subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (subscriberError) throw subscriberError;
      }

      await fetchApplications();
      setDialogOpen(false);
      setSelectedApplication(null);
      setReviewNotes('');

      toast({
        title: "Success",
        description: `Application ${status} successfully.`,
      });
    } catch (error) {
      console.error('Error reviewing application:', error);
      toast({
        title: "Error",
        description: "Failed to review application.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="text-xs"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-xs"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-xs">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'basic':
        return <Star className="h-4 w-4 text-blue-600" />;
      case 'premium':
        return <Crown className="h-4 w-4 text-purple-600" />;
      case 'enterprise':
        return <Zap className="h-4 w-4 text-orange-600" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm sm:text-base">Loading applications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
            Subscription Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {applications.filter(app => app.status === 'pending').length}
              </div>
              <div className="text-sm text-blue-800">Pending Review</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {applications.filter(app => app.status === 'approved').length}
              </div>
              <div className="text-sm text-green-800">Approved</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {applications.filter(app => app.status === 'rejected').length}
              </div>
              <div className="text-sm text-red-800">Rejected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {applications.map((application) => (
          <Card key={application.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg flex items-center">
                  <Store className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                  <span className="truncate">{application.shop_name}</span>
                </CardTitle>
                {getStatusBadge(application.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                <div className="flex items-center space-x-2">
                  {getTierIcon(application.requested_tier)}
                  <span><strong>Tier:</strong> {application.requested_tier}</span>
                </div>
                <p className="truncate"><strong>Owner ID:</strong> {application.owner_id}</p>
                <p><strong>Applied:</strong> {new Date(application.created_at).toLocaleDateString()}</p>
                {application.application_reason && (
                  <p className="text-xs text-gray-500 truncate">
                    <strong>Reason:</strong> {application.application_reason}
                  </p>
                )}
              </div>

              {application.status === 'pending' && (
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      setSelectedApplication(application);
                      setDialogOpen(true);
                    }}
                    className="flex-1 sm:flex-none text-xs"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Review
                  </Button>
                </div>
              )}

              {application.status !== 'pending' && application.review_notes && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <strong>Review Notes:</strong> {application.review_notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {applications.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <FileText className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
          <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No applications found</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            No subscription applications have been submitted yet.
          </p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>
              Review the subscription application for {selectedApplication?.shop_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Store className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{selectedApplication.shop_name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getTierIcon(selectedApplication.requested_tier)}
                  <span>Requesting {selectedApplication.requested_tier} tier</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Applied on {new Date(selectedApplication.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {selectedApplication.application_reason && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Application Reason</Label>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {selectedApplication.application_reason}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="review-notes" className="text-sm font-medium">
                  Review Notes (Optional)
                </Label>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes about your decision..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedApplication && handleReview(selectedApplication.id, 'rejected')}
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Reject'}
            </Button>
            <Button 
              onClick={() => selectedApplication && handleReview(selectedApplication.id, 'approved')}
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 