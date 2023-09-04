import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Spinner from './components/Spinner';
import Images from './components/Images';
import UploadButton from './components/Buttons';
import Footer from './components/Footer';
import { r2 } from './components/r2';
import './App.css';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { S3Client } from '@aws-sdk/client-s3'

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

  async function getSignedUrlForFile(fileName) {
    try {
      const payload = {
        fileName: fileName
      };
      // const post_response = await axios.post('/upload', { payload });
      // console.log("post_response status: ", post_response.status);
      // console.log("post_response data: ", post_response.data);
      // const data = await post_response.json();
      // console.log("data: ", data);
      // console.log("Received signed URL:", data.signedUrl);

      // const { fileName } = request.body;
      // console.log("request: ", request);
      console.log("fileName: ", fileName);

      const r2 = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.REACT_APP_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.REACT_APP_R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.REACT_APP_R2_SECRET_ACCESS_KEY,
        },
      })

      console.log("process.env.REACT_APP_R2_BUCKET_NAME: ", process.env.REACT_APP_R2_BUCKET_NAME);

      try {
        const signedUrl = await getSignedUrl(
          r2,
          new PutObjectCommand({
            Bucket: process.env.REACT_APP_R2_BUCKET_NAME,
            Key: fileName,
          }),
          { expiresIn: 60 }
        );
        console.log("Success generating upload URL: ", signedUrl);

        return signedUrl;

      } catch (error) {
        console.error(error);
        return error;
        // return new Response(error.message, { status: 500 });
      }


      // return data.signedUrl;

    } catch (error) {
      console.error("Error:", error.message);
    }
  }

  async function uploadFile(file, signedUrl) {
    try {
      const options = {
        headers: {
          'Content-Type': file.type,
        },
      };
      const result = await axios.put(signedUrl, file, options);
      console.log("upload status: ", result.status);
      console.log("upload data: ", result.data);
      return result.status;
    } catch (error) {
      console.error("Error:", error.message);
    }
  }
  



  const onChange = e => {
    const errs = [];
    const files = Array.from(e.target.files);
    const formData = new FormData();
    const types = ['image/png', 'image/jpeg', 'image/heic'];

    if (files.length > 1) {
      toast.error('Only 1 image can currently be uploaded at a time');
    }

    files.forEach(async (file) => {
      if (file.type == '') {
        toast.error(`Unknown file type`)
        return;
      }
      if (types.every(type => file.type !== type)) {
        toast.error(`'${file.type}' is not a supported format`);
        return;
      }
      if (file.size > 150000000) {
        toast.error(`'${file.name}' is too large, please pick a smaller file`);
        return;
      }
      console.log("file name: ", file.name);

      setUploading(true);
      
      let signedUrl = await getSignedUrlForFile(file.name);

      console.log("signedUrl: ", signedUrl);

      let uploadStatus = await uploadFile(file, signedUrl);

      console.log("uploadStatus: ", uploadStatus);



    });

    // setUploading(true);

    // fetch(`${API_URL}/image-upload`, {
    //   method: 'POST',
    //   body: formData
    // })
    //   .then(res => {
    //     if (!res.ok) {
    //       throw res;
    //     }
    //     return res.json();
    //   })
    //   .then(imgs => {
    //     setUploading(false);
    //     setImages(imgs);
    //   })
    //   .catch(err => {
    //     err.json().then(e => {
    //       setUploading(false);
    //     });
    //   });
  };

  const removeImage = id => {
    setImages(prevImages => prevImages.filter(image => image.public_id !== id));
  };


  const getFOVPolygon = () => {
    // This is a mock function to get points for FOV, you'd replace this with actual math to compute the triangular region or whatever shape you need
    // It's highly dependent on your specific requirements, FOV, and bearing
    return [
      mapPosition,
      [mapPosition[0] + 0.01, mapPosition[1] + 0.01],
      [mapPosition[0] - 0.01, mapPosition[1] + 0.01]
    ];
  };

  const planeIcon = new L.Icon({
    iconUrl: '/path-to-your-plane-icon.png',
    iconSize: [32, 32],
  });

  const content = () => {
    switch (true) {
      case uploading:
        return <Spinner />;
      case images.length > 0:
        return (
          <Images
            images={images}
            removeImage={removeImage}
          />
        );
      default:
        return (
          <div>
            <UploadButton onChange={onChange} />
            <MapContainer center={mapPosition} zoom={13} scrollWheelZoom={false}>
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
    <div className='container'>
      <header className='header'>
        <div className='logo'>SkyCheck</div>
        <nav className='menu'>
          <ul>
            <li><a href='#'>About</a></li>
            <li><a href='#'>Contact</a></li>
            <li><a href='https://www.zeffy.com/en-US/donation-form/01e7c013-796a-4574-b8b3-3c8c96a6cefd' target="_blank" rel="noopener noreferrer">Donate</a></li>
          </ul>
        </nav>
      </header>
      <ToastContainer />
      <div className='other-text'>
        Check the sky for aircraft and other objects. Upload original photos that contain GPS data and we will analyze them for you.
      </div>
      <div className='buttons'>{content()}</div>

      <Footer />
    </div>
  );
}
