import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Users, 
  ShoppingBag, 
  BarChart3, 
  Settings, 
  Bell, 
  User, 
  LogOut,
  Menu,
  X,
  Award,
  Ticket,
  Vote,
  DollarSign,
  TrendingUp,
  Package,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
    ];

    switch (user?.role) {
      case 'admin':
        return [
          ...baseItems,
          { name: 'Events', href: '/admin/events', icon: Calendar },
          { name: 'Users', href: '/admin/users', icon: Users },
          { name: 'Affiliates', href: '/admin/affiliates', icon: UserCheck },
          { name: 'Shop', href: '/admin/shop', icon: ShoppingBag },
          { name: 'Payments', href: '/admin/payments', icon: DollarSign },
          { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
          { name: 'Notifications', href: '/admin/notifications', icon: Bell },
          { name: 'Settings', href: '/admin/settings', icon: Settings },
        ];
      
      case 'organizer':
        return [
          ...baseItems,
          { name: 'My Events', href: '/organizer/events', icon: Calendar },
          { name: 'Create Event', href: '/organizer/events/create', icon: Calendar },
          { name: 'Categories', href: '/organizer/categories', icon: Award },
          { name: 'Nominees', href: '/organizer/nominees', icon: Users },
          { name: 'Votes', href: '/organizer/votes', icon: Vote },
          { name: 'Tickets', href: '/organizer/tickets', icon: Ticket },
          { name: 'Analytics', href: '/organizer/analytics', icon: BarChart3 },
          { name: 'Earnings', href: '/organizer/earnings', icon: TrendingUp },
          { name: 'Shop', href: '/organizer/shop', icon: ShoppingBag },
          { name: 'Settings', href: '/organizer/settings', icon: Settings },
        ];
      
      case 'affiliate':
        return [
          ...baseItems,
          { name: 'Referrals', href: '/affiliate/referrals', icon: Users },
          { name: 'Earnings', href: '/affiliate/earnings', icon: DollarSign },
          { name: 'Payouts', href: '/affiliate/payouts', icon: TrendingUp },
          { name: 'Leaderboard', href: '/affiliate/leaderboard', icon: BarChart3 },
          { name: 'Settings', href: '/affiliate/settings', icon: Settings },
        ];
      
      default:
        return [
          ...baseItems,
          { name: 'My Events', href: '/user/events', icon: Calendar },
          { name: 'My Votes', href: '/user/votes', icon: Vote },
          { name: 'My Tickets', href: '/user/tickets', icon: Ticket },
          { name: 'Orders', href: '/user/orders', icon: Package },
          { name: 'Messages', href: '/user/messages', icon: MessageSquare },
          { name: 'Settings', href: '/user/settings', icon: Settings },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">Premium Events</span>
          </Link>
          
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href || 
                           (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-500'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
              </button>

              {/* User menu */}
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role}
                  </p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
