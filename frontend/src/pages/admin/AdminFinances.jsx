import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  CreditCard,
  Wallet,
  Receipt,
  BarChart3,
  Ticket,
  ShoppingBag
} from 'lucide-react';
import { paymentsAPI, eventsAPI, shopAPI } from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminFinances = () => {
  const [period, setPeriod] = useState('month'); // day, week, month, year
  const [transactionType, setTransactionType] = useState('all'); // all, tickets, shop, payouts

  // Fetch payment statistics
  const { data: paymentStats, isLoading: statsLoading } = useQuery(
    ['adminPaymentStats', period],
    () => paymentsAPI.getPaymentStats(period),
    { refetchInterval: 60000 }
  );

  // Fetch recent payments
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery(
    ['adminPayments', transactionType],
    () => paymentsAPI.getPaymentsByUser({ 
      status: 'completed',
      paymentMethod: transactionType !== 'all' ? transactionType : undefined
    }),
    { enabled: false } // We'll need to create an admin endpoint for this
  );

  const stats = paymentStats?.data?.stats || {};
  const payments = paymentsData?.data?.payments || [];

  const isLoading = statsLoading || paymentsLoading;

  const financialCards = [
    {
      title: 'Total Revenue',
      value: `$${(stats.totalRevenue || 0).toLocaleString()}`,
      change: stats.revenueChange || 0,
      icon: DollarSign,
      color: 'from-success-500 to-success-600',
      trend: 'up'
    },
    {
      title: 'Platform Earnings',
      value: `$${(stats.platformEarnings || 0).toLocaleString()}`,
      change: stats.earningsChange || 0,
      icon: Wallet,
      color: 'from-primary-500 to-primary-600',
      trend: 'up'
    },
    {
      title: 'Total Transactions',
      value: (stats.totalTransactions || 0).toLocaleString(),
      change: stats.transactionsChange || 0,
      icon: Receipt,
      color: 'from-secondary-500 to-secondary-600',
      trend: 'up'
    },
    {
      title: 'Pending Payouts',
      value: `$${(stats.pendingPayouts || 0).toLocaleString()}`,
      change: 0,
      icon: CreditCard,
      color: 'from-warning-500 to-warning-600',
      trend: 'neutral'
    }
  ];

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Overview</h1>
          <p className="text-gray-600 mt-2">Monitor platform revenue and transactions</p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Financial Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {financialCards.map((card, index) => (
          <Card key={index}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              {card.change !== 0 && (
                <div className={`flex items-center text-sm ${
                  card.change > 0 ? 'text-success-600' : 'text-error-600'
                }`}>
                  {card.change > 0 ? (
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                  )}
                  {Math.abs(card.change)}%
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </Card>
        ))}
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Sources */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Sources</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Ticket className="w-5 h-5 text-primary-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Ticket Sales</p>
                  <p className="text-sm text-gray-600">Event tickets</p>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">
                ${(stats.ticketRevenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <ShoppingBag className="w-5 h-5 text-primary-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Shop Sales</p>
                  <p className="text-sm text-gray-600">Award materials</p>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">
                ${(stats.shopRevenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-primary-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Commissions</p>
                  <p className="text-sm text-gray-600">Platform fees</p>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">
                ${(stats.commissionRevenue || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Methods</h2>
          <div className="space-y-4">
            {[
              { method: 'Card', amount: stats.cardPayments || 0, color: 'bg-primary-500' },
              { method: 'Mobile Money', amount: stats.mobileMoneyPayments || 0, color: 'bg-secondary-500' },
              { method: 'Bank Transfer', amount: stats.bankTransferPayments || 0, color: 'bg-success-500' },
              { method: 'Other', amount: stats.otherPayments || 0, color: 'bg-gray-500' }
            ].map((item, index) => {
              const total = (stats.cardPayments || 0) + (stats.mobileMoneyPayments || 0) + 
                           (stats.bankTransferPayments || 0) + (stats.otherPayments || 0);
              const percentage = total > 0 ? (item.amount / total * 100).toFixed(1) : 0;
              
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.method}</span>
                    <span className="text-sm text-gray-600">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Transactions</option>
            <option value="tickets">Tickets</option>
            <option value="shop">Shop</option>
            <option value="payouts">Payouts</option>
          </select>
        </div>
        
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Transactions</h3>
            <p className="text-gray-600">Transactions will appear here once payments are processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.slice(0, 10).map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.transactionId || payment._id.slice(-8)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.user?.firstName} {payment.user?.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="default">
                        {payment.event ? 'Ticket' : payment.order ? 'Shop' : 'Other'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.paymentDate || payment.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={payment.status === 'completed' ? 'success' : 'warning'}>
                        {payment.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminFinances;