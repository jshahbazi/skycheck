import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import Map from './Map'; // Import the Map component

const UploadButton = ({ onChange }) => (
  <div>
    <div className='upload-text'>
      <p>Upload your images here:</p>
    </div>
    <div className='button fadein'>
      <label htmlFor='single'>
        <FontAwesomeIcon icon={faImage} color='#3B5998' size='10x' />
      </label>
      <input type='file' id='single' accept='image/*' onChange={onChange} />
    </div>
    <p></p>
  </div>
);

export default UploadButton;