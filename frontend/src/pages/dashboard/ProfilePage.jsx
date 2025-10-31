import React from 'react';
import Card from '../../components/ui/Card';

const ProfilePage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">Manage your profile information and preferences.</p>
      </div>
      
      <Card>
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile Page Coming Soon</h3>
          <p className="text-gray-600">We're building your profile management page. Check back soon!</p>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
