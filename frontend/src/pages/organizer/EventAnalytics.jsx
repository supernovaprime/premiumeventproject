import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Users,
  Ticket,
  DollarSign,
  Download,
  Eye,
  Trophy,
  Calendar
} from 'lucide-react';
import { eventsAPI } from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

const EventAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: analyticsData, isLoading } = useQuery(
    ['eventAnalytics', id],
    () => eventsAPI.getEventAnalytics(id),
    {
      enabled: !!id,
      refetchInterval: 30000 // Refetch every 30 seconds
    }
  );

  const { data: eventData } = useQuery(
    ['event', id],
    () => eventsAPI.getEventById(id),
    { enabled: !!id }
  );

  const analytics = analyticsData?.data?.analytics || {};
  const event = eventData?.data?.event;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const statCards = [
    {
      icon: Eye,
      label: 'Total Views',
      value: analytics.totalViews?.toLocaleString() || '0',
      color: 'from-secondary-500 to-secondary-600'
    },
    {
      icon: Ticket,
      label: 'Tickets Sold',
      value: analytics.ticketsSold?.toLocaleString() || '0',
      color: 'from-success-500 to-success-600'
    },
    {
      icon: DollarSign,
      label: 'Revenue',
      value: `$${analytics.revenue?.toLocaleString() || '0'}`,
      color: 'from-primary-500 to-primary-600'
    },
    {
      icon: Trophy,
      label: 'Total Votes',
      value: analytics.totalVotes?.toLocaleString() || '0',
      color: 'from-warning-500 to-warning-600'
    },
    {
      icon: Users,
      label: 'Unique Voters',
      value: analytics.uniqueVoters?.toLocaleString() || '0',
      color: 'from-primary-500 to-primary-600'
    },
    {
      icon: Calendar,
      label: 'Categories',
      value: event?.categories?.length || 0,
      color: 'from-secondary-500 to-secondary-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/organizer/events')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Analytics</h1>
            <p className="text-gray-600 mt-2">{event?.title}</p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.label}</h3>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Sales Over Time */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ticket Sales Over Time</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Chart visualization coming soon</p>
            </div>
          </div>
        </Card>

        {/* Vote Distribution */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Vote Distribution</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Chart visualization coming soon</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Performing Categories */}
      {analytics.topCategories && analytics.topCategories.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Performing Categories</h2>
          <div className="space-y-4">
            {analytics.topCategories.map((category, index) => (
              <div key={category._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-primary-600">#{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.totalVotes || 0} votes</p>
                  </div>
                </div>
                <Badge variant="primary">{category.totalVotes || 0} votes</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          <p>Activity feed coming soon</p>
        </div>
      </Card>
    </div>
  );
};

export default EventAnalytics;