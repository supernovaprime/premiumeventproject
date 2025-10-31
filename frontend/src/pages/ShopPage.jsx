import React from 'react';
import Card from '../components/ui/Card';

const ShopPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Award Shop</h1>
        <p className="text-gray-600">Browse and purchase award materials, plaques, and certificates.</p>
      </div>
      
      <Card>
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Shop Coming Soon</h3>
          <p className="text-gray-600">Our award materials shop is under construction. Check back soon!</p>
        </div>
      </Card>
    </div>
  );
};

export default ShopPage;
