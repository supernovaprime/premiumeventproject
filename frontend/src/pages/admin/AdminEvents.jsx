import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Users,
  Ticket,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { eventsAPI } from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const AdminEvents = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const limit = 10;

  const { data, isLoading, error } = useQuery(
    ['adminEvents', page, statusFilter, searchTerm],
    () => eventsAPI.getEvents({
      page,
      limit,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchTerm || undefined
    }),
    {
      keepPreviousData: true,
      refetchInterval: 30000 // Refetch every 30 seconds for pending events
    }
  );

  const approveMutation = useMutation(
    ({ eventId, adminNotes }) => eventsAPI.approveEvent(eventId, adminNotes),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminEvents');
        toast.success('Event approved successfully');
        setApprovalModalOpen(false);
        setSelectedEvent(null);
        setAdminNotes('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve event');
      }
    }
  );

  const rejectMutation = useMutation(
    ({ eventId, rejectionReason, adminNotes }) => 
      eventsAPI.rejectEvent(eventId, rejectionReason, adminNotes),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminEvents');
        toast.success('Event rejected');
        setRejectionModalOpen(false);
        setSelectedEvent(null);
        setRejectionReason('');
        setAdminNotes('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reject event');
      }
    }
  );

  const events = data?.data?.events || [];
  const pagination = data?.data?.pagination || {};

  const handleApprove = (event) => {
    setSelectedEvent(event);
    setApprovalModalOpen(true);
  };

  const handleReject = (event) => {
    setSelectedEvent(event);
    setRejectionModalOpen(true);
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
          <p className="text-gray-600 mt-2">Review and manage all platform events</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <option value="rejected">Rejected</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
          </select>
        </div>
      </Card>

      {/* Events List */}
      {events.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms.</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event._id} hover>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Event Image */}
                  <div className="md:w-48 h-48 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg overflow-hidden flex-shrink-0">
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
                  </div>

                  {/* Event Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {event.title}
                        </h3>
                        <p className="text-gray-600 line-clamp-2 mb-3">
                          {event.description}
                        </p>
                      </div>
                      {getStatusBadge(event.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-primary-500" />
                        {formatDate(event.eventDate)}
                      </div>
                      {event.organizer && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2 text-primary-500" />
                          {event.organizer.firstName} {event.organizer.lastName}
                        </div>
                      )}
                      {event.categories?.length > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Ticket className="w-4 h-4 mr-2 text-primary-500" />
                          {event.categories.length} Categories
                        </div>
                      )}
                      {event.createdAt && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2 text-primary-500" />
                          {formatDate(event.createdAt)}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/events/${event._id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      {event.status === 'pending' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(event)}
                            disabled={approveMutation.isLoading}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="error"
                            size="sm"
                            onClick={() => handleReject(event)}
                            disabled={rejectMutation.isLoading}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
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

      {/* Approval Modal */}
      <Modal
        isOpen={approvalModalOpen}
        onClose={() => {
          setApprovalModalOpen(false);
          setSelectedEvent(null);
          setAdminNotes('');
        }}
        title="Approve Event"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to approve <strong>{selectedEvent?.title}</strong>?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Notes (Optional)
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Add any notes about this approval..."
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => {
                approveMutation.mutate({
                  eventId: selectedEvent._id,
                  adminNotes: adminNotes || undefined
                });
              }}
              disabled={approveMutation.isLoading}
            >
              {approveMutation.isLoading ? 'Approving...' : 'Approve Event'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setApprovalModalOpen(false);
                setAdminNotes('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        isOpen={rejectionModalOpen}
        onClose={() => {
          setRejectionModalOpen(false);
          setSelectedEvent(null);
          setRejectionReason('');
          setAdminNotes('');
        }}
        title="Reject Event"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to reject <strong>{selectedEvent?.title}</strong>?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span className="text-error-600">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Please provide a reason for rejection..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Notes (Optional)
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Additional notes..."
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="error"
              onClick={() => {
                if (!rejectionReason.trim()) {
                  toast.error('Please provide a rejection reason');
                  return;
                }
                rejectMutation.mutate({
                  eventId: selectedEvent._id,
                  rejectionReason,
                  adminNotes: adminNotes || undefined
                });
              }}
              disabled={rejectMutation.isLoading || !rejectionReason.trim()}
            >
              {rejectMutation.isLoading ? 'Rejecting...' : 'Reject Event'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRejectionModalOpen(false);
                setRejectionReason('');
                setAdminNotes('');
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

export default AdminEvents;