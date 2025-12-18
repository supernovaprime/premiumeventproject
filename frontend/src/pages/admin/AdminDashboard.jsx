import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Ticket, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  ShoppingBag,
  UserCheck,
  Activity
} from 'lucide-react';
import { usersAPI, eventsAPI, paymentsAPI, shopAPI, affiliatesAPI } from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminDashboard = () => {
  // Fetch all statistics
  const { data: userStats, isLoading: usersLoading } = useQuery(
    'adminUserStats',
    () => usersAPI.getUserStats(),
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );

  const { data: eventsData, isLoading: eventsLoading } = useQuery(
    'adminEvents',
    () => eventsAPI.getEvents({ page: 1, limit: 5, status: 'pending' }),
    { refetchInterval: 30000 }
  );

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery(
    'adminPayments',
    () => paymentsAPI.getPaymentStats(),
    { refetchInterval: 60000 }
  );

  const stats = userStats?.data?.stats || {};
  const pendingEvents = eventsData?.data?.events || [];
  const paymentStats = paymentsData?.data?.stats || {};

  const isLoading = usersLoading || eventsLoading || paymentsLoading;

  const statCards = [
    {
      icon: Users,
      label: 'Total Users',
      value: stats.totalUsers || 0,
      color: 'from-secondary-500 to-secondary-600',
      link: '/admin/users'
    },
    {
      icon: UserCheck,
      label: 'Organizers',
      value: stats.organizers || 0,
      color: 'from-primary-500 to-primary-600',
      link: '/admin/organizers'
    },
    {
      icon: Calendar,
      label: 'Total Events',
      value: stats.totalEvents || 0,
      color: 'from-primary-500 to-primary-600',
      link: '/admin/events'
    },
    {
      icon: Clock,
      label: 'Pending Events',
      value: pendingEvents.length || 0,
      color: 'from-warning-500 to-warning-600',
      link: '/admin/events?status=pending'
    },
    {
      icon: Ticket,
      label: 'Total Tickets',
      value: paymentStats.totalTickets || 0,
      color: 'from-success-500 to-success-600',
      link: '/admin/events'
    },
    {
      icon: DollarSign,
      label: 'Total Revenue',
      value: `$${(paymentStats.totalRevenue || 0).toLocaleString()}`,
      color: 'from-success-500 to-success-600',
      link: '/admin/finances'
    },
    {
      icon: ShoppingBag,
      label: 'Shop Orders',
      value: paymentStats.totalOrders || 0,
      color: 'from-secondary-500 to-secondary-600',
      link: '/admin/shop'
    },
    {
      icon: UserCheck,
      label: 'Affiliates',
      value: stats.affiliates || 0,
      color: 'from-primary-500 to-primary-600',
      link: '/admin/affiliates'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of platform statistics and activities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Link key={index} to={stat.link}>
            <Card hover className="h-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/events?status=pending">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
              <AlertCircle className="w-6 h-6 mb-2" />
              Review Events
            </Button>
          </Link>
          <Link to="/admin/users">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
              <Users className="w-6 h-6 mb-2" />
              Manage Users
            </Button>
          </Link>
          <Link to="/admin/finances">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
              <DollarSign className="w-6 h-6 mb-2" />
              View Finances
            </Button>
          </Link>
          <Link to="/admin/settings">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
              <BarChart3 className="w-6 h-6 mb-2" />
              Settings
            </Button>
          </Link>
        </div>
      </Card>

      {/* Pending Events */}
      {pendingEvents.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Pending Event Approvals</h2>
            <Link to="/admin/events?status=pending">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          <div className="space-y-4">
            {pendingEvents.slice(0, 5).map((event) => (
              <div
                key={event._id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                  <p className="text-sm text-gray-600">
                    Organizer: {event.organizer?.firstName} {event.organizer?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(event.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/admin/events/${event._id}`}>
                    <Button variant="outline" size="sm">Review</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>Activity feed coming soon</p>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;