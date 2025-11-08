import React from 'react';
import ReactDOM from 'react-dom/client';
import { CanvaCallback } from './components/auth/CanvaCallback';

ReactDOM.createRoot(document.getElementById('canva-callback-root')!).render(
  <React.StrictMode>
    <CanvaCallback />
  </React.StrictMode>
);

