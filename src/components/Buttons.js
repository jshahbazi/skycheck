import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';

const UploadButton = ({ onChange }) => (
  <div>
    <div className='upload-text'>
      <p>Upload your image here:</p>
    </div>
    <div className='button fadein'>
      <label htmlFor='single'>
        <FontAwesomeIcon icon={faImage} color='#3B5998' size='10x' />
      </label>
      <input type='file' id='single' onChange={onChange} />
    </div>
    <p></p>
  </div>
);

export default UploadButton;
