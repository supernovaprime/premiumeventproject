import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Public Pages
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import VotePage from './pages/VotePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FaqPage from './pages/FaqPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

// User Dashboard
import UserDashboard from './pages/dashboard/UserDashboard';
import UserProfile from './pages/dashboard/UserProfile';
import UserTickets from './pages/dashboard/UserTickets';
import UserOrders from './pages/dashboard/UserOrders';
import UserVotes from './pages/dashboard/UserVotes';

// Organizer Dashboard
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import OrganizerEvents from './pages/organizer/OrganizerEvents';
import CreateEvent from './pages/organizer/CreateEvent';
import EditEvent from './pages/organizer/EditEvent';
import EventAnalytics from './pages/organizer/EventAnalytics';
import EventFinances from './pages/organizer/EventFinances';

// Admin Dashboard
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminEvents from './pages/admin/AdminEvents';
import AdminOrganizers from './pages/admin/AdminOrganizers';
import AdminAffiliates from './pages/admin/AdminAffiliates';
import AdminShop from './pages/admin/AdminShop';
import AdminFinances from './pages/admin/AdminFinances';
import AdminSettings from './pages/admin/AdminSettings';

// Affiliate Dashboard
import AffiliateDashboard from './pages/affiliate/AffiliateDashboard';
import AffiliateReferrals from './pages/affiliate/AffiliateReferrals';
import AffiliateEarnings from './pages/affiliate/AffiliateEarnings';
import AffiliatePayouts from './pages/affiliate/AffiliatePayouts';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';

// 404 Page
import NotFoundPage from './pages/NotFoundPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <>
      <Routes>
      {/* Public Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="/events/:eventId/vote" element={<VotePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:productId" element={<ProductDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FaqPage />} />
      </Route>

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <LoginPage />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} 
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      </Route>

      {/* User Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<UserDashboard />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="tickets" element={<UserTickets />} />
        <Route path="orders" element={<UserOrders />} />
        <Route path="votes" element={<UserVotes />} />
      </Route>

      {/* Organizer Dashboard Routes */}
      <Route
        path="/organizer"
        element={
          <ProtectedRoute allowedRoles={['organizer', 'admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OrganizerDashboard />} />
        <Route path="events" element={<OrganizerEvents />} />
        <Route path="events/create" element={<CreateEvent />} />
        <Route path="events/:eventId/edit" element={<EditEvent />} />
        <Route path="events/:eventId/analytics" element={<EventAnalytics />} />
        <Route path="events/:eventId/finances" element={<EventFinances />} />
      </Route>

      {/* Admin Dashboard Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="organizers" element={<AdminOrganizers />} />
        <Route path="affiliates" element={<AdminAffiliates />} />
        <Route path="shop" element={<AdminShop />} />
        <Route path="finances" element={<AdminFinances />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Affiliate Dashboard Routes */}
      <Route
        path="/affiliate"
        element={
          <ProtectedRoute allowedRoles={['affiliate', 'admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AffiliateDashboard />} />
        <Route path="referrals" element={<AffiliateReferrals />} />
        <Route path="earnings" element={<AffiliateEarnings />} />
        <Route path="payouts" element={<AffiliatePayouts />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
      </Routes>
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
