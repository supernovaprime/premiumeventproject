import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Calendar, 
  Ticket, 
  Trophy, 
  Users, 
  Edit, 
  Eye, 
  Trash2, 
  Plus,
  Search,
  Filter,
  BarChart3,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { eventsAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const OrganizerEvents = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const limit = 12;

  const { data, isLoading } = useQuery(
    ['organizerEvents', user?._id, page, statusFilter, searchTerm],
    () => eventsAPI.getEventsByOrganizer(user?._id, {
      page,
      limit,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchTerm || undefined
    }),
    {
      enabled: !!user?._id,
      keepPreviousData: true
    }
  );

  const queryClient = useQueryClient();

  const deleteEventMutation = useMutation(
    (eventId) => eventsAPI.deleteEvent(eventId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('organizerEvents');
        toast.success('Event deleted successfully');
        setDeleteModalOpen(false);
        setSelectedEvent(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete event');
      }
    }
  );

  const events = data?.data?.events || [];
  const pagination = data?.data?.pagination || {};

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { variant: 'success', label: 'Approved' },
      pending: { variant: 'warning', label: 'Pending' },
      rejected: { variant: 'error', label: 'Rejected' },
      active: { variant: 'primary', label: 'Active' },
      ended: { variant: 'default', label: 'Ended' },
      cancelled: { variant: 'error', label: 'Cancelled' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading && page === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
          <p className="text-gray-600 mt-2">Manage all your award events</p>
        </div>
        <Link to="/organizer/events/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            leftIcon={<Search className="w-5 h-5 text-gray-400" />}
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Events</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </Card>

      {/* Events Grid */}
      {events.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first event.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link to="/organizer/events/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Event
                </Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event._id} hover>
                {/* Event Image */}
                <div className="relative h-48 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg mb-4 overflow-hidden">
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
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(event.status)}
                  </div>
                </div>

                {/* Event Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Trophy className="w-4 h-4 text-warning-500 mx-auto mb-1" />
                      <p className="text-xs font-medium text-gray-900">
                        {event.categories?.length || 0}
                      </p>
                      <p className="text-xs text-gray-500">Categories</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Ticket className="w-4 h-4 text-success-500 mx-auto mb-1" />
                      <p className="text-xs font-medium text-gray-900">
                        {event.analytics?.ticketsSold || 0}
                      </p>
                      <p className="text-xs text-gray-500">Tickets</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Users className="w-4 h-4 text-primary-500 mx-auto mb-1" />
                      <p className="text-xs font-medium text-gray-900">
                        {event.analytics?.totalVotes || 0}
                      </p>
                      <p className="text-xs text-gray-500">Votes</p>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(event.eventDate)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/events/${event._id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    {event.status !== 'ended' && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(`/organizer/events/${event._id}/edit`)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/organizer/events/${event._id}/analytics`)}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    {event.status === 'pending' && (
                      <Button
                        variant="error"
                        size="sm"
                        onClick={() => {
                          setSelectedEvent(event);
                          setDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.totalEvents)} of {pagination.totalEvents} events
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedEvent(null);
        }}
        title="Delete Event"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedEvent?.title}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="error"
              onClick={() => {
                deleteEventMutation.mutate(selectedEvent._id);
              }}
              disabled={deleteEventMutation.isLoading}
            >
              Delete Event
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedEvent(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrganizerEvents;