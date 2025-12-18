import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Users, 
  DollarSign, 
  TrendingUp,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  Mail,
  Link as LinkIcon,
  Download,
  Eye,
  Ban
} from 'lucide-react';
import { affiliatesAPI, paymentsAPI } from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const AdminAffiliates = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');

  const limit = 10;

  const { data: affiliatesData, isLoading } = useQuery(
    ['adminAffiliates', page, statusFilter, searchTerm],
    () => affiliatesAPI.getAffiliates({
      page,
      limit,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchTerm || undefined
    }),
    {
      keepPreviousData: true
    }
  );

  const { data: payoutRequestsData, isLoading: payoutsLoading } = useQuery(
    ['adminPayoutRequests', 'pending'],
    () => affiliatesAPI.getPayoutRequests({ status: 'pending' }),
    {
      refetchInterval: 30000
    }
  );

  const affiliates = affiliatesData?.data?.affiliates || [];
  const payoutRequests = payoutRequestsData?.data?.payoutRequests || [];
  const pagination = affiliatesData?.data?.pagination || {};

  const approvePayoutMutation = useMutation(
    ({ requestId, amount }) => affiliatesAPI.approvePayout(requestId, amount),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminPayoutRequests');
        queryClient.invalidateQueries('adminAffiliates');
        toast.success('Payout approved successfully');
        setPayoutModalOpen(false);
        setSelectedAffiliate(null);
        setPayoutAmount('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve payout');
      }
    }
  );

  const rejectPayoutMutation = useMutation(
    ({ requestId, reason }) => affiliatesAPI.rejectPayout(requestId, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminPayoutRequests');
        toast.success('Payout rejected');
        setPayoutModalOpen(false);
        setSelectedAffiliate(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reject payout');
      }
    }
  );

  const updateCommissionRateMutation = useMutation(
    ({ affiliateId, commissionRate }) => affiliatesAPI.updateCommissionRate(affiliateId, commissionRate),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminAffiliates');
        toast.success('Commission rate updated');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update commission rate');
      }
    }
  );

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

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: 'success', label: 'Active' },
      inactive: { variant: 'default', label: 'Inactive' },
      suspended: { variant: 'error', label: 'Suspended' }
    };
    const config = statusConfig[status] || statusConfig.inactive;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading && page === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Calculate stats
  const totalAffiliates = pagination.totalAffiliates || affiliates.length;
  const totalEarnings = affiliates.reduce((sum, aff) => sum + (aff.totalEarnings || 0), 0);
  const totalPaidOut = affiliates.reduce((sum, aff) => sum + (aff.totalPaidOut || 0), 0);
  const pendingPayouts = payoutRequests.reduce((sum, req) => sum + (req.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Affiliate Management</h1>
          <p className="text-gray-600 mt-2">Manage affiliates, commissions, and payouts</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Affiliates</p>
              <p className="text-2xl font-bold text-gray-900">{totalAffiliates}</p>
            </div>
            <Users className="w-8 h-8 text-primary-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalEarnings)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-success-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Paid Out</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPaidOut)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-secondary-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Pending Payouts</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(pendingPayouts)}</p>
            </div>
            <Clock className="w-8 h-8 text-warning-500" />
          </div>
        </Card>
      </div>

      {/* Pending Payout Requests */}
      {payoutRequests.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Pending Payout Requests</h2>
            <Badge variant="warning">{payoutRequests.length} pending</Badge>
          </div>
          <div className="space-y-4">
            {payoutRequests.map((request) => {
              const affiliate = affiliates.find(a => a._id === request.affiliate);
              return (
                <div
                  key={request._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {affiliate?.firstName} {affiliate?.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Requested: {formatCurrency(request.amount)} • {formatDate(request.createdAt)}
                    </p>
                    {request.paymentMethod && (
                      <p className="text-sm text-gray-500">
                        Payment Method: {request.paymentMethod}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedAffiliate(affiliate);
                        setPayoutAmount(request.amount);
                        setPayoutModalOpen(true);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="error"
                      size="sm"
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason) {
                          rejectPayoutMutation.mutate({
                            requestId: request._id,
                            reason
                          });
                        }
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            leftIcon={<Search className="w-5 h-5 text-gray-400" />}
            placeholder="Search affiliates..."
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
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </Card>

      {/* Affiliates List */}
      {affiliates.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Affiliates Found</h3>
            <p className="text-gray-600">No affiliates match your search criteria.</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {affiliates.map((affiliate) => (
              <Card key={affiliate._id}>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Affiliate Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        {affiliate.user?.avatar ? (
                          <img
                            src={affiliate.user.avatar}
                            alt={affiliate.user.firstName}
                            className="w-12 h-12 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                            <Users className="w-6 h-6 text-primary-600" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {affiliate.user?.firstName} {affiliate.user?.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{affiliate.user?.email}</p>
                        </div>
                      </div>
                      {getStatusBadge(affiliate.status)}
                    </div>

                    {/* Affiliate Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Referral Code</p>
                        <p className="font-medium text-gray-900 flex items-center">
                          <LinkIcon className="w-4 h-4 mr-1" />
                          {affiliate.referralCode}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Referrals</p>
                        <p className="font-medium text-gray-900">{affiliate.totalReferrals || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Earnings</p>
                        <p className="font-medium text-success-600">{formatCurrency(affiliate.totalEarnings || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Pending Balance</p>
                        <p className="font-medium text-warning-600">
                          {formatCurrency((affiliate.totalEarnings || 0) - (affiliate.totalPaidOut || 0))}
                        </p>
                      </div>
                    </div>

                    {/* Commission Rate */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Commission Rate:</span>
                      <select
                        defaultValue={affiliate.commissionRate || 10}
                        onChange={(e) => {
                          updateCommissionRateMutation.mutate({
                            affiliateId: affiliate._id,
                            commissionRate: parseFloat(e.target.value)
                          });
                        }}
                        className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="5">5%</option>
                        <option value="10">10%</option>
                        <option value="15">15%</option>
                        <option value="20">20%</option>
                      </select>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAffiliate(affiliate);
                        setPayoutAmount((affiliate.totalEarnings || 0) - (affiliate.totalPaidOut || 0));
                        setPayoutModalOpen(true);
                      }}
                      disabled={(affiliate.totalEarnings || 0) - (affiliate.totalPaidOut || 0) <= 0}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Process Payout
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // View affiliate details
                        window.open(`/affiliate/${affiliate._id}`, '_blank');
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.totalAffiliates)} of {pagination.totalAffiliates} affiliates
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

      {/* Payout Modal */}
      <Modal
        isOpen={payoutModalOpen}
        onClose={() => {
          setPayoutModalOpen(false);
          setSelectedAffiliate(null);
          setPayoutAmount('');
        }}
        title="Process Payout"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-gray-600 mb-2">
              Process payout for <strong>{selectedAffiliate?.user?.firstName} {selectedAffiliate?.user?.lastName}</strong>
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Available Balance:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency((selectedAffiliate?.totalEarnings || 0) - (selectedAffiliate?.totalPaidOut || 0))}
                </span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payout Amount *
            </label>
            <Input
              type="number"
              step="0.01"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => {
                if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
                  toast.error('Please enter a valid payout amount');
                  return;
                }
                const requestId = payoutRequests.find(
                  req => req.affiliate === selectedAffiliate._id
                )?._id;
                if (requestId) {
                  approvePayoutMutation.mutate({
                    requestId,
                    amount: parseFloat(payoutAmount)
                  });
                } else {
                  toast.error('No pending payout request found');
                }
              }}
              disabled={approvePayoutMutation.isLoading}
              className="flex-1"
            >
              {approvePayoutMutation.isLoading ? 'Processing...' : 'Approve Payout'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPayoutModalOpen(false);
                setSelectedAffiliate(null);
                setPayoutAmount('');
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

export default AdminAffiliates;