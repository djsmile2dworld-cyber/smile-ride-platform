import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LiveMonitor = ({ socket }) => {
  const [activeRides, setActiveRides] = useState([]);
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const mapRef = useRef();

  useEffect(() => {
    fetchLiveData();
    
    if (socket) {
      socket.on('live_data_update', (data) => {
        setActiveRides(data.activeRides);
        setOnlineDrivers(data.onlineDrivers);
        setAlerts(data.recentAlerts);
      });
      
      socket.on('driver_location_update', (data) => {
        updateDriverLocation(data);
      });
      
      socket.on('new_alert', (alert) => {
        setAlerts(prev => [alert, ...prev].slice(0, 10));
      });
    }

    // Refresh every 10 seconds
    const interval = setInterval(fetchLiveData, 10000);
    return () => clearInterval(interval);
  }, [socket]);

  const fetchLiveData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:5000/api/admin/live-monitor', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setActiveRides(data.activeRides);
      setOnlineDrivers(data.onlineDrivers);
      setAlerts(data.recentAlerts);
    } catch (err) {
      console.error('Failed to fetch live data:', err);
    }
  };

  const updateDriverLocation = (data) => {
    setOnlineDrivers(prev => prev.map(driver => 
      driver.id === data.driverId 
        ? { ...driver, lat: data.lat, lng: data.lng }
        : driver
    ));
  };

  const handleManualAssign = async (rideId, driverId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch('http://localhost:5000/api/rides/manual-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rideId, driverId })
      });
      fetchLiveData();
    } catch (err) {
      alert('Assignment failed');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'yellow',
      accepted: 'blue',
      arrived: 'purple',
      in_progress: 'green',
      completed: 'gray',
      cancelled: 'red'
    };
    return colors[status] || 'gray';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Live Operations Monitor</h1>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
            {onlineDrivers.length} Online Drivers
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
            {activeRides.length} Active Rides
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 h-[600px]">
        {/* Map */}
        <div className="col-span-2 bg-gray-800 rounded-xl overflow-hidden">
          <MapContainer
            center={[6.5244, 3.3792]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            
            {/* Online Drivers */}
            {onlineDrivers.map(driver => (
              <Marker
                key={driver.id}
                position={[driver.lat, driver.lng]}
                icon={L.divIcon({
                  className: 'custom-marker',
                  html: `<div class="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>`
                })}
              >
                <Popup>
                  <div className="text-gray-900">
                    <p className="font-bold">{driver.full_name}</p>
                    <p className="text-sm">Rating: {driver.rating}</p>
                    <button 
                      onClick={() => setSelectedRide({ type: 'driver', data: driver })}
                      className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
                    >
                      Assign Ride
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Active Rides */}
            {activeRides.map(ride => (
              <React.Fragment key={ride.id}>
                <Marker
                  position={[ride.driver_lat, ride.driver_lng]}
                  icon={L.divIcon({
                    className: 'custom-marker',
                    html: `<div class="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">R</div>`
                  })}
                >
                  <Popup>
                    <div className="text-gray-900 min-w-[200px]">
                      <p className="font-bold">Ride #{ride.id.slice(0, 8)}</p>
                      <p className="text-sm">Rider: {ride.rider_name}</p>
                      <p className="text-sm">Driver: {ride.driver_name}</p>
                      <p className="text-sm">Status: <span className={`text-${getStatusColor(ride.status)}-600`}>{ride.status}</span></p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-600">From: {ride.pickup_address}</p>
                        <p className="text-xs text-gray-600">To: {ride.dropoff_address}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}
          </MapContainer>
        </div>

        {/* Side Panel */}
        <div className="space-y-4 overflow-auto">
          {/* Active Rides List */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              Active Rides ({activeRides.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-auto">
              {activeRides.map(ride => (
                <div 
                  key={ride.id}
                  onClick={() => setSelectedRide({ type: 'ride', data: ride })}
                  className="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{ride.rider_name}</p>
                      <p className="text-xs text-gray-400">{ride.driver_name || 'No driver'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs bg-${getStatusColor(ride.status)}-500/20 text-${getStatusColor(ride.status)}-400`}>
                      {ride.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">{ride.pickup_address}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="font-bold mb-3 text-red-400">Recent Alerts</h3>
            <div className="space-y-2 max-h-48 overflow-auto">
              {alerts.map((alert, idx) => (
                <div key={idx} className="p-2 bg-red-500/10 border border-red-500/20 rounded text-sm">
                  <p className="font-semibold text-red-400">Ride Cancelled</p>
                  <p className="text-xs text-gray-400">{alert.rider_name}</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.cancel_reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {selectedRide && selectedRide.type === 'ride' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-96">
            <h3 className="font-bold text-lg mb-4">Manual Driver Assignment</h3>
            <p className="text-sm text-gray-400 mb-4">Ride: {selectedRide.data.pickup_address}</p>
            
            <div className="space-y-2 max-h-64 overflow-auto">
              {onlineDrivers.map(driver => (
                <button
                  key={driver.id}
                  onClick={() => handleManualAssign(selectedRide.data.id, driver.id)}
                  className="w-full p-3 bg-gray-700 rounded-lg hover:bg-gray-600 flex items-center gap-3 transition"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    {driver.full_name[0]}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{driver.full_name}</p>
                    <p className="text-xs text-gray-400">★ {driver.rating}</p>
                  </div>
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setSelectedRide(null)}
              className="w-full mt-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMonitor;