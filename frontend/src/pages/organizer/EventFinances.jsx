import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  ArrowLeft,
  DollarSign,
  TrendingUp,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Receipt,
  ArrowDownToLine
} from 'lucide-react';
import { eventsAPI, paymentsAPI } from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const EventFinances = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: eventData, isLoading: eventLoading } = useQuery(
    ['event', id],
    () => eventsAPI.getEventById(id),
    { enabled: !!id }
  );

  // Mock finances data - in real app, this would come from a finances endpoint
  const finances = {
    grossRevenue: eventData?.data?.event?.analytics?.revenue || 0,
    platformFee: (eventData?.data?.event?.analytics?.revenue || 0) * 0.10, // 10% platform fee
    netRevenue: (eventData?.data?.event?.analytics?.revenue || 0) * 0.90,
    ticketsSold: eventData?.data?.event?.analytics?.ticketsSold || 0,
    payoutStatus: 'pending',
    payoutHistory: []
  };

  const requestPayoutMutation = useMutation(
    () => paymentsAPI.requestPayout({ eventId: id, amount: finances.netRevenue }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['event', id]);
        toast.success('Payout request submitted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to request payout');
      }
    }
  );

  const event = eventData?.data?.event;

  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPayoutStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', label: 'Pending', icon: Clock },
      approved: { variant: 'success', label: 'Approved', icon: CheckCircle },
      rejected: { variant: 'error', label: 'Rejected', icon: AlertCircle },
      paid: { variant: 'success', label: 'Paid', icon: CheckCircle }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Event Finances</h1>
            <p className="text-gray-600 mt-2">{event?.title}</p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Statement
        </Button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Gross Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(finances.grossRevenue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-success-500" />
          </div>
          <p className="text-xs text-gray-500">Total ticket sales</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Platform Fee</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(finances.platformFee)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary-500" />
          </div>
          <p className="text-xs text-gray-500">10% commission</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Net Revenue</p>
              <p className="text-2xl font-bold text-primary-600">{formatCurrency(finances.netRevenue)}</p>
            </div>
            <CreditCard className="w-8 h-8 text-primary-500" />
          </div>
          <p className="text-xs text-gray-500">Available for payout</p>
        </Card>
      </div>

      {/* Payout Section */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Payout Information</h2>
            <p className="text-gray-600 mt-1">Request payout for your earnings</p>
          </div>
          {getPayoutStatusBadge(finances.payoutStatus)}
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(finances.netRevenue)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Tickets Sold</p>
              <p className="text-2xl font-bold text-gray-900">{finances.ticketsSold.toLocaleString()}</p>
            </div>
          </div>

          {finances.netRevenue > 0 && finances.payoutStatus === 'pending' && (
            <Button
              onClick={() => {
                if (window.confirm(`Request payout of ${formatCurrency(finances.netRevenue)}?`)) {
                  requestPayoutMutation.mutate();
                }
              }}
              disabled={requestPayoutMutation.isLoading}
            >
              {requestPayoutMutation.isLoading ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="w-4 h-4 mr-2" />
                  Request Payout
                </>
              )}
            </Button>
          )}

          {finances.payoutStatus !== 'pending' && (
            <p className="text-sm text-gray-600">
              Payout status: {finances.payoutStatus}
            </p>
          )}
        </div>
      </Card>

      {/* Transaction History */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Transaction History</h2>
        {finances.payoutHistory && finances.payoutHistory.length > 0 ? (
          <div className="space-y-4">
            {finances.payoutHistory.map((transaction) => (
              <div
                key={transaction._id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Receipt className="w-5 h-5 text-primary-500" />
                  <div>
                    <p className="font-medium text-gray-900">Payout #{transaction._id.slice(-8)}</p>
                    <p className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(transaction.amount)}</p>
                  {getPayoutStatusBadge(transaction.status)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Receipt className="w-16 h-16 mx-auto mb-2 text-gray-400" />
            <p>No transaction history yet</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default EventFinances;