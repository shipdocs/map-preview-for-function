import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const FitBounds = ({ positions }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds);
    }
  }, [map, positions]);

  return null;
};

const App = () => {
  const [ships, setShips] = useState([]);
  const [shipNames, setShipNames] = useState(''); // For ship names or MMSI numbers
  const [apiKey, setApiKey] = useState(''); // For API key
  const mapRef = useRef();

  useEffect(() => {
    // Load saved ship names and API key from localStorage
    const savedShipNames = localStorage.getItem('shipNames');
    const savedApiKey = localStorage.getItem('apiKey');
    if (savedShipNames) {
      setShipNames(savedShipNames);
    }
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (shipNames && apiKey) {
      try {
        const response = await fetch(`https://ais.marineplan.com/location/2/ships.json?ships=${encodeURIComponent(shipNames)}&key=${apiKey}`);
        const data = await response.json();

        if (data && data.reports && data.reports.length > 0) {
          const newShips = data.reports.map((ship) => ({
            id: ship.mmsi, // Use MMSI as a unique identifier
            name: ship.boatName || 'Unknown Ship', // Use boat name or fallback
            eni: ship.mmsi || 'N/A', // Use MMSI as ENI or fallback
            position: [ship.point.latitude, ship.point.longitude], // Use the fetched coordinates
          }));
          setShips(newShips);

          // Save ship names and API key to localStorage
          localStorage.setItem('shipNames', shipNames);
          localStorage.setItem('apiKey', apiKey);
        } else {
          alert('No ships found with the provided names or MMSI numbers.');
        }
      } catch (error) {
        console.error('Error fetching ship data:', error);
        alert('Failed to fetch ship data. Please try again.');
      }
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ margin: '20px' }}>
        <input
          type="text"
          placeholder="Enter Ship Names or MMSI (semicolon-separated)"
          value={shipNames}
          onChange={(e) => setShipNames(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
        />
        <button type="submit">Find Ships</button>
      </form>

      <MapContainer center={[51.505, -0.09]} zoom={5} ref={mapRef} style={{ height: '100vh', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FitBounds positions={ships.map(ship => ship.position)} />
        {ships.map(ship => (
          <Marker key={ship.id} position={ship.position}>
            <Popup>
              <strong>{ship.name}</strong><br />
              ENI: {ship.eni}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default App;
