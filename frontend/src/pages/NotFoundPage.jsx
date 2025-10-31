import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-9xl font-bold text-primary-500 mb-4">404</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Page Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. 
            It might have been moved, deleted, or doesn't exist.
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          
          <Link to="/">
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Need help? <Link to="/contact" className="text-primary-500 hover:text-primary-600">Contact Support</Link></p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
