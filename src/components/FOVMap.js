import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, Tooltip } from 'react-leaflet';

// const planeIcon = () => <FontAwesomeIcon icon={faPlane} />;

const FOVMap = ({ cameraLat, cameraLon, P1, P2 }) => {
  const center = [cameraLat, cameraLon];
//   const cameraIcon = L.icon({
//     iconUrl: 'path/to/icon.png', // Update this with the path to your custom icon if needed
//     iconSize: [25, 41],
//     iconAnchor: [12, 41],
//   });

  return (
    <MapContainer center={center} zoom={13} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={center}>
        <Tooltip>Camera</Tooltip>
      </Marker>
      <Polyline positions={[center, P1]} color="blue" weight={2} />
      <Polyline positions={[center, P2]} color="blue" weight={2} />
      <Polygon
        positions={[center, P1, P2]}
        color="blue"
        fill={true}
        weight={0}
        fillColor="lightskyblue"
        fillOpacity={0.3}>
        <Tooltip>Camera field of view</Tooltip>
      </Polygon>
    </MapContainer>
  );
};

export default FOVMap;
