import React, { useState, useEffect } from 'react';
import { BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSocket } from '../../hooks/useSocket';

const Header = ({ title }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('notification', (notif) => {
      setNotifications(prev => [notif, ...prev].slice(0, 50));
    });

    socket.on('emergency_alert', (alert) => {
      setNotifications(prev => [{
        id: Date.now(),
        type: 'emergency',
        title: 'Emergency Alert',
        message: `Ride ${alert.rideId} - ${alert.type}`,
        time: new Date(),
        priority: 'critical'
      }, ...prev]);
    });

    return () => {
      socket.off('notification');
      socket.off('emergency_alert');
    };
  }, [socket]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-20">
      <h1 className="text-2xl font-bold text-white">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow w-64"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          >
            <BellIcon className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50">
              <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-semibold text-white">Notifications</h3>
                <button
                  onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                  className="text-xs text-brand-yellow hover:underline"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-gray-500 text-center">No notifications</p>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-3 border-b border-gray-700/50 cursor-pointer hover:bg-gray-700/50 ${!notif.read ? 'bg-gray-700/30' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getPriorityColor(notif.priority)}`}></span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{notif.title}</p>
                          <p className="text-xs text-gray-400 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notif.time).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;