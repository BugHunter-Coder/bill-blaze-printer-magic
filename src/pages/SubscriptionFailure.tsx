import React from 'react';
import { XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

const SubscriptionFailure: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-white to-blue-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center max-w-md w-full">
        <XCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-700 text-center mb-6">
          Oops! Your payment was not successful or was cancelled.<br/>
          Please try again or contact support if you need help.
        </p>
        <Button className="w-full mb-2" onClick={() => navigate('/subscription')}>Return to Subscription</Button>
        <Button variant="outline" className="w-full" onClick={() => navigate('/')}>Return to Dashboard</Button>
      </div>
    </div>
  );
};

export default SubscriptionFailure; 