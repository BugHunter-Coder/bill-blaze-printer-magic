import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || 'https://mkosolisgvvukreooren.functions.supabase.co';

const SubscriptionSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Get session_id from query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const session_id = params.get('session_id');
    if (session_id) {
      setSyncing(true);
      fetch(`${SUPABASE_FUNCTIONS_URL}/stripe-sync-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id }),
      })
        .then(async res => {
          const data = await res.json();
          console.log('Stripe sync response:', data);
          if (data.success) {
            setSyncSuccess(true);
            // Optionally, trigger a refetch of subscription info here
          } else {
            setSyncError(data.error || 'Failed to sync subscription.');
          }
        })
        .catch((err) => {
          setSyncError('Failed to sync subscription: ' + err.message);
        })
        .finally(() => setSyncing(false));
    }
  }, [location.search]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center max-w-md w-full">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription Successful!</h1>
        <p className="text-gray-700 text-center mb-6">
          Thank you for subscribing to BillBlaze POS. Your subscription is now <span className="font-semibold text-green-700">active</span>.<br/>
          You can now access all premium features.
        </p>
        {syncing && <div className="text-blue-600 mb-2">Syncing your subscription...</div>}
        {syncError && <div className="text-red-600 mb-2">{syncError}</div>}
        {syncSuccess && <div className="text-green-700 mb-2">Your subscription is now active!</div>}
        <Button className="w-full" onClick={() => navigate('/')}>Return to Dashboard</Button>
      </div>
    </div>
  );
};

export default SubscriptionSuccess; 