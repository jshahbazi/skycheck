import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "./components/Spinner";
import ImageList from "./components/Images";
import UploadButton from "./components/Buttons";
import Footer from "./components/Footer";
// import { r2 } from "./components/r2";
import FOVMap from "./components/FOVMap";
import "./styles/App.css";
import "leaflet/dist/leaflet.css";
// import { MapContainer, TileLayer, Marker, Polyline, Polygon, Tooltip } from "react-leaflet";
// import L from "leaflet";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { S3Client } from "@aws-sdk/client-s3";

// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faPlane } from "@fortawesome/free-solid-svg-icons";

import heic2any from "heic2any";

import exifr from "exifr";

const SUPPORTED_FILE_TYPES = ["image/png", "image/jpeg", "image/heic"];
const USERNAME = "Shahbazian";
const PASSWORD = "fepci4-pePmyg-sudrac";
const URL = "https://opensky-network.org/api/states/all";

export default function App() {
  // const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);

  const [cameraPosition, setCameraPosition] = useState([]);
  // const [planes, setPlanes] = useState([]); // assume planes is an array of objects {id, position: [lat, lon]}
  const [bearing, setBearing] = useState(0);
  const [fov, setFov] = useState(45); // field of view in degrees
  // const [cameraData, setCameraData] = useState({});
  const [pCoords, setPCoords] = useState([]);
  const [bbCoords, setBBCoords] = useState([]);
  const [boundingBuffer, setBoundingBuffer] = useState(0.1);
  const [timestamp, setTimestamp] = useState(0);

  const [objectData, setObjectData] = useState([]);

  const fetchAircraftData = async (pCoords, timestamp) => {
    // if pcoords = 0 then return
    if (pCoords[0][0] === 0 && pCoords[0][1] === 0 && pCoords[1][0] === 0 && pCoords[1][1] === 0) {
      return [];
    }
    const [P1, P2] = pCoords;
    const [lat1, lon1] = P1;
    const [lat2, lon2] = P2;
    const lamin = Math.min(lat1, lat2);
    const lomin = Math.min(lon1, lon2);
    const lamax = Math.max(lat1, lat2);
    const lomax = Math.max(lon1, lon2);

    const params = {
      time: timestamp,
      lamin: lamin,
      lomin: lomin,
      lamax: lamax,
      lomax: lomax,
    };

    const response = await axios.get(URL, {
      auth: {
        username: USERNAME,
        password: PASSWORD,
      },
      params: params,
    });

    console.log("get aircraft in area: ", response.data);

    return response.data;
  };

  async function fetchAircraftInfo(icao24) {
    const URL = `https://opensky-network.org/api/metadata/aircraft/icao/${icao24}`;
    const response = await axios.get(URL, {
      auth: {
        username: USERNAME,
        password: PASSWORD,
      },
    });
    return response.data;
  }


  async function increaseBoundingBuffer() {
    const newBoundingBuffer = boundingBuffer + 0.1;
    const [P1, P2] = pCoords;
    const [topLeft, bottomRight] = calculateBox(cameraPosition, P1, P2, newBoundingBuffer);
    const newBBCoords = [topLeft, bottomRight]
    setBBCoords(newBBCoords);
    setBoundingBuffer(newBoundingBuffer);
    setObjectData([]);
    try {
      await updateAircraftData(newBBCoords, timestamp);
    } catch (error) {
      if ("response" in error && error.response.status === 400 && error.response.data.includes("Historical data more than 1 hour ago")) {
        toast.error("Historical data more than 1 hour ago is not available.");
      } else {
        toast.error("Error: " + error.message);
      }
    }
  }

  async function decreaseBoundingBuffer() {
    const newBoundingBuffer = boundingBuffer - 0.1;
    const [P1, P2] = pCoords;
    const [topLeft, bottomRight] = calculateBox(cameraPosition, P1, P2, newBoundingBuffer);
    const newBBCoords = [topLeft, bottomRight]
    setBBCoords(newBBCoords);
    setBoundingBuffer(newBoundingBuffer);
    setObjectData([]);
    try {
      await updateAircraftData(newBBCoords, timestamp);
    } catch (error) {
      if ("response" in error && error.response.status === 400 && error.response.data.includes("Historical data more than 1 hour ago")) {
        toast.error("Historical data more than 1 hour ago is not available.");
      } else {
        toast.error("Error: " + error.message);
      }
    }
  }

  async function getSignedUrlForFile(key, bucket, action = "putObject") {
    try {
      const r2 = new S3Client({
        region: "auto",
        endpoint: `https://${process.env.REACT_APP_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.REACT_APP_R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.REACT_APP_R2_SECRET_ACCESS_KEY,
        },
      });

      let signedUrl = "";
      if (action === "putObject") {
        signedUrl = await getSignedUrl(
          r2,
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
          }),
          { expiresIn: 60 }
        );
      } else if (action === "getObject") {
        signedUrl = await getSignedUrl(
          r2,
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          }),
          { expiresIn: 60 }
        );
      }

      return signedUrl;
    } catch (error) {
      console.error("Error:", error.message);
      return error;
    }
  }

  async function uploadFile(fileOrBlob, signedUrl, mimeType) {
    try {
      const options = {
        headers: {
          "Content-Type": mimeType || fileOrBlob.type || "application/octet-stream", // Use provided mimeType, or fileOrBlob's type, or default to 'application/octet-stream'
        },
      };
      const result = await axios.put(signedUrl, fileOrBlob, options);
      return result.status;
    } catch (error) {
      console.error("Error:", error.message);
    }
  }

  async function downloadFile(signedUrl) {
    try {
      const response = await axios.get(signedUrl, { responseType: "blob" });
      return response.data;
    } catch (error) {
      console.error("Error:", error.message);
    }
  }

  async function hashImage(file) {
    const arrayBuffer = await file.arrayBuffer();
    const crypto = window.crypto;
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
  }

  async function extractExifData(file) {
    if (file.type === "") {
      toast.error(`Unknown file type`);
      throw new Error("Unknown file type");
    }

    if (SUPPORTED_FILE_TYPES.every((type) => file.type !== type)) {
      toast.error(`'${file.type}' is not a supported format`);
      throw new Error(`'${file.type}' is not a supported format`);
    }

    if (file.size > 150000000) {
      toast.error(`'${file.name}' is too large, please pick a smaller file`);
      throw new Error(`'${file.name}' is too large, please pick a smaller file`);
    }

    const exif = await exifr.parse(file);
    if (exif) {
      const exifDateTimeStr = exif.DateTimeOriginal || exif.DateTimeDigitized || exif.CreateDate;
      const dateObj = new Date(exifDateTimeStr);
      const unixTimestamp = Math.floor(dateObj.getTime() / 1000);

      const exifData = {
        Camera: exif.Make + " " + exif.Model,
        DigitalZoomRatio: exif.DigitalZoomRatio || 1.0,
        Latitude: exif.latitude,
        Longitude: exif.longitude,
        CameraBearing: exif.GPSImgDirection,
        PixelWidth: exif.ImageWidth || exif.ExifImageWidth,
        PixelHeight: exif.ImageHeight || exif.ExifImageHeight,
        FocalLength35mm: exif.FocalLengthIn35mmFormat,
        FocalLength: exif.FocalLength,
        Timestamp: unixTimestamp,
        GPSAltitude: exif.GPSAltitude,
        GPSHPositioningError: exif.GPSHPositioningError,
        GPSSpeed: exif.GPSSpeed,
        GPSSpeedRef: exif.GPSSpeedRef,
        ExposureTime: exif.ExposureTime,
        ShutterSpeedValue: exif.ShutterSpeedValue,
      };
      return exifData;
    } else {
      toast.error("No EXIF data found.");
      throw new Error("No EXIF data found.");
    }
  }

  function getExtensionFromMimeType(mimeType) {
    const mimeToExtension = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/tiff": "tif",
      "image/bmp": "bmp",
      "image/svg+xml": "svg",
      "audio/mpeg": "mp3",
      "audio/wav": "wav",
      "video/mp4": "mp4",
      "application/pdf": "pdf",
    };

    return mimeToExtension[mimeType] || null;
  }

  async function convertHEICToAny(file, toType, quality) {
    let mimeType = toType;
    let fileExtension = getExtensionFromMimeType(toType);

    if (file.type === "image/heic") {
      toast.info("Converting image to jpeg...", { autoClose: 3000 });
      const convertedFile = await heic2any({
        blob: file,
        toType: toType,
        quality: quality,
      });
      return { convertedFile, mimeType, fileExtension };
    } else {
      const convertedFile = file;
      return { convertedFile, mimeType, fileExtension };
    }
  }

  async function uploadImage(file, bucket, filePath) {
    let signedUrl = await getSignedUrlForFile(filePath, bucket, "putObject");
    let uploadStatus = await uploadFile(file, signedUrl, "image/jpeg");
    // console.log("uploadStatus: ", uploadStatus);
    signedUrl = await getSignedUrlForFile(filePath, bucket, "getObject");
    return signedUrl;
  }

  async function addOrRetrieveImage(dataToSave) {
    const options = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const result = await axios.post("/write_to_r1", dataToSave, options);
    return result.data;
  }

  async function handleImage(file, imageData) {
    const { action, filePath } = await addOrRetrieveImage(imageData);
    let signedUrl = null;

    if (action === "add") {
      toast.info("Uploading image...", { autoClose: 2000 });
      signedUrl = await uploadImage(file, imageData.bucket, filePath);
    } else if (action === "retrieve") {
      toast.info("Image already exists. Retrieving...", { autoClose: 2000 });
      signedUrl = await getSignedUrlForFile(filePath, imageData.bucket, "getObject");
    }
    return signedUrl;
  }

  function estimateSensorSize(pixelWidth, pixelHeight, actualFocalLength, focalLength35mm) {
    const cropFactor = focalLength35mm / actualFocalLength;
    const sensorWidth = 36 / cropFactor;
    const pixelSizeWidth = sensorWidth / pixelWidth;
    const sensorHeight = 24 / cropFactor;

    return [sensorWidth, sensorHeight];
  }

  function calculateFov(sensorSize, focalLength) {
    return 2 * Math.atan(sensorSize / (2 * focalLength)) * (180 / Math.PI);
  }

  const calculateEndpoint = (latitude, longitude, bearing, distance) => {
    const R = 6371.0; // Earth radius in kilometers
    const dRad = distance / R;

    const latRad = toRadians(latitude);
    const lonRad = toRadians(longitude);
    const bearingRad = toRadians(bearing);

    const endLatRad = Math.asin(Math.sin(latRad) * Math.cos(dRad) + Math.cos(latRad) * Math.sin(dRad) * Math.cos(bearingRad));

    const endLonRad = lonRad + Math.atan2(Math.sin(bearingRad) * Math.sin(dRad) * Math.cos(latRad), Math.cos(dRad) - Math.sin(latRad) * Math.sin(endLatRad));

    const endLat = toDegrees(endLatRad);
    const endLon = toDegrees(endLonRad);

    return [endLat, endLon];
  };

  const calculateFovEndpoints = (cameraLat, cameraLon, bearing, fov, maxDistance) => {
    const P1 = calculateEndpoint(cameraLat, cameraLon, bearing - fov / 2, maxDistance);
    const P2 = calculateEndpoint(cameraLat, cameraLon, bearing + fov / 2, maxDistance);
    return [P1, P2];
  };

  const calculateBox = (centerPoint, point2, point3, boundingBuffer) => {
    // Extract latitudes and longitudes from points
    const lats = [centerPoint[0], point2[0], point3[0]];
    const lons = [centerPoint[1], point2[1], point3[1]];

    // Find min and max for latitudes and longitudes
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    // Calculate the buffer for lat and lon
    const latBuffer = (maxLat - minLat) * boundingBuffer;
    const lonBuffer = (maxLon - minLon) * boundingBuffer;

    // Adjust the bounding box with the buffer
    const adjustedMinLat = minLat - latBuffer;
    const adjustedMaxLat = maxLat + latBuffer;
    const adjustedMinLon = minLon - lonBuffer;
    const adjustedMaxLon = maxLon + lonBuffer;

    const topLeft = [adjustedMaxLat, adjustedMinLon];
    const bottomRight = [adjustedMinLat, adjustedMaxLon];

    return [topLeft, bottomRight];
  };

  // Utility functions to convert degrees to radians and vice versa
  const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
  };

  const toDegrees = (radians) => {
    return radians * (180 / Math.PI);
  };


  async function retrieveAircraftInfo(icao24) {
    const options = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const result = await axios.get("/get_aircraft", icao24, options);
    return result.data;
    // const { manufacturername, model} = await retrieveAircraftInfo(icao24);
  }

  async function updateAircraftData(bbCoords, timestamp) {
    // console.log("bbCoords: ", bbCoords);
    const [bb1, bb2] = bbCoords;
    const responseData = await fetchAircraftData([bb1, bb2], timestamp);
    if ("states" in responseData) {
      responseData.states.forEach(async (aircraft) => {
        const [icao24, callsign, origin_country, time_position, last_contact, longitude, latitude, baro_altitude, on_ground, velocity, true_track, vertical_rate, sensors, geo_altitude, squawk, spi, position_source] = aircraft;
        const heading = true_track;
        // console.log("aircraft position: ", latitude, longitude);
        const data = { time_position, longitude, latitude, baro_altitude, on_ground, velocity, heading, vertical_rate, geo_altitude };
        console.log("aircraft data sent to get_aircraft: ", data);
        if (on_ground === false) {
          // const aircraftInfo = await fetchAircraftInfo(icao24);
          const { manufacturername, model} = await retrieveAircraftInfo(icao24);
          // combine data and aircraftInfo
          data.manufacturerName = manufacturername;
          data.model = model;
          // data.registration = aircraftInfo.registration;
          // console.log("aircraftInfo: ", aircraftInfo);  
          console.log("aircraft data: ", data);
          setObjectData((prevState) => [...prevState, data]);
          console.log("objectData after being set: ", objectData);
        }



      });
    } else {
      toast.info("No aircraft found in the area.");
      setObjectData([]);
    }
  }

  const resetState = () => {
    setImages([]);
    setCameraPosition([]);
    setBearing(0);
    setFov(45);
    setPCoords([]);
    setBBCoords([]);
    setObjectData([]);
    setBoundingBuffer(0.1);
  };

  const onChange = (e) => {
    resetState();
    const files = Array.from(e.target.files);

    if (files.length > 1) {
      toast.error("Only 1 image can currently be uploaded at a time");
    }

    files.forEach(async (file) => {
      setUploading(true);

      let exifData = {};
      try {
        exifData = await extractExifData(file);
      } catch (error) {
        console.error(error.message);
        toast.error("Error: " + error.message, { autoClose: 2000 });
        setUploading(false);
        return;
      }
      // console.log(exifData);
      // Camera: exif.Make + " " + exif.Model,
      // DigitalZoomRatio: exif.DigitalZoomRatio || 1.0,
      // Latitude: exif.latitude,
      // Longitude: exif.longitude,
      // CameraBearing: exif.GPSImgDirection,
      // PixelWidth: exif.ImageWidth || exif.ExifImageWidth,
      // PixelHeight: exif.ImageHeight || exif.ExifImageHeight,
      // FocalLength35mm: exif.FocalLengthIn35mmFormat,
      // FocalLength: exif.FocalLength,
      // Timestamp: unixTimestamp,
      // GPSAltitude: exif.GPSAltitude,
      // GPSHPositioningError: exif.GPSHPositioningError,
      // GPSSpeed: exif.GPSSpeed,
      // GPSSpeedRef: exif.GPSSpeedRef,
      // ExposureTime: exif.ExposureTime,
      // ShutterSpeedValue: exif.ShutterSpeedValue,

      const { Latitude, Longitude, CameraBearing, PixelWidth, PixelHeight, FocalLength, FocalLength35mm, Timestamp } = exifData;
      // console.log("Latitude: ", Latitude);
      // console.log("Longitude: ", Longitude);
      // console.log("CameraBearing: ", CameraBearing);
      const sensorWidthHeight = estimateSensorSize(PixelWidth, PixelHeight, FocalLength, FocalLength35mm);
      const calculatedFov = calculateFov(sensorWidthHeight[0], FocalLength);
      // console.log("calculatedFov: ", calculatedFov);
      const [P1, P2] = calculateFovEndpoints(Latitude, Longitude, CameraBearing, calculatedFov, 20);
      const startingBoundingBuffer = 0.1;
      const [topLeft, bottomRight] = calculateBox([Latitude, Longitude], P1, P2, startingBoundingBuffer);

      setFov(calculatedFov);
      setPCoords([P1, P2]);
      setCameraPosition([Latitude, Longitude]);
      setBearing(CameraBearing);
      setTimestamp(Timestamp);
      setBBCoords([topLeft, bottomRight]);

      try {
        await updateAircraftData([topLeft, bottomRight], Timestamp);
      } catch (error) {
        // console.error("Error:", error.message);
        if ("response" in error && error.response.status === 400 && error.response.data.includes("Historical data more than 1 hour ago")) {
          toast.error("Historical data more than 1 hour ago is not available.");
        } else {
          toast.error("Error: " + error.message);
        }
      }
      setUploading(false);

      let { convertedFile, mimeType, fileExtension } = await convertHEICToAny(file, "image/jpeg", 1.0);

      const bucket = process.env.REACT_APP_R2_BUCKET_NAME;
      const generatedUUID = uuidv4();
      const newFileName = `${generatedUUID}.${fileExtension}`;
      const proposedFilePath = `${newFileName}`;
      const imageHash = await hashImage(file);

      const dataToSave = {
        imageHash: imageHash,
        filePath: proposedFilePath,
        bucket: bucket,
        mimeType: mimeType,
        exifData: exifData,
      };

      let imageURL = null;
      try {
        imageURL = await handleImage(convertedFile, dataToSave);
      } catch (error) {
        toast.info("Error: " + error.message, { autoClose: 2000 });
        console.error(error.message);
      }

      setImages((prevImages) => [...prevImages, imageURL]);
      setUploading(false);
      return;
    });
  };

  const removeImage = (id) => {
    setImages((prevImages) => prevImages.filter((image) => image !== id));
  };

  // const getFOVPolygon = () => {
  //   return [mapPosition, [mapPosition[0] + 0.01, mapPosition[1] + 0.01], [mapPosition[0] - 0.01, mapPosition[1] + 0.01]];
  // };

  // const planeIcon = new L.Icon({
  //   iconUrl: '/path-to-your-plane-icon.png',
  //   iconSize: [32, 32],
  // });

  // const planeIcon = () => <FontAwesomeIcon icon={faPlane} />;

  const onImagesError = (image) => {
    removeImage(image);
    toast.error("Failed to load the image.");
  };

  const PlaneIcon = () => (
    // <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="24" height="24">
    //   <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    // </svg>

    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="32" height="32">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );

  const mainText = () => {
    return (
      // Check the sky for aircraft and other objects. Upload original photos that contain GPS data and we will analyze them for you.
      <div>
        <h1>Check the sky for aircraft and other objects</h1>
        <p>Upload original photos that contain GPS data and we will analyze them for you</p>
        <ul><li>Due to aircraft API restrictions, we can only look back one hour, so upload the photo ASAP</li></ul>
        <p>Aircraft on the ground are filtered out</p>
        <p>Currently only supports JPEG, PNG, and HEIC files</p>
        <p>Note that the exact GPS data in your photo may be off due to surroundings</p>
        <p>The Field-Of-View is taken from the camera bearing, but that is dependent on GPS and the internal gyroscope so it could be dramatically off</p>
        <p>We do not store any identifying data</p>
      </div>
    );
  };

  // const { latitude, longitude, velocity, heading } = aircraft;
  const content = () => {
    switch (true) {
      case uploading:
        return <Spinner />;
      case images.length > 0:
        return (
          <div className="container">
            <div className="image-list">
              <ImageList images={images} removeImage={removeImage} onError={onImagesError} />
            </div>
            <div className="fov-map">
              <FOVMap center={cameraPosition} pCoords={pCoords} bbCoords={bbCoords} objectData={objectData} />
              Bounding Box Size:&nbsp;
              <button onClick={increaseBoundingBuffer}>+</button>
              <button onClick={decreaseBoundingBuffer}>-</button>
            </div>
          </div>
        );
      default:
        return (
          <div>
            <UploadButton onChange={onChange} />
          </div>
        );
    }
  };

  return (
    <div className="container">
      <header className="header">
        <div className="logo">
          {" "}
          <PlaneIcon />
          SkyCheck
        </div>
        <nav className="menu">
          <ul>
            <li>
              <a href="#">About</a>
            </li>
            <li>
              <a href="#">Contact</a>
            </li>
            <li>
              <a href="https://www.zeffy.com/en-US/donation-form/01e7c013-796a-4574-b8b3-3c8c96a6cefd" target="_blank" rel="noopener noreferrer">
                Donate
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <ToastContainer />
      <div className="other-text">{mainText()}</div>

      {/* <UploadButton onChange={onChange} /> */}
      <div className="buttons">{content()}</div>

      <Footer />
    </div>
  );
}
