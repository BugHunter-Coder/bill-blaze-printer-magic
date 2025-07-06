import React from 'react';
import { ProductManagement } from '@/components/ProductManagement';

const ProductListPage = () => {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Manage Products</h1>
      <ProductManagement />
    </div>
  );
};

export default ProductListPage; 