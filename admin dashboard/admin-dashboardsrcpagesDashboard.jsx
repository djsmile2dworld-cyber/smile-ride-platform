import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import {
  UsersIcon,
  TruckIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const StatCard = ({ title, value, change, changeType, icon: Icon, color }) => (
  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {change && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${changeType === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {changeType === 'up' ? <ArrowTrendingUpIcon className="w-4 h-4" /> : <ArrowTrendingDownIcon className="w-4 h-4" />}
            <span>{change}% from last period</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const ActivityItem = ({ activity }) => (
  <div className="flex items-center gap-4 p-3 hover:bg-gray-700/50 rounded-lg transition-colors">
    <div className={`w-2 h-2 rounded-full ${
      activity.type === 'ride_completed' ? 'bg-green-500' :
      activity.type === 'ride_cancelled' ? 'bg-red-500' :
      activity.type === 'driver_online' ? 'bg-blue-500' :
      'bg-yellow-500'
    }`}></div>
    <div className="flex-1">
      <p className="text-sm text-white">{activity.description}</p>
      <p className="text-xs text-gray-500">{new Date(activity.time).toLocaleString()}</p>
    </div>
    {activity.amount && (
      <span className="text-green-400 font-medium">+₦{activity.amount}</span>
    )}
  </div>
);

const Dashboard = ({ socket }) => {
  const [realtimeStats, setRealtimeStats] = useState(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/admin/dashboard'),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  useEffect(() => {
    if (!socket) return;

    socket.on('stats_update', (newStats) => {
      setRealtimeStats(newStats);
    });

    return () => socket.off('stats_update');
  }, [socket]);

  const dashboardData = realtimeStats || stats?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-yellow border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const { users, rides, revenue, performance } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={users?.totalRiders?.toLocaleString() || '0'}
          change={12}
          changeType="up"
          icon={UsersIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="Online Drivers"
          value={users?.onlineDrivers?.toLocaleString() || '0'}
          change={8}
          changeType="up"
          icon={TruckIcon}
          color="bg-green-500"
        />
        <StatCard
          title="Today's Revenue"
          value={`₦${(revenue?.today || 0).toLocaleString()}`}
          change={23}
          changeType="up"
          icon={CurrencyDollarIcon}
          color="bg-brand-yellow"
        />
        <StatCard
          title="Active Rides"
          value={rides?.activeNow || '0'}
          change={-5}
          changeType="down"
          icon={ChartBarIcon}
          color="bg-purple-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenue?.history || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#F4C430" strokeWidth={2} />
                <Line type="monotone" dataKey="target" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ride Distribution */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Ride Types</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rides?.typeDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {['economy', 'comfort', 'premium', 'delivery'].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#F4C430', '#3B82F6', '#8B5CF6', '#10B981'][index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {['Economy', 'Comfort', 'Premium', 'Delivery'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${['bg-brand-yellow', 'bg-blue-500', 'bg-purple-500', 'bg-green-500'][i]}`}></span>
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Driver Performance</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performance?.topDrivers || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                <Bar dataKey="rides" fill="#F4C430" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rating" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(performance?.recentActivity || []).map((activity, idx) => (
              <ActivityItem key={idx} activity={activity} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;