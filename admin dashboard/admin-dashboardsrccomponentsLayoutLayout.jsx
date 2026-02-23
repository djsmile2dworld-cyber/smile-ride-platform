import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
  '/': 'Dashboard',
  '/users': 'User Management',
  '/drivers': 'Driver Management',
  '/rides': 'Ride History',
  '/live-monitor': 'Live Operations Monitor',
  '/assignments': 'Driver Assignments',
  '/analytics': 'Analytics & Reports',
  '/support': 'Support Tickets',
  '/settings': 'System Settings'
};

const Layout = () => {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Admin Panel';

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;