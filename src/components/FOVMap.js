import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
// const planeIcon = () => <FontAwesomeIcon icon={faPlane} />;






const FOVMap = ({ cameraLat, cameraLon, P1, P2 }) => {
  const center = [cameraLat, cameraLon];
//   const cameraIcon = L.icon({
//     iconUrl: 'path/to/icon.png', // Update this with the path to your custom icon if needed
//     iconSize: [25, 41],
//     iconAnchor: [12, 41],
  //   });
  
  // [camera_latitude, camera_longitude], P1, P2

  const addBoundingBox = (map, point1, point2, point3, bufferRatio = 0.1) => {
    // Extract latitudes and longitudes from points
    const lats = [point1[0], point2[0], point3[0]];
    const lons = [point1[1], point2[1], point3[1]];
    
    // Find min and max for latitudes and longitudes
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    
    // Calculate the buffer for lat and lon
    const latBuffer = (maxLat - minLat) * bufferRatio;
    const lonBuffer = (maxLon - minLon) * bufferRatio;
    
    // Adjust the bounding box with the buffer
    const adjustedMinLat = minLat - latBuffer;
    const adjustedMaxLat = maxLat + latBuffer;
    const adjustedMinLon = minLon - lonBuffer;
    const adjustedMaxLon = maxLon + lonBuffer;
    
    const topLeft = [adjustedMaxLat, adjustedMinLon];
    const bottomRight = [adjustedMinLat, adjustedMaxLon];

    L.rectangle([topLeft, bottomRight], {
      color: "black",
      fill: false,
      weight: 1,
      text: "Plane data"
    }).addTo(map);
  
    const bboxCoords = [adjustedMinLat, adjustedMaxLat, adjustedMinLon, adjustedMaxLon];
    
    return bboxCoords;
  };

  function BoundingBoxComponent({ point1, point2, point3 }) {
    const map = useMap();
    
    React.useEffect(() => {
        addBoundingBox(map, point1, point2, point3);
    }, [map, point1, point2, point3]);
  
    return null;
  }



  return (
    <MapContainer center={center} zoom={10} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
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
      <BoundingBoxComponent point1={center} point2={P1} point3={P2} />
    </MapContainer>
  );
};

export default FOVMap;
