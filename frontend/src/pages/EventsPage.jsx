import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Ticket, 
  Search, 
  Filter,
  Clock,
  Award,
  Eye
} from 'lucide-react';
import { eventsAPI } from '../utils/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Input from '../components/ui/Input';

const EventsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading, error, refetch } = useQuery(
    ['events', page, statusFilter, searchTerm],
    () => eventsAPI.getEvents({
      page,
      limit,
      status: statusFilter,
      search: searchTerm || undefined
    }),
    {
      keepPreviousData: true,
      staleTime: 30000
    }
  );

  const events = data?.data?.events || [];
  const pagination = data?.data?.pagination || {};

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: 'success', label: 'Active' },
      upcoming: { variant: 'primary', label: 'Upcoming' },
      ended: { variant: 'default', label: 'Ended' },
      pending: { variant: 'warning', label: 'Pending' },
      cancelled: { variant: 'error', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading && page === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Events</h3>
            <p className="text-gray-600 mb-4">{error.message || 'Failed to load events'}</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Discover Events</h1>
        <p className="text-gray-600">Find and participate in award events from around the world.</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              leftIcon={<Search className="w-5 h-5 text-gray-400" />}
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="active">Active Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="all">All Events</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms.' : 'Check back soon for new events!'}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {events.map((event) => (
              <Card key={event._id} hover className="overflow-hidden">
                {/* Event Image */}
                <div className="relative h-48 bg-gradient-to-br from-primary-100 to-secondary-100">
                  {event.banner ? (
                    <img
                      src={event.banner}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="w-16 h-16 text-primary-500" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(event.status)}
                  </div>
                </div>

                {/* Event Content */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-primary-500" />
                      {formatDate(event.eventDate)} at {event.eventTime || formatTime(event.eventDate)}
                    </div>
                    {event.location?.venue && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-primary-500" />
                        {event.location.venue}
                      </div>
                    )}
                    {event.categories?.length > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Award className="w-4 h-4 mr-2 text-primary-500" />
                        {event.categories.length} {event.categories.length === 1 ? 'Category' : 'Categories'}
                      </div>
                    )}
                    {event.analytics?.totalViews > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Eye className="w-4 h-4 mr-2 text-primary-500" />
                        {event.analytics.totalViews} views
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => navigate(`/events/${event._id}`)}
                    >
                      View Details
                    </Button>
                    {event.ticketingSettings?.enabled && (
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/events/${event._id}?tab=tickets`)}
                      >
                        <Ticket className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventsPage;