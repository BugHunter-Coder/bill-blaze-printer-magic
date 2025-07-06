import React from 'react';
import { TransactionManager } from '@/components/admin/TransactionManager';

const TransactionHistoryPage = () => {
  // TODO: Fetch or provide shops as needed
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Transaction History</h1>
      <TransactionManager shops={[]} />
    </div>
  );
};

export default TransactionHistoryPage; 