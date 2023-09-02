import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function Map() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([51.505, -0.09], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      map.locate({ setView: true, maxZoom: 16 });
      map.on('locationfound', e => {
        const marker = L.marker(e.latlng).addTo(map);
        marker.bindPopup("You are here!").openPopup();
      });

      mapInstanceRef.current = map;
    }

    // Cleanup function for useEffect
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  return <div ref={mapContainerRef} style={{ height: '300px' }} />;
}

export default Map;
