import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { CHICKEN_RICE, starsFromAverage, tierFromScore, type StepDefinition, type Tier } from './gameData';
import { VoxelCanvas, type VisualState } from './VoxelCanvas';

interface StepResult {
  id: string;
  title: string;
  score: number;
  tier: Tier;
}

type Screen = 'menu' | 'cook' | 'result';

const BEST_KEY = 'hawker-mama:fresh-redesign:v1';
const FILLED_STAR = '\u2605';
const EMPTY_STAR = '\u2606';
const SIMMER_MIN = 0.48;
const SIMMER_MAX = 0.76;
const STIR_TURN_TARGET = Math.PI * 1.45;
const MASH_READY_PRESS = 0.55;

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [stepIndex, setStepIndex] = useState(0);
  const [results, setResults] = useState<StepResult[]>([]);
  const [visualState, setVisualState] = useState<VisualState>({});
  const [feedback, setFeedback] = useState<StepResult | null>(null);
  const [best, setBest] = useState(() => loadBest());
  const [musicOn, setMusicOn] = useState(false);
  const completingRef = useRef(false);
  const musicRef = useRef<MusicLoop | null>(null);

  const step = CHICKEN_RICE.steps[stepIndex];
  const average = results.length ? results.reduce((sum, item) => sum + item.score, 0) / results.length : 0;
  const stars = results.length ? starsFromAverage(average) : 1;

  const startMusic = useCallback(async () => {
    try {
      if (!musicRef.current) {
        musicRef.current = createMusicLoop();
      }
      await musicRef.current.start();
      setMusicOn(true);
    } catch {
      musicRef.current = null;
      setMusicOn(false);
    }
  }, []);

  const stopMusic = useCallback(() => {
    musicRef.current?.stop();
    musicRef.current = null;
    setMusicOn(false);
  }, []);

  const toggleMusic = useCallback(() => {
    if (musicRef.current && musicOn) {
      stopMusic();
      return;
    }
    void startMusic();
  }, [musicOn, startMusic, stopMusic]);

  const begin = () => {
    void startMusic();
    completingRef.current = false;
    setStepIndex(0);
    setResults([]);
    setVisualState({ stepId: CHICKEN_RICE.steps[0].id });
    setFeedback(null);
    setScreen('cook');
  };

  const patchVisual = useCallback((patch: VisualState) => {
    setVisualState((prev) => ({ ...prev, ...patch }));
  }, []);

  const finishStep = useCallback((rawScore: number) => {
    if (completingRef.current) return;
    completingRef.current = true;
    const score = clamp(rawScore, 0.35, 1);
    const result = {
      id: step.id,
      title: step.title,
      score,
      tier: tierFromScore(score),
    };
    setFeedback(result);
    setResults((prev) => [...prev, result]);

    window.setTimeout(() => {
      completingRef.current = false;
      setFeedback(null);
      if (stepIndex + 1 < CHICKEN_RICE.steps.length) {
        const next = CHICKEN_RICE.steps[stepIndex + 1];
        setStepIndex((value) => value + 1);
        setVisualState({ stepId: next.id });
      } else {
        setScreen('result');
      }
    }, 620);
  }, [step, stepIndex]);

  useEffect(() => {
    if (screen !== 'result') return;
    setBest((prev) => {
      const next = Math.max(prev, stars);
      localStorage.setItem(BEST_KEY, String(next));
      return next;
    });
  }, [screen, stars]);

  useEffect(() => {
    return () => {
      musicRef.current?.stop();
    };
  }, []);

  return (
    <main className="app-shell">
      {screen === 'menu' && <MenuScreen best={best} onBegin={begin} />}
      {screen === 'cook' && (
        <CookScreen
          step={step}
          stepIndex={stepIndex}
          totalSteps={CHICKEN_RICE.steps.length}
          visualState={visualState}
          feedback={feedback}
          musicOn={musicOn}
          onToggleMusic={toggleMusic}
          onVisual={patchVisual}
          onFinish={finishStep}
          onExit={() => setScreen('menu')}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          results={results}
          stars={stars}
          onReplay={begin}
          onMenu={() => setScreen('menu')}
        />
      )}
    </main>
  );
}

function MenuScreen({ best, onBegin }: { best: number; onBegin: () => void }) {
  return (
    <section className="screen menu-screen">
      <VoxelCanvas mode="menu" />
      <div className="menu-shade" />
      <header className="menu-card">
        <p className="eyebrow">Singapore cooking game</p>
        <h1>Hawker Mama</h1>
        <p>{CHICKEN_RICE.tagline}</p>
        <div className="best-line" aria-label={`best score ${best} stars`}>
          <span>Best</span>
          <strong>{renderStars(best)}</strong>
        </div>
        <button className="primary-button" data-testid="start-chicken-rice" onClick={onBegin}>
          Cook Chicken Rice
        </button>
      </header>
    </section>
  );
}

function CookScreen({
  step,
  stepIndex,
  totalSteps,
  visualState,
  feedback,
  musicOn,
  onToggleMusic,
  onVisual,
  onFinish,
  onExit,
}: {
  step: StepDefinition;
  stepIndex: number;
  totalSteps: number;
  visualState: VisualState;
  feedback: StepResult | null;
  musicOn: boolean;
  onToggleMusic: () => void;
  onVisual: (patch: VisualState) => void;
  onFinish: (score: number) => void;
  onExit: () => void;
}) {
  return (
    <section className="screen cook-screen">
      <VoxelCanvas mode="cook" stepId={step.id} visualState={visualState} />
      <div className="top-hud">
        <button className="exit-button" onClick={onExit}>Exit</button>
        <button className="music-button" aria-label="Toggle music" aria-pressed={musicOn} onClick={onToggleMusic}>
          {musicOn ? 'On' : 'Off'}
        </button>
        <div className="step-pips" aria-label={`step ${stepIndex + 1} of ${totalSteps}`}>
          {CHICKEN_RICE.steps.map((item, i) => (
            <span key={item.id} className={i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}>
              {item.shortTitle}
            </span>
          ))}
        </div>
        <strong>{stepIndex + 1}/{totalSteps}</strong>
      </div>

      <section key={step.id} className="play-panel">
        <div className="step-copy">
          <p className="eyebrow">{CHICKEN_RICE.name}</p>
          <h2>{step.title}</h2>
          <p>{step.instruction}</p>
        </div>
        <MiniGame key={step.id} step={step} onVisual={onVisual} onFinish={onFinish} />
      </section>

      {feedback && (
        <div className={`feedback ${feedback.tier}`} role="status">
          <strong>{feedback.tier}</strong>
          <span>{Math.round(feedback.score * 100)}%</span>
        </div>
      )}
    </section>
  );
}

function MiniGame({
  step,
  onVisual,
  onFinish,
}: {
  step: StepDefinition;
  onVisual: (patch: VisualState) => void;
  onFinish: (score: number) => void;
}) {
  if (step.kind === 'prep') return <PrepGame onVisual={onVisual} onFinish={onFinish} />;
  if (step.kind === 'stir') return <StirGame onVisual={onVisual} onFinish={onFinish} />;
  if (step.kind === 'simmer') return <SimmerGame onVisual={onVisual} onFinish={onFinish} />;
  if (step.kind === 'mash') return <SauceGame onVisual={onVisual} onFinish={onFinish} />;
  return <PlateGame onVisual={onVisual} onFinish={onFinish} />;
}

function PrepGame({ onVisual, onFinish }: { onVisual: (patch: VisualState) => void; onFinish: (score: number) => void }) {
  const ingredients = ['Garlic', 'Ginger', 'Pandan', 'Shallot'];
  const firstPhase = useRef(Math.random());
  const firstBlade = useRef(trianglePhase(firstPhase.current));
  const [active, setActive] = useState(0);
  const [cuts, setCuts] = useState(0);
  const [blade, setBlade] = useState(firstBlade.current);
  const [cutting, setCutting] = useState(false);
  const [chopCue, setChopCue] = useState('Line up the blade');
  const [chopQuality, setChopQuality] = useState<'idle' | 'perfect' | 'good' | 'off'>('idle');
  const bladeRef = useRef(firstBlade.current);
  const scoresRef = useRef<number[]>([]);
  const startedAt = useRef(performance.now());
  const roundStarted = useRef(performance.now());
  const phaseOffset = useRef(firstPhase.current);

  useEffect(() => {
    onVisual({ prepCuts: cuts, prepActive: active, prepBlade: bladeRef.current });
  }, [active, cuts, onVisual]);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      if (!cutting && now - last > 33) {
        last = now;
        const phase = (((now - roundStarted.current) / 1800) + phaseOffset.current) % 1;
        const next = trianglePhase(phase);
        bladeRef.current = next;
        setBlade(next);
        onVisual({ prepBlade: next });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cutting, onVisual]);

  const chop = () => {
    if (active >= ingredients.length || cutting) return;
    const accuracy = 1 - Math.min(1, Math.abs(bladeRef.current - 0.5) / 0.5);
    const quality = clamp(0.72 + accuracy * 0.28, 0.72, 1);
    const label = accuracy > 0.82 ? 'Perfect chop' : accuracy > 0.48 ? 'Good chop' : bladeRef.current < 0.5 ? 'Too early, still chopped' : 'Too late, still chopped';
    setChopCue(label);
    setChopQuality(accuracy > 0.82 ? 'perfect' : accuracy > 0.48 ? 'good' : 'off');
    scoresRef.current.push(quality);
    const next = active + 1;
    setCutting(true);
    setCuts(next);
    onVisual({ prepCuts: next, prepActive: active, prepBlade: bladeRef.current, prepChop: performance.now(), pulse: performance.now() });

    window.setTimeout(() => {
      if (next >= ingredients.length) {
        const elapsed = performance.now() - startedAt.current;
        const speed = elapsed < 9000 ? 1 : elapsed < 12500 ? 0.92 : 0.82;
        onFinish(avg(scoresRef.current) * speed);
        return;
      }
      setActive(next);
      setCutting(false);
      roundStarted.current = performance.now();
      phaseOffset.current = Math.random();
      const nextBlade = trianglePhase(phaseOffset.current);
      bladeRef.current = nextBlade;
      setBlade(nextBlade);
      setChopCue('Line up the blade');
      setChopQuality('idle');
      onVisual({ prepCuts: next, prepActive: next, prepBlade: nextBlade });
    }, 520);
  };

  return (
    <div className="mini prep-mini">
      <div className="status-row">
        <span>{Math.min(active + 1, ingredients.length)}/{ingredients.length}</span>
        <strong>{ingredients[active] ?? 'Ready'}</strong>
      </div>
      <div
        className={`chop-timing ${chopQuality}`}
        data-testid="chop-timing"
        role="button"
        tabIndex={0}
        onClick={chop}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') chop();
        }}
      >
        <i className="target-zone" />
        <b style={{ left: `calc(${blade * 100}% - 8px)` }} />
        <span>{chopCue}</span>
      </div>
      <button className="chop-button" data-testid="chop-button" onClick={chop} disabled={cutting}>
        {cutting ? 'Chopped!' : `Chop ${ingredients[active] ?? ''}`}
      </button>
      <ProgressBar value={cuts / ingredients.length} />
    </div>
  );
}

function StirGame({ onVisual, onFinish }: { onVisual: (patch: VisualState) => void; onFinish: (score: number) => void }) {
  const startedAt = useRef(performance.now());
  const scoresRef = useRef<number[]>([]);
  const tossesRef = useRef(0);
  const targetTosses = 4;
  const firstTarget = useRef(randomTossTarget());
  const [progress, setProgress] = useState(0);
  const [tossing, setTossing] = useState(false);
  const [tosses, setTosses] = useState(0);
  const [cue, setCue] = useState('Swipe upward');
  const [dragPower, setDragPower] = useState(0);
  const [targetPower, setTargetPower] = useState(firstTarget.current);
  const targetPowerRef = useRef(firstTarget.current);
  const dragRef = useRef<{ x: number; y: number; time: number; pointerId: number } | null>(null);
  const done = useRef(false);

  const refreshTarget = () => {
    const next = randomTossTarget();
    targetPowerRef.current = next;
    setTargetPower(next);
  };

  const resetDrag = () => {
    dragRef.current = null;
    setDragPower(0);
    onVisual({ stirPull: 0 });
  };

  const completeToss = (releasePower: number, straight: number) => {
    const closeness = 1 - Math.min(1, Math.abs(releasePower - targetPowerRef.current) / 0.42);
    const quality = clamp((0.54 + closeness * 0.46) * (0.92 + straight * 0.08), 0.54, 1);
    scoresRef.current.push(quality);
    tossesRef.current += 1;
    setTosses(tossesRef.current);
    setCue(closeness > 0.84 ? 'Perfect toss' : closeness > 0.58 ? 'Good toss' : releasePower > targetPowerRef.current ? 'Too high' : 'Too low');
    const nextProgress = clamp(tossesRef.current / targetTosses, 0, 1);
    setProgress(nextProgress);
    setTossing(true);
    setDragPower(0);
    onVisual({
      stirProgress: nextProgress,
      stirTurns: tossesRef.current,
      stirToss: performance.now(),
      stirPull: 0,
      pulse: performance.now(),
    });

    window.setTimeout(() => {
      if (nextProgress >= 1) {
        done.current = true;
        const elapsed = performance.now() - startedAt.current;
        onFinish(avg(scoresRef.current) * (elapsed < 9000 ? 1 : elapsed < 12500 ? 0.92 : 0.82));
        return;
      }
      setTossing(false);
      refreshTarget();
      setCue('Swipe upward');
      onVisual({ stirProgress: nextProgress, stirPull: 0 });
    }, 430);
  };

  const startSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (done.current || tossing) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, time: performance.now(), pointerId: event.pointerId };
    setCue('Pull up');
    setDragPower(0);
    onVisual({ stirPull: 0 });
  };

  const moveSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || done.current || tossing) return;
    event.preventDefault();
    const dy = drag.y - event.clientY;
    const dx = Math.abs(event.clientX - drag.x);
    const power = clamp(dy / 190, 0, 1);
    const straight = clamp(1 - dx / 150, 0, 1);
    const nextPower = power * (0.55 + straight * 0.45);
    const close = Math.abs(nextPower - targetPowerRef.current);
    setDragPower(nextPower);
    setCue(close < 0.08 ? 'Release now!' : nextPower < targetPowerRef.current ? 'Pull higher' : 'Too high');
    onVisual({ stirPull: nextPower });
  };

  const endSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || done.current || tossing) return;
    event.preventDefault();
    try {
      event.currentTarget.releasePointerCapture(drag.pointerId);
    } catch {
      // Pointer capture can already be gone after touch cancellation.
    }
    const dy = drag.y - event.clientY;
    const dx = Math.abs(event.clientX - drag.x);
    dragRef.current = null;
    const releasePower = clamp((dy - 12) / 190, 0, 1);
    const straight = clamp(1 - dx / Math.max(80, dy * 0.8), 0, 1);
    if (releasePower < 0.12) {
      setCue('Swipe upward');
      setDragPower(0);
      onVisual({ stirPull: 0 });
      return;
    }
    completeToss(releasePower, straight);
  };

  return (
    <div className="mini">
      <div className="status-row">
        <span>{tossing ? cue : 'Toast the rice'}</span>
        <strong>{Math.min(tosses, targetTosses)}/{targetTosses}</strong>
      </div>
      <div className="timing-caption">{tossing ? 'The rice jumps and turns in the wok.' : 'Pull up into the gold band, then release.'}</div>
      <div
        className={`gesture-pad swipe-pad ${tossing ? 'is-tossing' : ''}`}
        data-testid="toss-pad"
        onPointerDown={startSwipe}
        onPointerMove={moveSwipe}
        onPointerUp={endSwipe}
        onPointerCancel={resetDrag}
      >
        <em aria-hidden="true" style={{ bottom: `${34 + targetPower * 118}px` }} />
        <i style={{ height: `${34 + dragPower * 118}px` }} />
        <b>UP</b>
        <span>{tossing ? 'Rice tossed!' : cue}</span>
      </div>
      <ProgressBar value={progress} />
    </div>
  );
}

function SimmerGame({ onVisual, onFinish }: { onVisual: (patch: VisualState) => void; onFinish: (score: number) => void }) {
  const railRef = useRef<HTMLDivElement>(null);
  const stirRef = useRef<HTMLDivElement>(null);
  const [heat, setHeat] = useState(0.22);
  const [hold, setHold] = useState(0);
  const [turns, setTurns] = useState(0);
  const [stirAngle, setStirAngle] = useState(-0.6);
  const [stirPower, setStirPower] = useState(0);
  const [cue, setCue] = useState('Warm the pot');
  const done = useRef(false);
  const startedAt = useRef(performance.now());
  const heatRef = useRef(0.22);
  const turnsRef = useRef(0);
  const stirAngleRef = useRef(-0.6);
  const stirPowerRef = useRef(0);
  const bubbleStartedAt = useRef(performance.now());
  const stirDrag = useRef<{ lastAngle: number; lastX: number; lastY: number; accumulated: number; pointerId: number } | null>(null);
  const scoresRef = useRef<number[]>([]);

  const inZone = isSimmerHeat(heat);
  const temperature = Math.round(44 + heat * 42);
  const targetTurns = 3;
  const progress = clamp((hold / 1800) * 0.48 + (turns / targetTurns) * 0.52, 0, 1);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const liveInZone = isSimmerHeat(heatRef.current);
      setHold((value) => {
        const next = liveInZone ? Math.min(1800, value + dt) : Math.max(0, value - dt * 0.9);
        return next;
      });
      const nextBubble = ((now - bubbleStartedAt.current) % 1900) / 1900;
      onVisual({
        simmerHeat: heatRef.current,
        simmerHits: turnsRef.current,
        simmerReady: liveInZone,
        simmerBubble: nextBubble,
        simmerStir: stirPowerRef.current,
        simmerStirAngle: stirAngleRef.current,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onVisual]);

  useEffect(() => {
    if (!done.current && hold >= 1800 && turns >= targetTurns) {
      done.current = true;
      const elapsed = performance.now() - startedAt.current;
      const timingScore = avg(scoresRef.current);
      onFinish(timingScore * (elapsed < 8500 ? 1 : elapsed < 12500 ? 0.9 : 0.78));
    }
  }, [turns, hold, onFinish]);

  const updateHeat = (clientY: number) => {
    const rect = railRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = 1 - clamp((clientY - rect.top) / rect.height, 0, 1);
    heatRef.current = next;
    setHeat(next);
    setCue(isSimmerHeat(next) ? 'Now stir circles' : next < SIMMER_MIN ? 'Drag heat up' : 'Lower heat');
    onVisual({ simmerHeat: next, simmerReady: isSimmerHeat(next) });
  };

  const angleFromPoint = (clientX: number, clientY: number) => {
    const rect = stirRef.current?.getBoundingClientRect();
    if (!rect) return stirAngle;
    return Math.atan2(clientY - (rect.top + rect.height * 0.42), clientX - (rect.left + rect.width * 0.5));
  };

  const finishStirTurn = () => {
    if (!isSimmerHeat(heatRef.current)) {
      setCue('Set heat in green zone');
      onVisual({ pulse: performance.now() });
      return;
    }
    const next = Math.min(targetTurns, turnsRef.current + 1);
    turnsRef.current = next;
    setTurns(next);
    scoresRef.current.push(clamp(0.72 + heatRef.current * 0.32, 0.72, 1));
    setCue(next >= targetTurns ? 'Chicken poached' : 'Good stir');
    onVisual({ simmerHits: next, simmerStir: 1, simmerStirAngle: stirAngleRef.current, pulse: performance.now() });
  };

  const startStir = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (done.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const angle = angleFromPoint(event.clientX, event.clientY);
    stirDrag.current = { lastAngle: angle, lastX: event.clientX, lastY: event.clientY, accumulated: 0, pointerId: event.pointerId };
    stirAngleRef.current = angle;
    stirPowerRef.current = 0.12;
    setStirAngle(angle);
    setStirPower(0.12);
    setCue(isSimmerHeat(heatRef.current) ? 'Stir circles here' : 'Set heat in green zone');
    onVisual({ simmerStir: 0.12, simmerStirAngle: angle });
  };

  const moveStir = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = stirDrag.current;
    if (!drag || done.current) return;
    event.preventDefault();
    const angle = angleFromPoint(event.clientX, event.clientY);
    let delta = angle - drag.lastAngle;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    const travel = Math.hypot(event.clientX - drag.lastX, event.clientY - drag.lastY);
    drag.lastAngle = angle;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.accumulated += Math.abs(delta) + clamp(travel / 170, 0, 0.16);
    const turnProgress = clamp(drag.accumulated / STIR_TURN_TARGET, 0, 1);
    stirAngleRef.current = angle;
    stirPowerRef.current = turnProgress;
    setStirAngle(angle);
    setStirPower(turnProgress);
    setCue(isSimmerHeat(heatRef.current) ? (turnProgress > 0.55 ? 'Keep circling' : 'Stir circles here') : 'Set heat in green zone');
    onVisual({ simmerStir: turnProgress, simmerStirAngle: angle });
    while (drag.accumulated >= STIR_TURN_TARGET) {
      drag.accumulated -= STIR_TURN_TARGET;
      finishStirTurn();
    }
  };

  const endStir = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = stirDrag.current;
    if (!drag) return;
    event.preventDefault();
    try {
      event.currentTarget.releasePointerCapture(drag.pointerId);
    } catch {
      // Pointer capture can already be gone after touch cancellation.
    }
    stirDrag.current = null;
    stirPowerRef.current = 0;
    setStirPower(0);
    onVisual({ simmerStir: 0, simmerStirAngle: stirAngleRef.current });
  };

  return (
    <div className="mini poach-mini">
      <div className="status-row">
        <span>{cue}</span>
        <strong>{temperature}C</strong>
      </div>
      <div className="poach-control">
        <div
          ref={railRef}
          className="heat-rail"
          data-testid="simmer-slider"
          onPointerDown={(event) => {
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            updateHeat(event.clientY);
          }}
          onPointerMove={(event) => {
            event.preventDefault();
            if (event.buttons || event.pointerType === 'touch') updateHeat(event.clientY);
          }}
        >
          <i className="simmer-zone">target</i>
          <b style={{ bottom: `calc(${heat * 100}% - 18px)` }}>drag</b>
        </div>
        <div
          ref={stirRef}
          className={`stock-stir-pad ${inZone ? 'ready' : 'waiting'}`}
          data-testid="stir-pot"
          role="button"
          tabIndex={0}
          onPointerDown={startStir}
          onPointerMove={moveStir}
          onPointerUp={endStir}
          onPointerCancel={endStir}
        >
          <i aria-hidden="true" className="stock-surface" />
          <b aria-hidden="true" className="stir-path" />
          <em
            aria-hidden="true"
            className="stir-spoon"
            style={{ transform: `translate(-50%, -50%) rotate(${stirAngle}rad) translateX(52px) rotate(18deg)` }}
          />
          <span>{inZone ? 'Circle here to stir' : 'Set heat in green zone'}</span>
          <strong>{turns}/{targetTurns}</strong>
        </div>
      </div>
      <ProgressBar value={progress} />
    </div>
  );
}

function SauceGame({ onVisual, onFinish }: { onVisual: (patch: VisualState) => void; onFinish: (score: number) => void }) {
  const items = [
    ['chili', 'Chili'],
    ['ginger', 'Ginger'],
    ['garlic', 'Garlic'],
    ['lime', 'Lime'],
  ] as const;
  const [added, setAdded] = useState<string[]>([]);
  const [mashes, setMashes] = useState(0);
  const [press, setPress] = useState(0);
  const [pounding, setPounding] = useState(false);
  const [cue, setCue] = useState('Add ingredients');
  const startedAt = useRef(performance.now());
  const done = useRef(false);
  const mashesRef = useRef(0);
  const mashDrag = useRef<{ startY: number; pointerId: number; press: number } | null>(null);

  const add = (id: string) => {
    setAdded((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      setCue(next.length >= items.length ? 'Pull pestle down' : 'Add ingredients');
      onVisual({ sauceItems: next, pulse: performance.now() });
      return next;
    });
  };

  const completeMash = () => {
    if (added.length < items.length || done.current) return;
    const next = mashesRef.current + 1;
    mashesRef.current = next;
    setMashes(next);
    setPounding(true);
    setCue(next >= 4 ? 'Sauce ready' : 'Pull pestle down');
    onVisual({ mashCount: next, mashPress: 0, mashPound: performance.now(), sauceItems: added, pulse: performance.now() });
    window.setTimeout(() => setPounding(false), 220);
    if (next >= 4) {
      done.current = true;
      const elapsed = performance.now() - startedAt.current;
      window.setTimeout(() => onFinish(elapsed < 9000 ? 1 : elapsed < 13000 ? 0.86 : 0.72), 260);
    }
  };

  const startMash = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (added.length < items.length || done.current) {
      setCue('Add ingredients first');
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    mashDrag.current = { startY: event.clientY, pointerId: event.pointerId, press: 0 };
    setPress(0.08);
    onVisual({ mashPress: 0.08, sauceItems: added });
  };

  const moveMash = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = mashDrag.current;
    if (!drag || done.current) return;
    event.preventDefault();
    const nextPress = clamp((event.clientY - drag.startY) / 86, 0, 1);
    drag.press = nextPress;
    setPress(nextPress);
    setCue(nextPress >= MASH_READY_PRESS ? 'Release to pound' : 'Pull down lower');
    onVisual({ mashPress: nextPress, sauceItems: added });
  };

  const endMash = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = mashDrag.current;
    if (!drag) return;
    event.preventDefault();
    try {
      event.currentTarget.releasePointerCapture(drag.pointerId);
    } catch {
      // Pointer capture can already be gone after touch cancellation.
    }
    mashDrag.current = null;
    if (drag.press >= MASH_READY_PRESS) completeMash();
    else setCue('Pull lower');
    setPress(0);
    onVisual({ mashPress: 0, sauceItems: added });
  };

  return (
    <div className="mini sauce-mini">
      <div className="status-row">
        <span>{cue}</span>
        <strong>{added.length}/4</strong>
      </div>
      <div className="sauce-station">
        <div className="sauce-bowl">
          <i aria-hidden="true" />
          <b
            style={{
              width: `${Math.max(0, (added.length / items.length) * 54 + (mashes / 4) * 28)}%`,
              opacity: added.length ? 1 : 0,
            }}
          />
          <div className="bowl-chunks" aria-hidden="true">
            {added.map((id) => (
              <em key={id} className={`food-chip ${id}`} />
            ))}
          </div>
          <span>{added.length < items.length ? 'Mortar is waiting' : 'Ingredients in mortar'}</span>
        </div>
      </div>
      <div className="sauce-tray">
        {items.map(([id, label]) => (
          <button
            key={id}
            className={`sauce-token ${id} ${added.includes(id) ? 'done' : ''}`}
            data-testid={`sauce-token-${id}`}
            onClick={() => add(id)}
          >
            <i aria-hidden="true" className={`food-icon ${id}`} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div
        className={`mortar-pad sauce-pound ${added.length >= items.length ? 'ready' : ''} ${pounding ? 'is-pounding' : ''}`}
        data-testid="mortar-pad"
        role="button"
        tabIndex={0}
        onPointerDown={startMash}
        onPointerMove={moveMash}
        onPointerUp={endMash}
        onPointerCancel={endMash}
      >
        <i aria-hidden="true" className="pestle-track">
          <em />
          <b style={{ transform: `translate(-50%, ${pounding ? 74 : press * 72}px) rotate(-10deg)` }} />
        </i>
        <span>{added.length < items.length ? 'Tap ingredients first' : press >= MASH_READY_PRESS ? 'Release to pound' : 'Pull pestle down'}</span>
        <strong>{mashes}/4</strong>
      </div>
      <ProgressBar value={(added.length / items.length) * 0.55 + (mashes / 4) * 0.45} />
    </div>
  );
}

function PlateGame({ onVisual, onFinish }: { onVisual: (patch: VisualState) => void; onFinish: (score: number) => void }) {
  const items = [
    ['rice', 'Rice'],
    ['chicken', 'Chicken'],
    ['cucumber', 'Cucumber'],
    ['chili', 'Chili'],
  ] as const;
  const [placed, setPlaced] = useState<string[]>([]);
  const [dragGhost, setDragGhost] = useState<{ id: string; x: number; y: number } | null>(null);
  const startedAt = useRef(performance.now());
  const done = useRef(false);
  const plateRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; pointerId: number; startX: number; startY: number } | null>(null);
  const ignoreClick = useRef(false);

  const place = (id: string) => {
    if (done.current) return;
    setPlaced((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      onVisual({ plateItems: next, pulse: performance.now() });
      if (next.length >= items.length) {
        done.current = true;
        const elapsed = performance.now() - startedAt.current;
        window.setTimeout(() => onFinish(elapsed < 8500 ? 1 : elapsed < 12000 ? 0.86 : 0.74), 360);
      }
      return next;
    });
  };

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    if (done.current || placed.includes(id)) return;
    dragRef.current = { id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
    setDragGhost({ id, x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    event.preventDefault();
    setDragGhost({ id: drag.id, x: event.clientX, y: event.clientY });
  };

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    const plateBox = plateRef.current?.getBoundingClientRect();
    const overPlate = Boolean(
      plateBox &&
        event.clientX >= plateBox.left &&
        event.clientX <= plateBox.right &&
        event.clientY >= plateBox.top &&
        event.clientY <= plateBox.bottom,
    );
    try {
      event.currentTarget.releasePointerCapture(drag.pointerId);
    } catch {
      // Capture can already be released on touch cancellation.
    }
    dragRef.current = null;
    setDragGhost(null);
    if (distance > 10) {
      ignoreClick.current = true;
      if (overPlate) place(drag.id);
    }
  };

  const handleTokenClick = (id: string) => {
    if (ignoreClick.current) {
      ignoreClick.current = false;
      return;
    }
    place(id);
  };

  return (
    <div className="mini plate-mini">
      <div className={`plate-drop plate-stage ${dragGhost ? 'is-catching' : ''}`} data-testid="plate-drop" ref={plateRef}>
        <div className="plate-model" aria-hidden="true">
          <i className="plated-rim" />
          <i className={`plated-piece rice ${placed.includes('rice') ? 'in' : ''}`} />
          <i className={`plated-piece chicken ${placed.includes('chicken') ? 'in' : ''}`} />
          <i className={`plated-piece cucumber ${placed.includes('cucumber') ? 'in' : ''}`} />
          <i className={`plated-piece chili ${placed.includes('chili') ? 'in' : ''}`} />
        </div>
        <strong>{placed.length >= items.length ? 'Ready to serve' : `${placed.length}/4 on plate`}</strong>
      </div>
      <div className="token-grid plate-tray">
        {items.map(([id, label]) => (
          <button
            key={id}
            className={`plate-token ${id} ${placed.includes(id) ? 'done' : ''} ${dragGhost?.id === id ? 'dragging' : ''}`}
            data-testid={`plate-token-${id}`}
            onPointerDown={(event) => startDrag(event, id)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClick={() => handleTokenClick(id)}
            aria-pressed={placed.includes(id)}
          >
            <i aria-hidden="true" className={`plate-icon ${id}`} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      {dragGhost && (
        <div
          className={`plate-ghost ${dragGhost.id}`}
          aria-hidden="true"
          style={{ transform: `translate(${dragGhost.x - 32}px, ${dragGhost.y - 32}px)` }}
        >
          <i className={`plate-icon ${dragGhost.id}`} />
        </div>
      )}
      <ProgressBar value={placed.length / items.length} />
    </div>
  );
}

function ResultScreen({
  results,
  stars,
  onReplay,
  onMenu,
}: {
  results: StepResult[];
  stars: 1 | 2 | 3;
  onReplay: () => void;
  onMenu: () => void;
}) {
  return (
    <section className="screen result-screen">
      <VoxelCanvas mode="result" />
      <div className="result-card">
        <p className="eyebrow">Dish complete</p>
        <h1>{CHICKEN_RICE.name}</h1>
        <div className="result-stars" data-testid="result-stars">{renderStars(stars)}</div>
        <div className="result-list">
          {results.map((item) => (
            <div key={item.id}>
              <span>{item.title}</span>
              <strong>{item.tier}</strong>
            </div>
          ))}
        </div>
        <section className="learning-card">
          <h2>What you learned</h2>
          <p>{CHICKEN_RICE.learning}</p>
        </section>
        <div className="result-actions">
          <button className="primary-button" onClick={onReplay}>Cook again</button>
          <button className="secondary-button" onClick={onMenu}>Menu</button>
        </div>
      </div>
    </section>
  );
}

function ProgressBar({ value }: { value: number }) {
  return <div className="progress-bar"><i style={{ width: `${clamp(value, 0, 1) * 100}%` }} /></div>;
}

function loadBest() {
  const value = Number(localStorage.getItem(BEST_KEY) ?? 0);
  return Number.isFinite(value) ? clamp(Math.round(value), 0, 3) : 0;
}

function avg(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0.7;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isSimmerHeat(value: number) {
  return value >= SIMMER_MIN && value <= SIMMER_MAX;
}

function trianglePhase(phase: number) {
  return phase < 0.5 ? phase * 2 : 2 - phase * 2;
}

function randomTossTarget() {
  return 0.24 + Math.random() * 0.6;
}

function renderStars(value: number) {
  return FILLED_STAR.repeat(value) + EMPTY_STAR.repeat(3 - value);
}

interface MusicLoop {
  start: () => Promise<void>;
  stop: () => void;
}

function createMusicLoop(): MusicLoop {
  const track = new Audio();
  const base = import.meta.env.BASE_URL;
  const opus = `${base}audio/happy-clappy-loop.opus`;
  const mp3 = `${base}audio/happy-clappy-loop.mp3`;
  track.src = track.canPlayType('audio/ogg; codecs="opus"') ? opus : mp3;
  track.loop = true;
  track.preload = 'auto';
  track.volume = 0.86;
  track.load();
  let fallback: MusicLoop | null = null;

  return {
    start: async () => {
      try {
        track.volume = 0.86;
        await track.play();
      } catch {
        if (!fallback) fallback = createSynthMusicLoop();
        await fallback.start();
      }
    },
    stop: () => {
      track.pause();
      try {
        track.currentTime = 0;
      } catch {
        // Some mobile browsers disallow seeking before media metadata is ready.
      }
      fallback?.stop();
      fallback = null;
    },
  };
}

function createSynthMusicLoop(): MusicLoop {
  const AudioCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) {
    return { start: async () => undefined, stop: () => undefined };
  }

  const ctx = new AudioCtor({ latencyHint: 'playback' });
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);
  const masterVolume = 0.34;

  const melody = [392, 440, 523.25, 587.33, 523.25, 440, 392, 329.63];
  const bass = [196, 246.94, 220, 174.61];
  let step = 0;
  let nextTime = ctx.currentTime + 0.06;

  const pluck = (freq: number, time: number, duration: number, volume: number, type: OscillatorType) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(time);
    osc.stop(time + duration + 0.04);
  };

  const schedule = () => {
    while (nextTime < ctx.currentTime + 0.55) {
      const beat = step % 16;
      if (beat % 2 === 0) {
        pluck(melody[(step / 2) % melody.length], nextTime, 0.24, 0.06, 'triangle');
      }
      if (beat % 8 === 0) {
        pluck(bass[(step / 8) % bass.length], nextTime, 0.46, 0.044, 'sine');
      }
      if (beat === 6 || beat === 14) {
        pluck(880, nextTime + 0.015, 0.08, 0.024, 'sine');
      }
      nextTime += 0.18;
      step += 1;
    }
  };

  const timer = window.setInterval(schedule, 120);

  return {
    start: async () => {
      if (ctx.state === 'suspended') await ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(masterVolume, ctx.currentTime, 0.08);
      schedule();
    },
    stop: () => {
      window.clearInterval(timer);
      master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.04);
      window.setTimeout(() => void ctx.close(), 120);
    },
  };
}
