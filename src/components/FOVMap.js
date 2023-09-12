import React from "react";
import { useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Polygon, Popup, Tooltip, useMap } from "react-leaflet";
import { faPlane } from "@fortawesome/free-solid-svg-icons";
import "leaflet/dist/leaflet.css";
import iconUrl from "./plane-solid.svg";
import "leaflet-rotatedmarker";
const planeIcon = () => <FontAwesomeIcon icon={faPlane} />;

import L from "leaflet";
// import { Marker, Polyline } from 'react-leaflet';

const AircraftIcon = new L.Icon({
  iconUrl: iconUrl, // Change this to the path of your icon
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const iconDefaultBearing = 90;

const toRadians = (degree) => {
  return degree * (Math.PI / 180);
};

const toDegrees = (radians) => {
  return radians * (180 / Math.PI);
};

const calculateFuturePosition = (lat, lon, bearing, velocity, timeInSeconds = 1) => {
  const R = 6371.0; // Earth radius in kilometers

  // Convert distance from m/s to km and multiply by the desired time interval
  const distance = (velocity * timeInSeconds) / 1000;

  const delta = distance / R;
  const theta = toRadians(bearing);

  const phi1 = toRadians(lat);
  const lambda1 = toRadians(lon);

  const phi2 = phi1 + delta * Math.sin(theta);
  const lambda2 = lambda1 + (delta * Math.cos(theta)) / Math.cos(phi1);

  return [toDegrees(phi2), toDegrees(lambda2)];
};

const AircraftComponent = ({ aircraft }) => {
  const { latitude, longitude, velocity, heading } = aircraft;
  const [endLat, endLon] = calculateFuturePosition(latitude, longitude, heading, velocity, 60);
  // console.log("endLat", endLat);
  // console.log("endLon", endLon);

  return (
    <>
      <Marker position={[latitude, longitude]} icon={AircraftIcon} rotationAngle={heading - iconDefaultBearing} >
      <Popup>
          Aircraft <br /> Heading: { heading }
      </Popup>
    </Marker>
      {/* <Polyline
        positions={[
          [latitude, longitude],
          [endLat, endLon],
        ]}
        color="red"
        weight={1.5}
      /> */}
    </>
  );
};

const BoundingBoxComponent = ({ centerPoint, topLeft, bottomRight }) => {
  const boundingBoxRef = useRef(null);
  const map = useMap();

  useEffect(() => {
    if (boundingBoxRef.current) {
      boundingBoxRef.current.remove();
    }
    // const [topLeft, bottomRight] = calculateBox(map, centerPoint, point2, point3);
    addBoundingBox(map, topLeft, bottomRight);
  }, [map, centerPoint, topLeft, bottomRight]);

  const addBoundingBox = (map, topLeft, bottomRight) => {
    // console.log("topLeft", topLeft);
    // console.log("bottomRight", bottomRight);
    const polygon = L.rectangle([topLeft, bottomRight], {
      color: "black",
      fill: false,
      weight: 1,
      text: "Plane data",
    }).addTo(map);

    if (boundingBoxRef.current) {
      boundingBoxRef.current.remove();
    }
    boundingBoxRef.current = polygon;
    // const bboxCoords = [adjustedMinLat, adjustedMaxLat, adjustedMinLon, adjustedMaxLon];
    // return bboxCoords;
  };

  return null;
};

const FOVMap = ({ center, pCoords, bbCoords, objectData }) => {
  const [P1, P2] = pCoords;
  // console.log("pCoords", pCoords);
  const [topLeft, bottomRight] = bbCoords;

  console.log("objectData", objectData);

  return (
    <MapContainer center={center} zoom={10} style={{ height: "400px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
      <Polyline positions={[center, P1]} color="blue" weight={2} />
      <Polyline positions={[center, P2]} color="blue" weight={2} />
      <Polygon positions={[center, P1, P2]} color="blue" fill={true} weight={0} fillColor="lightskyblue" fillOpacity={0.3}>
        <Tooltip>Camera field of view</Tooltip>
      </Polygon>
      <BoundingBoxComponent centerPoint={center} topLeft={topLeft} bottomRight={bottomRight} />

      {objectData && objectData.map((aircraft, index) => <AircraftComponent key={index} aircraft={aircraft} />)}
    </MapContainer>
  );
};

export default FOVMap;
