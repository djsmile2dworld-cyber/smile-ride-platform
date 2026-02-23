import React from 'react';

const statusStyles = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  suspended: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  banned: 'bg-red-500/20 text-red-400 border-red-500/30',
  pending: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  verified: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  
  // Ride statuses
  completed: 'bg-green-500/20 text-green-400',
  in_progress: 'bg-blue-500/20 text-blue-400',
  cancelled: 'bg-red-500/20 text-red-400',
  pending_ride: 'bg-yellow-500/20 text-yellow-400',
  accepted: 'bg-purple-500/20 text-purple-400'
};

const StatusBadge = ({ status, className = '' }) => {
  const style = statusStyles[status] || 'bg-gray-500/20 text-gray-400';
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${style} ${className}`}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
};

export default StatusBadge;