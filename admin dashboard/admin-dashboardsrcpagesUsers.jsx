import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import DataTable from '../components/Common/DataTable';
import StatusBadge from '../components/Common/StatusBadge';
import ConfirmModal from '../components/Common/ConfirmModal';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, FunnelIcon, UserPlusIcon } from '@heroicons/react/24/outline';

const UserDetailModal = ({ user, onClose, onUpdate }) => {
  const [status, setStatus] = useState(user.status);
  const [note, setNote] = useState('');

  const handleStatusChange = async () => {
    try {
      await onUpdate({ userId: user.id, status, reason: note });
      onClose();
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl w-full max-w-lg p-6 border border-gray-700">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <img src={user.avatarUrl || '/default-avatar.png'} alt="" className="w-16 h-16 rounded-full" />
            <div>
              <h3 className="text-xl font-bold text-white">{user.fullName}</h3>
              <p className="text-gray-400">{user.email}</p>
              <p className="text-sm text-gray-500 capitalize">{user.userType}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-700/50 p-3 rounded-lg">
            <p className="text-xs text-gray-400">Phone</p>
            <p className="text-white">{user.phone || 'N/A'}</p>
          </div>
          <div className="bg-gray-700/50 p-3 rounded-lg">
            <p className="text-xs text-gray-400">Rating</p>
            <p className="text-white">★ {user.rating}</p>
          </div>
          <div className="bg-gray-700/50 p-3 rounded-lg">
            <p className="text-xs text-gray-400">Total Rides</p>
            <p className="text-white">{user.totalRides}</p>
          </div>
          <div className="bg-gray-700/50 p-3 rounded-lg">
            <p className="text-xs text-gray-400">Joined</p>
            <p className="text-white">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Update Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Note (required for suspension)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white h-24"
              placeholder="Reason for status change..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleStatusChange}
              disabled={!note && status !== user.status}
              className="flex-1 bg-brand-yellow text-gray-900 font-semibold py-2 rounded-lg hover:bg-brand-yellow-dark disabled:opacity-50"
            >
              Update Status
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Users = () => {
  const [filters, setFilters] = useState({
    search: '',
    userType: '',
    status: '',
    page: 1,
    limit: 20
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', filters],
    queryFn: () => api.get('/admin/users', { params: filters })
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, status, reason }) => 
      api.put(`/admin/users/${userId}/status`, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User updated successfully');
    },
    onError: () => toast.error('Failed to update user')
  });

  const columns = [
    {
      key: 'fullName',
      title: 'User',
      render: (user) => (
        <div className="flex items-center gap-3">
          <img src={user.avatarUrl || '/default-avatar.png'} alt="" className="w-10 h-10 rounded-full" />
          <div>
            <p className="font-medium text-white">{user.fullName}</p>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
        </div>
      )
    },
    { key: 'userType', title: 'Type', render: (user) => (
      <span className="capitalize text-gray-300">{user.userType}</span>
    )},
    { key: 'status', title: 'Status', render: (user) => <StatusBadge status={user.status} /> },
    { key: 'rating', title: 'Rating', render: (user) => (
      <span className="text-yellow-400">★ {user.rating}</span>
    )},
    { key: 'totalRides', title: 'Rides', render: (user) => (
      <span className="text-gray-300">{user.totalRides.toLocaleString()}</span>
    )},
    {
      key: 'actions',
      title: 'Actions',
      render: (user) => (
        <button
          onClick={() => setSelectedUser(user)}
          className="text-brand-yellow hover:underline text-sm"
        >
          Manage
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-gray-300 hover:bg-gray-700"
          >
            <FunnelIcon className="w-5 h-5" />
            Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-yellow text-gray-900 rounded-lg font-semibold hover:bg-brand-yellow-dark">
            <UserPlusIcon className="w-5 h-5" />
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
          </div>
          
          <select
            value={filters.userType}
            onChange={(e) => setFilters(f => ({ ...f, userType: e.target.value, page: 1 }))}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="">All Types</option>
            <option value="rider">Riders</option>
            <option value="driver">Drivers</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        pagination={{
          page: filters.page,
          limit: filters.limit,
          total: data?.pagination?.total || 0,
          onPageChange: (page) => setFilters(f => ({ ...f, page }))
        }}
      />

      {/* Modals */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={updateMutation.mutate}
        />
      )}
    </div>
  );
};

export default Users;