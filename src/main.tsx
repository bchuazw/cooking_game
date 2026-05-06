import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { loadMusicManifest } from './audio/audio';
import { track } from './telemetry';
import { cleanupLegacyServiceWorker } from './pwaCleanup';

const base = (import.meta.env.BASE_URL as string) ?? '/';
cleanupLegacyServiceWorker(base);
void loadMusicManifest(base);
track('session_start');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
