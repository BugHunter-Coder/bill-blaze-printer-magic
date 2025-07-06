import React from 'react';
import { ProductManagement } from '@/components/ProductManagement';

const InventoryPage = () => {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>
      <ProductManagement />
    </div>
  );
};

export default InventoryPage; 