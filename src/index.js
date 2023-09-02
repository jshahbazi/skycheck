import React from 'react';
import { createRoot } from 'react-dom/client';  // <-- Change this import
import App from './App';
import registerServiceWorker from './registerServiceWorker';

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

registerServiceWorker();
