import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { eventsAPI } from '../../utils/api';
import { 
  Calendar, 
  Ticket, 
  Users, 
  TrendingUp, 
  DollarSign,
  Trophy,
  Clock,
  BarChart3,
  Plus,
  Eye,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

const OrganizerDashboard = () => {
  const { user } = useAuth();

  // Fetch organizer events
  const { data: eventsData, isLoading: eventsLoading } = useQuery(
    'organizerEvents',
    () => eventsAPI.getEventsByOrganizer(user?._id, { limit: 100 }),
    {
      enabled: !!user?._id,
      refetchInterval: 30000
    }
  );

  const events = eventsData?.data?.events || [];

  // Calculate stats
  const stats = {
    totalEvents: events.length,
    activeEvents: events.filter(e => e.status === 'active' || e.status === 'approved').length,
    pendingApproval: events.filter(e => e.status === 'pending').length,
    totalTickets: events.reduce((sum, e) => sum + (e.analytics?.ticketsSold || 0), 0),
    totalRevenue: events.reduce((sum, e) => sum + (e.analytics?.revenue || 0), 0),
    totalVotes: events.reduce((sum, e) => sum + (e.analytics?.totalVotes || 0), 0)
  };

  const recentEvents = events.slice(0, 5);

  if (eventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const statCards = [
    {
      icon: Calendar,
      label: 'Total Events',
      value: stats.totalEvents,
      color: 'from-secondary-500 to-secondary-600',
      link: '/organizer/events'
    },
    {
      icon: Ticket,
      label: 'Tickets Sold',
      value: stats.totalTickets.toLocaleString(),
      color: 'from-success-500 to-success-600',
      link: '/organizer/events'
    },
    {
      icon: DollarSign,
      label: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      color: 'from-primary-500 to-primary-600',
      link: '/organizer/events'
    },
    {
      icon: Trophy,
      label: 'Total Votes',
      value: stats.totalVotes.toLocaleString(),
      color: 'from-warning-500 to-warning-600',
      link: '/organizer/events'
    },
    {
      icon: CheckCircle,
      label: 'Active Events',
      value: stats.activeEvents,
      color: 'from-success-500 to-success-600',
      link: '/organizer/events?status=active'
    },
    {
      icon: Clock,
      label: 'Pending Approval',
      value: stats.pendingApproval,
      color: 'from-warning-500 to-warning-600',
      link: '/organizer/events?status=pending'
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { variant: 'success', label: 'Approved' },
      pending: { variant: 'warning', label: 'Pending' },
      rejected: { variant: 'error', label: 'Rejected' },
      active: { variant: 'primary', label: 'Active' },
      ended: { variant: 'default', label: 'Ended' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.firstName || 'Organizer'}! Here's your event overview.
          </p>
        </div>
        <Link to="/organizer/events/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statCards.map((stat, index) => (
          <Link key={index} to={stat.link}>
            <Card hover className="h-full">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.label}</h3>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Events */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Events</h2>
          <Link to="/organizer/events">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first event.</p>
            <Link to="/organizer/events/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Event
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentEvents.map((event) => (
              <div
                key={event._id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg overflow-hidden flex-shrink-0">
                    {event.banner ? (
                      <img
                        src={event.banner}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-primary-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      {getStatusBadge(event.status)}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1">{event.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                      {event.analytics?.ticketsSold > 0 && (
                        <span>{event.analytics.ticketsSold} tickets sold</span>
                      )}
                      {event.analytics?.totalVotes > 0 && (
                        <span>{event.analytics.totalVotes} votes</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/events/${event._id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </Link>
                  <Link to={`/organizer/events/${event._id}/analytics`}>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover className="cursor-pointer" onClick={() => window.location.href = '/organizer/events/create'}>
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Create New Event</h3>
            <p className="text-sm text-gray-600">Set up a new award event</p>
          </div>
        </Card>

        <Card hover className="cursor-pointer" onClick={() => window.location.href = '/organizer/events'}>
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-secondary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Manage Events</h3>
            <p className="text-sm text-gray-600">View and edit your events</p>
          </div>
        </Card>

        <Card hover className="cursor-pointer" onClick={() => window.location.href = '/organizer/events?status=pending'}>
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-warning-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Pending Approvals</h3>
            <p className="text-sm text-gray-600">{stats.pendingApproval} events awaiting approval</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OrganizerDashboard;