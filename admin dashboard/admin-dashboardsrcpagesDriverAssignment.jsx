import React, { useState, useEffect } from 'react';

const DriverAssignment = ({ socket }) => {
  const [pendingRides, setPendingRides] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
    
    if (socket) {
      socket.on('new_ride_request', (ride) => {
        setPendingRides(prev => [ride, ...prev]);
      });
      
      socket.on('driver_status_change', ({ driverId, status }) => {
        updateDriverStatus(driverId, status);
      });
    }
  }, [socket]);

  const fetchData = async () => {
    // Fetch pending rides and available drivers
    const token = localStorage.getItem('adminToken');
    
    const [ridesRes, driversRes] = await Promise.all([
      fetch('http://localhost:5000/api/admin/pending-rides', {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch('http://localhost:5000/api/drivers/available', {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);
    
    setPendingRides(await ridesRes.json());
    setAvailableDrivers(await driversRes.json());
  };

  const assignDriver = async (rideId, driverId, type = 'manual') => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch('http://localhost:5000/api/rides/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rideId, driverId, assignmentType: type })
      });
      
      // Update local state
      setPendingRides(prev => prev.filter(r => r.id !== rideId));
      setAssignments(prev => [...prev, { rideId, driverId, type, time: new Date() }]);
      
    } catch (err) {
      alert('Assignment failed');
    }
  };

  const autoAssignAll = () => {
    pendingRides.forEach(ride => {
      const nearestDriver = findNearestDriver(ride);
      if (nearestDriver) {
        assignDriver(ride.id, nearestDriver.id, 'auto');
      }
    });
  };

  const findNearestDriver = (ride) => {
    // Simple distance calculation - in production, use proper geospatial query
    return availableDrivers[0]; // Placeholder
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Driver Assignment Control</h1>
        <div className="flex gap-3">
          <button 
            onClick={autoAssignAll}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold flex items-center gap-2"
          >
            <i className="fas fa-magic"></i>
            Auto-Assign All
          </button>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3"
          >
            <option value="all">All Rides</option>
            <option value="economy">Economy</option>
            <option value="comfort">Comfort</option>
            <option value="premium">Premium</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Pending Rides */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
            Pending Rides ({pendingRides.length})
          </h2>
          
          <div className="space-y-3 max-h-[600px] overflow-auto">
            {pendingRides.map(ride => (
              <div key={ride.id} className="bg-gray-700 rounded-lg p-4 border-l-4 border-yellow-500">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold">{ride.rider_name}</p>
                    <p className="text-xs text-gray-400">{ride.ride_type} • {ride.distance_km}km</p>
                  </div>
                  <span className="text-yellow-400 font-mono">₦{ride.base_fare}</span>
                </div>
                
                <div className="space-y-1 text-sm text-gray-300 mb-3">
                  <p><i className="fas fa-map-marker-alt text-green-500 mr-2"></i>{ride.pickup_address}</p>
                  <p><i className="fas fa-flag-checkered text-red-500 mr-2"></i>{ride.dropoff_address}</p>
                </div>

                <div className="flex gap-2">
                  <select 
                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
                    onChange={(e) => assignDriver(ride.id, e.target.value)}
                  >
                    <option value="">Select Driver...</option>
                    {availableDrivers.map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.full_name} ({driver.distance_km}km away)
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={() => assignDriver(ride.id, findNearestDriver(ride).id, 'auto')}
                    className="px-3 py-2 bg-blue-600 rounded hover:bg-blue-700"
                  >
                    Auto
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Available Drivers */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            Available Drivers ({availableDrivers.length})
          </h2>
          
          <div className="space-y-3 max-h-[600px] overflow-auto">
            {availableDrivers.map(driver => (
              <div key={driver.id} className="bg-gray-700 rounded-lg p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-xl font-bold">
                  {driver.full_name[0]}
                </div>
                <div className="flex-1">
                  <p className="font-bold">{driver.full_name}</p>
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span>★ {driver.rating}</span>
                    <span>{driver.vehicle_info?.model}</span>
                    <span className="text-green-400">{driver.distance_km}km from center</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-xs text-gray-500">Completed Today</span>
                  <span className="font-bold text-green-400">{driver.rides_today || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Assignments Log */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="font-bold mb-4">Recent Assignments</h3>
        <table className="w-full text-left">
          <thead className="text-gray-400 text-sm border-b border-gray-700">
            <tr>
              <th className="pb-2">Time</th>
              <th className="pb-2">Ride ID</th>
              <th className="pb-2">Driver</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {assignments.map((assignment, idx) => (
              <tr key={idx} className="border-b border-gray-700/50">
                <td className="py-3">{assignment.time.toLocaleTimeString()}</td>
                <td className="py-3 font-mono">{assignment.rideId.slice(0, 8)}</td>
                <td className="py-3">{assignment.driverId}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    assignment.type === 'manual' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {assignment.type}
                  </span>
                </td>
                <td className="py-3 text-green-400">Assigned</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DriverAssignment;