import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "./components/Spinner";
import ImageList from "./components/Images";
import UploadButton from "./components/Buttons";
import Footer from "./components/Footer";
import { r2 } from "./components/r2";
import "./App.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { S3Client } from "@aws-sdk/client-s3";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlane } from "@fortawesome/free-solid-svg-icons";

import heic2any from "heic2any";

import exifr from "exifr";

const SUPPORTED_FILE_TYPES = ["image/png", "image/jpeg", "image/heic"];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);

  const [mapPosition, setMapPosition] = useState([51.505, -0.09]);
  const [planes, setPlanes] = useState([]); // assume planes is an array of objects {id, position: [lat, lon]}
  const [bearing, setBearing] = useState(0); // just an example value
  const [fov, setFov] = useState(45); // field of view in degrees

  // const [file, setFile] = useState<File | undefined>(undefined);

  // Update the map position with GPS coordinates
  // useEffect(() => {
  //   // Assume fetchGPS is a function that returns the current GPS position
  //   // const newPosition = fetchGPS();
  //   // setMapPosition(newPosition);
  // }, [/* dependency to determine when to fetch GPS data */]);

  // useEffect(() => {
  //   fetch(`${API_URL}/wake-up`)
  //     .then(res => {
  //       if (res.ok) {
  //         setLoading(false);
  //       }
  //     });
  // }, []);

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
          "Content-Type":
            mimeType || fileOrBlob.type || "application/octet-stream", // Use provided mimeType, or fileOrBlob's type, or default to 'application/octet-stream'
        },
      };
      const result = await axios.put(signedUrl, fileOrBlob, options);
      // console.log("upload status: ", result.status);
      // console.log("upload data: ", result.data);
      return result.status;
    } catch (error) {
      console.error("Error:", error.message);
    }
  }

  async function downloadFile(signedUrl) {
    try {
      const response = await axios.get(signedUrl, { responseType: "blob" });
      console.log("download status: ", response.status);
      console.log("download result: ", response);
      console.log(typeof response.data);

      return response.data;
    } catch (error) {
      console.error("Error:", error.message);
    }
  }

  //   function base64ToBlob(base64, mimeType = '') {
  //     // Decode the base64 string
  //     const byteString = atob(base64.split(',')[1]);

  //     // Create a Uint8Array from the byte string
  //     const arrayBuffer = new ArrayBuffer(byteString.length);
  //     const uint8Array = new Uint8Array(arrayBuffer);
  //     for (let i = 0; i < byteString.length; i++) {
  //         uint8Array[i] = byteString.charCodeAt(i);
  //     }

  //     // Create a blob from the Uint8Array
  //     const blob = new Blob([uint8Array], { type: mimeType });

  //     return blob;
  // }

  // async function checkExifData(image) {
  //   EXIF.getData(image, function () {
  //     const allMetaData = EXIF.getAllTags(this);
  //     if (Object.keys(allMetaData).length === 0) {
  //       console.log("This image doesn't have EXIF data.");
  //     } else {
  //       console.log("This image has EXIF data:", allMetaData);
  //     }
  //   });
  // }

  // async function extractExifDataFromBlob(blob) {
  //   return new Promise((resolve, reject) => {
  //     const image = new Image();
  //     // const objectURL = URL.createObjectURL(blob);

  //     image.onload = function () {
  //       EXIF.getData(image, function () {
  //         const allMetaData = EXIF.getAllTags(this);
  //         console.log("allMetaData: ", allMetaData);

  //         if (Object.keys(allMetaData).length === 0) {
  //           reject(new Error("This image doesn't have EXIF data."));
  //         } else {
  //           resolve(allMetaData);
  //         }

  //         // URL.revokeObjectURL(objectURL);  // Clean up the object URL
  //       });
  //     };

  //     image.onerror = function () {
  //       reject(new Error("Failed to load the image from blob."));
  //     };

  //     image.src = objectURL;
  //   });
  // }

  // async function parseEXIF(file) {

  // }

  //   function convertToBlob(file) {
  //     const reader = new FileReader();

  //     reader.onload = function(event) {
  //         const arrayBuffer = event.target.result;
  //         const blob = new Blob([arrayBuffer], {type: file.type});

  //         // console.log(blob);
  //       return blob;
  //     };

  //     reader.readAsArrayBuffer(file);
  // }
  async function hashImage(file) {
    // Step 1: Read the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
  
    // Step 2: Hash the ArrayBuffer
    const crypto = window.crypto;
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  
    // Step 3: Convert the hash to a hexadecimal string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }


  async function extractExifData(file) {
    // Define the supported types if it's not already defined elsewhere
    // const types = ["image/png", "image/jpeg", "image/heic"]; // Add or remove supported types as needed
  
    if (file.type === "") {
      toast.error(`Unknown file type`);
      throw new Error('Unknown file type');
    }
    
    if (SUPPORTED_FILE_TYPES.every(type => file.type !== type)) {
      toast.error(`'${file.type}' is not a supported format`);
      throw new Error(`'${file.type}' is not a supported format`);
    }
    
    if (file.size > 150000000) {
      toast.error(`'${file.name}' is too large, please pick a smaller file`);
      throw new Error(`'${file.name}' is too large, please pick a smaller file`);
    }
  
    const exif = await exifr.parse(file);
    if (exif) {
      const exifDateTimeStr =
        exif.DateTimeOriginal || exif.DateTimeDigitized || exif.CreateDate;
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
      throw new Error('No EXIF data found.');
    }
  }

  function getExtensionFromMimeType(mimeType) {
    const mimeToExtension = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/tiff': 'tif',
        'image/bmp': 'bmp',
        'image/svg+xml': 'svg',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
        'video/mp4': 'mp4',
        'application/pdf': 'pdf',
    };

    return mimeToExtension[mimeType] || null;
}
  

  async function convertHEICToAny(file, toType, quality) {
    let convertedBlob = null;
    if (file.type === "image/heic") {
      toast.info("Converting image to jpeg...", { autoClose: 3000 });
      convertedBlob = await heic2any({
        blob: file,
        toType: toType,
        quality: quality,
      });
      let mimeType = toType;
      let fileExtension = getExtensionFromMimeType(toType);
      return { convertedBlob, mimeType, fileExtension };
    } else {
      convertedBlob = file;
      return { convertedBlob, mimeType: file.type, fileExtension: getExtensionFromMimeType(file.type) };
    }    


  }

  async function uploadImage(file, bucket, filePath) {
    let signedUrl = await getSignedUrlForFile(filePath, bucket, "putObject");
    let uploadStatus = await uploadFile(file, signedUrl, "image/jpeg");
    console.log("uploadStatus: ", uploadStatus);
    signedUrl = await getSignedUrlForFile(filePath, bucket, "getObject");
    return signedUrl;
  }


  async function addOrRetrieveImage(dataToSave) {
    const options = {
      headers: {
        "Content-Type": "application/json"
      },
    };
    const result = await axios.post("/write_to_r1", dataToSave, options);

    console.log("write_to_r1 result: ", result);
    console.log("write_to_r1 status: ", result.status);
    const { action, filePath } = result.data;
    console.log("write_to_r1 action: ", action);
    console.log("write_to_r1 filePath: ", filePath);
    // console.log("write_to_r1 data: ", result.data);
    return result.data;
  }


  const onChange = (e) => {
    const files = Array.from(e.target.files);
    // const types = ["image/png", "image/jpeg", "image/heic"];

    if (files.length > 1) {
      toast.error("Only 1 image can currently be uploaded at a time");
    }

    files.forEach(async (file) => {

      setUploading(true);

      let exifData = {};
      try {
        exifData = await extractExifData(file);
        console.log(exifData);
      } catch (error) {
        console.error(error.message);
        setUploading(false);
        return;
      }      

      let { convertedFile, mimeType, fileExtension } = await convertHEICToAny(file, "image/jpeg", 1.0);

      const bucket = process.env.REACT_APP_R2_BUCKET_NAME;
      const generatedUUID = uuidv4();
      const newFileName = `${generatedUUID}${fileExtension}`;
      const proposedFilePath = `${bucket}/${newFileName}`;

      const imageHash = await hashImage(file);
      console.log("imageHash: ", imageHash);

      const dataToSave = {
        imageHash: imageHash,
        filePath: proposedFilePath,
        bucket: bucket,
        mimeType: mimeType,
        exifData: exifData
      };
      console.log("dataToSave: ", dataToSave);

      const { action, filePath } = await addOrRetrieveImage(dataToSave);

      if (action === "add") {
        toast.info("Uploading image...", { autoClose: 2000 });
        try {
          let signedUrl = await uploadImage(convertedFile, bucket, filePath);
          setImages((prevImages) => [...prevImages, signedUrl]);
          setUploading(false);
        } catch (error) {
          toast.info("Error uploading image...", { autoClose: 2000 });
          console.error(error.message);
          setUploading(false);
          return;
        }
      } else if (action === "retrieve") {
        toast.info("Image already exists. Retrieving...", { autoClose: 2000 });
        let signedUrl = await getSignedUrlForFile(filePath, bucket, "getObject");
        setImages((prevImages) => [...prevImages, signedUrl]);
        return;
      }



    });
  };

  const removeImage = (id) => {
    setImages((prevImages) => prevImages.filter((image) => image !== id));
  };

  const getFOVPolygon = () => {
    return [
      mapPosition,
      [mapPosition[0] + 0.01, mapPosition[1] + 0.01],
      [mapPosition[0] - 0.01, mapPosition[1] + 0.01],
    ];
  };

  // const planeIcon = new L.Icon({
  //   iconUrl: '/path-to-your-plane-icon.png',
  //   iconSize: [32, 32],
  // });

  const planeIcon = () => <FontAwesomeIcon icon={faPlane} />;

  const onImagesError = (image) => {
    removeImage(image);
    toast.error("Failed to load the image.");
  };

  const content = () => {
    switch (true) {
      case uploading:
        return <Spinner />;
      case images.length > 0:
        return (
          <div>
            <ImageList
              images={images}
              removeImage={removeImage}
              onError={onImagesError}
            />
          </div>
        );
      default:
        return (
          <div>
            <UploadButton onChange={onChange} />
            <MapContainer
              center={mapPosition}
              zoom={13}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* {planes.map(plane => (
                <Marker key={plane.id} position={plane.position} icon={planeIcon}>
                  <Popup>
                    Plane ID: {plane.id}
                  </Popup>
                </Marker>
              ))} */}
              <Polygon positions={getFOVPolygon()} />
            </MapContainer>
          </div>
        );
    }
  };

  return (
    <div className="container">
      <header className="header">
        <div className="logo">SkyCheck</div>
        <nav className="menu">
          <ul>
            <li>
              <a href="#">About</a>
            </li>
            <li>
              <a href="#">Contact</a>
            </li>
            <li>
              <a
                href="https://www.zeffy.com/en-US/donation-form/01e7c013-796a-4574-b8b3-3c8c96a6cefd"
                target="_blank"
                rel="noopener noreferrer"
              >
                Donate
              </a>
            </li>
          </ul>
        </nav>
      </header>
      <ToastContainer />
      <div className="other-text">
        Check the sky for aircraft and other objects. Upload original photos
        that contain GPS data and we will analyze them for you.
      </div>

      {/* <UploadButton onChange={onChange} /> */}
      <div className="buttons">{content()}</div>

      <Footer />
    </div>
  );
}
