import React from 'react';
import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Background Pattern */}
      <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23f97316" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-40'></div>
      
      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between p-6">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900">Premium Events</span>
          </Link>
          
          <Link 
            to="/" 
            className="text-gray-600 hover:text-gray-900 transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-auto">
        <div className="text-center py-6 text-gray-500 text-sm">
          <p>&copy; 2024 Premium Event Platform. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link to="/terms" className="hover:text-gray-700 transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-gray-700 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-gray-700 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
