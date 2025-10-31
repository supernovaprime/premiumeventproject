import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    const dashboardPath = getDashboardPath(user.role);
    return <Navigate to={dashboardPath} replace />;
  }

  // Check if email verification is required
  if (user.role !== 'admin' && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
};

// Helper function to get dashboard path based on role
const getDashboardPath = (role) => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'organizer':
      return '/organizer';
    case 'affiliate':
      return '/affiliate';
    default:
      return '/dashboard';
  }
};

export default ProtectedRoute;
