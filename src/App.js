import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import Images from './Images';
import UploadButton from './Buttons';
import Footer from './Footer';
import './App.css';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);

  const [mapPosition, setMapPosition] = useState([51.505, -0.09]);
  const [planes, setPlanes] = useState([]); // assume planes is an array of objects {id, position: [lat, lon]}
  const [bearing, setBearing] = useState(0); // just an example value
  const [fov, setFov] = useState(45); // field of view in degrees

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

  const onChange = e => {
    const errs = [];
    const files = Array.from(e.target.files);
    const formData = new FormData();
    const types = ['image/png', 'image/jpeg', 'image/gif'];

    // files.forEach((file, i) => {
    //   if (types.every(type => file.type !== type)) {
    //     errs.push(`'${file.type}' is not a supported format`);
    //   }
    //   if (file.size > 150000) {
    //     errs.push(`'${file.name}' is too large, please pick a smaller file`);
    //   }
    //   formData.append(i, file);
    // });

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
            <button zeffy-form-link="https://www.zeffy.com/en-US/embed/donation-form/01e7c013-796a-4574-b8b3-3c8c96a6cefd?modal=true">
              Donate
            </button>
          </ul>
        </nav>
      </header>
      <div className='other-text'>
        Check the sky for aircraft and other objects. Upload original photos that contain GPS data and we will analyze them for you.
      </div>
      <div className='buttons'>{content()}</div>

      <Footer />
    </div>
  );
}
