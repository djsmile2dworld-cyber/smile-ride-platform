import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  TruckIcon,
  MapIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  ArrowLeftOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Live Monitor', href: '/live-monitor', icon: MapIcon },
  { name: 'Users', href: '/users', icon: UsersIcon },
  { name: 'Drivers', href: '/drivers', icon: TruckIcon },
  { name: 'Rides', href: '/rides', icon: ClipboardDocumentListIcon },
  { name: 'Assignments', href: '/assignments', icon: ClipboardDocumentListIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Support', href: '/support', icon: ChatBubbleLeftRightIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

const Sidebar = ({ user, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className={`flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-yellow rounded-lg flex items-center justify-center">
              <span className="text-gray-900 font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-white">Smile Admin</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-800 text-gray-400"
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-yellow text-gray-900'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
              {isActive && !isCollapsed && (
                <span className="ml-auto w-2 h-2 bg-gray-900 rounded-full"></span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-800">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar || 'https://via.placeholder.com/40'}
              alt=""
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.userType}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"
              title="Logout"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogout}
            className="w-full flex justify-center p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"
          >
            <ArrowLeftOnRectangleIcon className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;