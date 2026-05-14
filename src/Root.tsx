import { Suspense, lazy, useEffect, useState } from 'react';
import LandingPage from './landing/LandingPage';

const App = lazy(() => import('./App'));

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

  if (showGame) {
    return (
      <Suspense fallback={<GameLoading />}>
        <App />
      </Suspense>
    );
  }

  return <LandingPage onEnterGame={() => setShowGame(true)} />;
}

function GameLoading() {
  return (
    <main className="app-shell">
      <section className="screen menu-screen">
        <div className="menu-vignette" />
        <div className="menu-card">
          <p className="eyebrow">Loading</p>
          <h1>Kitchen</h1>
        </div>
      </section>
    </main>
  );
}
