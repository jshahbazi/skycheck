import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons'

const ImageList = ({ images, removeImage, onError }) =>
  images.map((image, i) =>
    <div key={i} className='fadein'>
      <div onClick={() => removeImage(image)} className='delete'>
        <FontAwesomeIcon icon={faTimesCircle} size='2x' />
      </div>
      <img src={image} alt='' onError={() => onError(image)} />
    </div>
  )

export default ImageList;
