import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { startCherryRenderer } from './webgpu-renderer';
import './landing.css';

interface LandingPageProps {
  onEnterGame: () => void;
}

function buildPlayUrl(): string {
  if (typeof window === 'undefined') return '';
  const { origin, pathname } = window.location;
  const cleanPath = pathname.endsWith('/') ? pathname : pathname + '/';
  return `${origin}${cleanPath}?play=1`;
}

export default function LandingPage({ onEnterGame }: LandingPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const isFlatRef = useRef(false);
  const [isFlat, setIsFlat] = useState(false);
  const [hasWebGpu] = useState(() =>
    typeof navigator !== 'undefined' && 'gpu' in navigator && Boolean(navigator.gpu),
  );

  const qrContent = useMemo(buildPlayUrl, []);

  useEffect(() => {
    isFlatRef.current = isFlat;
  }, [isFlat]);

  useEffect(() => {
    if (!hasWebGpu) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = startCherryRenderer({
      canvas,
      getQrContent: () => qrContent,
      getIsFlat: () => isFlatRef.current,
      getVisualStyle: () => 'tree',
    });
    return () => renderer.destroy();
  }, [hasWebGpu, qrContent]);

  useEffect(() => {
    if (hasWebGpu) return;
    const canvas = staticCanvasRef.current;
    if (!canvas) return;
    void QRCode.toCanvas(canvas, qrContent, {
      width: 260,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#241813', light: '#ffffff' },
    });
  }, [hasWebGpu, qrContent]);

  const toggleView = () => setIsFlat(v => !v);

  return (
    <div className="landing-root">
      <div className="landing-shell">
        <span className="landing-brand">
          <span className="landing-brand-dot" aria-hidden="true" />
          Hawker Mama
        </span>

        <section className="landing-scene">
          {hasWebGpu ? (
            <>
              <div className="landing-toolbar" role="group" aria-label="View mode">
                <button
                  type="button"
                  className={`landing-btn ${!isFlat ? 'landing-btn--active' : ''}`}
                  aria-pressed={!isFlat}
                  onClick={() => setIsFlat(false)}
                >
                  Cherry tree
                </button>
                <button
                  type="button"
                  className={`landing-btn ${isFlat ? 'landing-btn--active' : ''}`}
                  aria-pressed={isFlat}
                  onClick={() => setIsFlat(true)}
                >
                  Scan view
                </button>
              </div>
              <div className="landing-canvas-shell" id="shell-webgpu">
                <canvas
                  ref={canvasRef}
                  id="cherry-canvas"
                  width={800}
                  height={480}
                  tabIndex={0}
                  role="img"
                  aria-label="3D QR scene, click to toggle view"
                  onClick={toggleView}
                />
                <div id="wgpu-error" className="landing-error" hidden role="alert" />
              </div>
              <div className="landing-meta">
                <span id="gpu-status">Loading…</span>
                <span>Tap canvas to toggle</span>
              </div>
              <p id="qr-feedback" className="landing-feedback" role="status" />
            </>
          ) : (
            <>
              <div className="landing-canvas-shell landing-canvas-shell--fallback">
                <canvas
                  ref={staticCanvasRef}
                  id="static-qr-canvas"
                  width={260}
                  height={260}
                  role="img"
                  aria-label="QR code linking to the game"
                />
                <p className="landing-fallback-caption">
                  Point a second camera at this code, or tap Play now below.
                </p>
              </div>
              <div className="landing-meta">
                <span>Scannable QR</span>
                <span>Opens the game directly</span>
              </div>
            </>
          )}
        </section>

        <article className="landing-ticket">
          <p className="landing-eyebrow">Singapore Kitchen Rush</p>
          <h1 className="landing-title">
            A pocket kitchen,
            <br />
            <span className="landing-title-accent">one scan away.</span>
          </h1>
          <p className="landing-tagline">
            A mobile-first voxel cooking game about Singapore hawker dishes. Cook rice, poach
            chicken, pound chili, plate the set, and serve it hot.
          </p>
          <button type="button" className="landing-cta" onClick={onEnterGame}>
            Play now
            <span className="landing-cta-arrow" aria-hidden="true">
              →
            </span>
          </button>
        </article>

        <p className="landing-footer">Plays best on mobile · No install needed</p>
      </div>
    </div>
  );
}
