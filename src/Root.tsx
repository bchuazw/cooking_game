import { useEffect, useState } from 'react';
import App from './App';
import LandingPage from './landing/LandingPage';

function shouldSkipLandingFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('play') === '1';
}

export default function Root() {
  const [showGame, setShowGame] = useState(shouldSkipLandingFromUrl);

  useEffect(() => {
    if (!showGame) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('play') === '1') return;
    url.searchParams.set('play', '1');
    window.history.replaceState({}, '', url.toString());
  }, [showGame]);

  if (showGame) return <App />;

  return <LandingPage onEnterGame={() => setShowGame(true)} />;
}
