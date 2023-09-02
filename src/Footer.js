import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMediumM, faGithub } from '@fortawesome/fontawesome-free'

const Footer = () => (
  <footer>
    <a 
      href='https://skycheck.io' 
      title='SkyCheck'
      className={'small-button medium'}
    >
      <FontAwesomeIcon icon={faMediumM} size='3x' color='#fff' />
    </a>
    <a 
      href='https://github.com/funador/react-image-upload' 
      title='Github repo'
      className={'small-button github'}
    >
      <FontAwesomeIcon icon={faGithub} size='3x' color='#fff' />
    </a>
  </footer>
);

export default Footer;
