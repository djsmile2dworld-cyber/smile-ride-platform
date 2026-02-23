import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';

// Components
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Rides from './pages/Rides';
import LiveMonitor from './pages/LiveMonitor';
import Analytics from './pages/Analytics';
import DriverAssignment from './pages/DriverAssignment';
import Login from './pages/Login';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      validateToken(token);
    }
  }, []);

  const validateToken = async (token) => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data.user);
      initSocket(token);
    } catch (err) {
      localStorage.removeItem('adminToken');
    }
  };

  const initSocket = (token) => {
    const newSocket = io(API_URL, { 
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      console.log('✅ Connected to real-time monitoring');
    });
    
    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
    });
    
    return () => newSocket.close();
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      if (res.data.user.type === 'admin') {
        localStorage.setItem('adminToken', res.data.accessToken);
        setUser(res.data.user);
        initSocket(res.data.accessToken);
        return true;
      }
      throw new Error('Unauthorized - Admin access only');
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    if (socket) socket.close();
    setUser(null);
    setSocket(null);
  };

  if (!user) return <Login onLogin={login} />;

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
        <Sidebar user={user} onLogout={logout} />
        <main className="flex-1 overflow-auto p-6 relative">
          <Routes>
            <Route path="/" element={<Dashboard socket={socket} />} />
            <Route path="/users" element={<Users />} />
            <Route path="/rides" element={<Rides socket={socket} />} />
            <Route path="/live-monitor" element={<LiveMonitor socket={socket} />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/assignments" element={<DriverAssignment socket={socket} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;