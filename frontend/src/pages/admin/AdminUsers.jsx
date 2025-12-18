import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Users, 
  Search, 
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Ban,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  Shield
} from 'lucide-react';
import { usersAPI } from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null);

  const limit = 10;

  const { data, isLoading, error } = useQuery(
    ['adminUsers', page, roleFilter, statusFilter, searchTerm],
    () => usersAPI.getUsers({
      page,
      limit,
      role: roleFilter !== 'all' ? roleFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchTerm || undefined
    }),
    {
      keepPreviousData: true
    }
  );

  const updateStatusMutation = useMutation(
    ({ userId, status, reason }) => usersAPI.updateUserStatus(userId, status, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminUsers');
        toast.success('User status updated successfully');
        setActionModalOpen(false);
        setSelectedUser(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user status');
      }
    }
  );

  const updateRoleMutation = useMutation(
    ({ userId, role }) => usersAPI.updateUserRole(userId, role),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminUsers');
        toast.success('User role updated successfully');
        setActionModalOpen(false);
        setSelectedUser(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user role');
      }
    }
  );

  const deleteUserMutation = useMutation(
    (userId) => usersAPI.deleteUser(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminUsers');
        toast.success('User deleted successfully');
        setActionModalOpen(false);
        setSelectedUser(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  );

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination || {};

  const handleAction = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    setActionModalOpen(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: 'success', label: 'Active' },
      inactive: { variant: 'default', label: 'Inactive' },
      suspended: { variant: 'error', label: 'Suspended' },
      pending: { variant: 'warning', label: 'Pending' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { variant: 'error', label: 'Admin' },
      organizer: { variant: 'primary', label: 'Organizer' },
      affiliate: { variant: 'secondary', label: 'Affiliate' },
      user: { variant: 'default', label: 'User' }
    };
    const config = roleConfig[role] || roleConfig.user;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage all platform users and their permissions</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            leftIcon={<Search className="w-5 h-5 text-gray-400" />}
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="organizer">Organizer</option>
            <option value="affiliate">Affiliate</option>
            <option value="user">User</option>
          </select>
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
            <option value="pending">Pending</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.firstName}
                              className="w-10 h-10 rounded-full mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                              <Users className="w-5 h-5 text-primary-600" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-1">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-2 text-gray-400" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {user.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction(user, 'suspend')}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                          {user.status === 'suspended' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction(user, 'activate')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {user.role !== 'admin' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction(user, 'changeRole')}
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(user, 'delete')}
                            className="text-error-600 hover:text-error-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.totalUsers)} of {pagination.totalUsers} users
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
      </Card>

      {/* Action Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => {
          setActionModalOpen(false);
          setSelectedUser(null);
          setActionType(null);
        }}
        title={
          actionType === 'suspend' ? 'Suspend User' :
          actionType === 'activate' ? 'Activate User' :
          actionType === 'changeRole' ? 'Change User Role' :
          actionType === 'delete' ? 'Delete User' :
          'User Action'
        }
      >
        {actionType === 'suspend' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to suspend {selectedUser?.firstName} {selectedUser?.lastName}?
            </p>
            <div className="flex gap-2">
              <Button
                variant="error"
                onClick={() => {
                  updateStatusMutation.mutate({
                    userId: selectedUser._id,
                    status: 'suspended',
                    reason: 'Suspended by admin'
                  });
                }}
                disabled={updateStatusMutation.isLoading}
              >
                Suspend User
              </Button>
              <Button
                variant="outline"
                onClick={() => setActionModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {actionType === 'activate' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Activate {selectedUser?.firstName} {selectedUser?.lastName}?
            </p>
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  updateStatusMutation.mutate({
                    userId: selectedUser._id,
                    status: 'active'
                  });
                }}
                disabled={updateStatusMutation.isLoading}
              >
                Activate User
              </Button>
              <Button
                variant="outline"
                onClick={() => setActionModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {actionType === 'changeRole' && (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">
              Change role for {selectedUser?.firstName} {selectedUser?.lastName}
            </p>
            <select
              defaultValue={selectedUser?.role}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              onChange={(e) => {
                updateRoleMutation.mutate({
                  userId: selectedUser._id,
                  role: e.target.value
                });
              }}
            >
              <option value="user">User</option>
              <option value="organizer">Organizer</option>
              <option value="affiliate">Affiliate</option>
            </select>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setActionModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        )}

        {actionType === 'delete' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete {selectedUser?.firstName} {selectedUser?.lastName}? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="error"
                onClick={() => {
                  deleteUserMutation.mutate(selectedUser._id);
                }}
                disabled={deleteUserMutation.isLoading}
              >
                Delete User
              </Button>
              <Button
                variant="outline"
                onClick={() => setActionModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;