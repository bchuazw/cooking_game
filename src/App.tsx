import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { CHICKEN_RICE, starsFromAverage, tierFromScore, type StepDefinition, type Tier } from './gameData';
import { VoxelCanvas, type VisualState } from './VoxelCanvas';

interface StepResult {
  id: string;
  title: string;
  score: number;
  tier: Tier;
  note: string;
}

type Screen = 'menu' | 'cook' | 'result';

const BEST_KEY = 'hawker-mama:fresh-redesign:v1';
const FILLED_STAR = '\u2605';
const EMPTY_STAR = '\u2606';
const SIMMER_MIN = 0.48;
const SIMMER_MAX = 0.76;
const POACH_HOLD_TARGET = 2600;
const SAUCE_MASH_TARGET = 8;

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
      note: feedbackNote(step.id, score),
    };
    playSfx(score >= 0.86 ? 'gold' : 'success');
    haptic(score >= 0.86 ? 28 : 18);
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
          <em>{feedback.note}</em>
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
  const ingredientIds = ['garlic', 'ginger', 'pandan', 'shallot'];
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
  const [showHint, dismissHint] = useCoachHint(`${active}:${cutting}`, 1300);

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
    dismissHint();
    playSfx('chop');
    haptic(12);
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
        <i aria-hidden="true" className={`prep-board-object ${ingredientIds[active] ?? 'done'} ${cutting ? 'is-cut' : ''}`} />
        <b style={{ left: `calc(${blade * 100}% - 8px)` }} />
        <span>{chopCue}</span>
        <CoachHand visible={showHint && !cutting} variant="tap" />
      </div>
      <div className="prep-ingredient-strip" aria-hidden="true">
        {ingredients.map((name, index) => (
          <i key={name} className={`prep-ingredient-dot ${ingredientIds[index]} ${index < cuts ? 'done' : index === active ? 'active' : ''}`} />
        ))}
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
  const strokesRef = useRef(0);
  const targetStrokes = 4;
  const [progress, setProgress] = useState(0);
  const [strokes, setStrokes] = useState(0);
  const [cue, setCue] = useState('Drag spoon right');
  const [dragging, setDragging] = useState(false);
  const [targetSide, setTargetSide] = useState<'left' | 'right'>('right');
  const [spoon, setSpoon] = useState({ x: 0.38, y: 0.58 });
  const dragRef = useRef<{ lastX: number; lastY: number; travel: number; pointerId: number } | null>(null);
  const targetSideRef = useRef<'left' | 'right'>('right');
  const done = useRef(false);
  const [showHint, dismissHint] = useCoachHint(`${strokes}:${targetSide}:${dragging}`, 1300);

  const resetDrag = (event?: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag && event) {
      try {
        event.currentTarget.releasePointerCapture(drag.pointerId);
      } catch {
        // Pointer capture can already be gone after touch cancellation.
      }
    }
    dragRef.current = null;
    setDragging(false);
    onVisual({ stirPull: 0.5 });
  };

  const completeStroke = (normY: number) => {
    if (done.current) return;
    const yScore = 1 - Math.min(1, Math.abs(normY - 0.58) / 0.34);
    const quality = clamp(0.68 + yScore * 0.32, 0.68, 1);
    scoresRef.current.push(quality);
    playSfx('stir');
    haptic(12);
    const next = strokesRef.current + 1;
    strokesRef.current = next;
    setStrokes(next);
    const nextProgress = clamp(next / targetStrokes, 0, 1);
    setProgress(nextProgress);
    const nextSide = targetSideRef.current === 'right' ? 'left' : 'right';
    targetSideRef.current = nextSide;
    setTargetSide(nextSide);
    setCue(next >= targetStrokes ? 'Rice toasted' : `Good pass. Drag ${nextSide}`);
    onVisual({
      stirProgress: nextProgress,
      stirTurns: next,
      stirMarker: nextSide === 'right' ? 1 : 0,
      stirPull: spoon.x,
      pulse: performance.now(),
    });
    if (next >= targetStrokes) {
      done.current = true;
      resetDrag();
      const elapsed = performance.now() - startedAt.current;
      window.setTimeout(() => onFinish(avg(scoresRef.current) * (elapsed < 9000 ? 1 : elapsed < 12500 ? 0.92 : 0.82)), 360);
    }
  };

  const pointFromEvent = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
    };
  };

  const startStir = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (done.current) return;
    event.preventDefault();
    dismissHint();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    dragRef.current = { lastX: event.clientX, lastY: event.clientY, travel: 0, pointerId: event.pointerId };
    setDragging(true);
    setSpoon(point);
    setCue(`Drag spoon ${targetSideRef.current}`);
    onVisual({ stirPull: point.x, stirMarker: targetSideRef.current === 'right' ? 1 : 0 });
  };

  const moveStir = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || done.current) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    const travel = Math.hypot(event.clientX - drag.lastX, event.clientY - drag.lastY);
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.travel += travel;
    setSpoon(point);
    const inWok = point.y >= 0.24 && point.y <= 0.88;
    const hitTarget = targetSideRef.current === 'right' ? point.x > 0.77 : point.x < 0.23;
    setCue(inWok ? `Drag spoon ${targetSideRef.current}` : 'Keep spoon in wok');
    onVisual({ stirPull: point.x, stirMarker: targetSideRef.current === 'right' ? 1 : 0 });
    if (inWok && hitTarget && drag.travel > 70) {
      drag.travel = 0;
      completeStroke(point.y);
    }
  };

  const endStir = (event: ReactPointerEvent<HTMLDivElement>) => {
    resetDrag(event);
    if (!done.current && strokesRef.current < targetStrokes) setCue(`Drag spoon ${targetSideRef.current}`);
  };

  return (
    <div className="mini rice-mini">
      <div className="status-row">
        <span>{cue}</span>
        <strong>{Math.min(strokes, targetStrokes)}/{targetStrokes}</strong>
      </div>
      <div className="timing-caption">Drag the spoon left and right through the wok to toast rice with garlic and ginger.</div>
      <div
        className={`gesture-pad rice-stir-pad target-${targetSide} ${dragging ? 'is-dragging' : ''}`}
        data-testid="toss-pad"
        style={{ '--spoon-x': `${spoon.x * 100}%`, '--spoon-y': `${spoon.y * 100}%`, '--toast-progress': progress } as CSSProperties}
        onPointerDown={startStir}
        onPointerMove={moveStir}
        onPointerUp={endStir}
        onPointerCancel={endStir}
      >
        <div className="rice-stir-scene" aria-hidden="true">
          <i className="rice-stir-wok" />
          <i className="rice-stir-grain-cloud" />
          <i className="rice-stir-aromatics" />
          <i className="rice-stir-spoon" />
          <b className="rice-stir-target left">left</b>
          <b className="rice-stir-target right">right</b>
        </div>
        <span>{cue}</span>
        <CoachHand visible={showHint && !dragging && strokes === 0} variant="swipe" />
      </div>
      <ProgressBar value={progress} />
    </div>
  );
}

function SimmerGame({ onVisual, onFinish }: { onVisual: (patch: VisualState) => void; onFinish: (score: number) => void }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [heat, setHeat] = useState(0.22);
  const [hold, setHold] = useState(0);
  const [cue, setCue] = useState('Warm the pot');
  const [draggingHeat, setDraggingHeat] = useState(false);
  const done = useRef(false);
  const startedAt = useRef(performance.now());
  const heatRef = useRef(0.22);
  const holdRef = useRef(0);
  const goodMs = useRef(0);
  const badMs = useRef(0);
  const bubbleStartedAt = useRef(performance.now());
  const inZone = isSimmerHeat(heat);
  const [showHint, dismissHint] = useCoachHint(`${inZone}:${Math.round(hold / 400)}:${draggingHeat}`, 1300);
  const temperature = Math.round(44 + heat * 42);
  const progress = clamp(hold / POACH_HOLD_TARGET, 0, 1);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const liveInZone = isSimmerHeat(heatRef.current);
      setHold((value) => {
        const next = liveInZone ? Math.min(POACH_HOLD_TARGET, value + dt) : Math.max(0, value - dt * 0.7);
        holdRef.current = next;
        if (liveInZone) goodMs.current += dt;
        else badMs.current += dt;
        if (!done.current && next >= POACH_HOLD_TARGET) {
          done.current = true;
          const elapsed = performance.now() - startedAt.current;
          const steadiness = goodMs.current / Math.max(1, goodMs.current + badMs.current);
          const score = clamp(0.72 + steadiness * 0.28, 0.72, 1) * (elapsed < 8500 ? 1 : elapsed < 12000 ? 0.92 : 0.82);
          setCue('Chicken poached');
          window.setTimeout(() => onFinish(score), 360);
        }
        return next;
      });
      const nextBubble = ((now - bubbleStartedAt.current) % 1900) / 1900;
      onVisual({
        simmerHeat: heatRef.current,
        simmerHits: Math.round(clamp(holdRef.current / POACH_HOLD_TARGET, 0, 1) * 3),
        simmerReady: liveInZone,
        simmerBubble: nextBubble,
        simmerStir: clamp(holdRef.current / POACH_HOLD_TARGET, 0, 1),
        simmerStirAngle: 0,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onFinish, onVisual]);

  const updateHeat = (clientY: number) => {
    const rect = railRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = 1 - clamp((clientY - rect.top) / rect.height, 0, 1);
    dismissHint();
    heatRef.current = next;
    setHeat(next);
    setCue(isSimmerHeat(next) ? 'Hold it in green' : next < SIMMER_MIN ? 'Drag heat up' : 'Lower heat');
    onVisual({ simmerHeat: next, simmerReady: isSimmerHeat(next) });
  };

  const startHeat = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDraggingHeat(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updateHeat(event.clientY);
  };

  const moveHeat = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (draggingHeat || event.buttons || event.pointerType === 'touch') {
      updateHeat(event.clientY);
    }
  };

  const endHeat = (event: ReactPointerEvent<HTMLDivElement>) => {
    setDraggingHeat(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture can already be gone after touch cancellation.
    }
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
          onPointerDown={startHeat}
          onPointerMove={moveHeat}
          onPointerUp={endHeat}
          onPointerCancel={endHeat}
        >
          <i className="simmer-zone">target</i>
          <b style={{ bottom: `calc(${heat * 100}% - 18px)` }}>drag</b>
          <CoachHand visible={showHint && !inZone} variant="drag-heat" />
        </div>
        <div
          className={`stock-stir-pad poach-hold-pad ${inZone ? 'ready' : 'waiting'}`}
          style={{ '--poach-progress': progress } as CSSProperties}
          data-testid="stir-pot"
        >
          <i aria-hidden="true" className="stock-surface" />
          <i aria-hidden="true" className={`stock-chicken ${inZone ? 'warm' : ''}`} />
          <b aria-hidden="true" className="poach-thermometer"><i style={{ height: `${heat * 100}%` }} /></b>
          <em aria-hidden="true" className="poach-progress-ring" />
          <span>{inZone ? 'Keep thermometer in green' : 'Set heat in green zone'}</span>
          <strong>{Math.round(progress * 100)}%</strong>
        </div>
      </div>
      <ProgressBar value={progress} />
    </div>
  );
}

function SauceGame({ onVisual, onFinish }: { onVisual: (patch: VisualState) => void; onFinish: (score: number) => void }) {
  const items = [
    ['chili', 'Sliced chili', 'red strips'],
    ['ginger', 'Ginger slices', 'warm bite'],
    ['garlic', 'Garlic cloves', 'aroma'],
    ['lime', 'Lime juice', 'squeeze'],
  ] as const;
  const [added, setAdded] = useState<string[]>([]);
  const [mashes, setMashes] = useState(0);
  const [press, setPress] = useState(0);
  const [pounding, setPounding] = useState(false);
  const [cue, setCue] = useState('Drag ingredients into mortar');
  const [dragging, setDragging] = useState<{ id: string; x: number; y: number } | null>(null);
  const startedAt = useRef(performance.now());
  const done = useRef(false);
  const mashesRef = useRef(0);
  const mortarRef = useRef<HTMLDivElement>(null);
  const ingredientDrag = useRef<{ id: string; startX: number; startY: number; pointerId: number; moved: boolean } | null>(null);
  const mashDrag = useRef<{ lastY: number; pointerId: number; direction: -1 | 0 | 1; travel: number } | null>(null);
  const [showHint, dismissHint] = useCoachHint(`${added.length}:${mashes}:${press > 0}:${dragging?.id ?? ''}`, 1300);

  const add = (id: string) => {
    if (done.current || added.includes(id)) return;
    dismissHint();
    playSfx('tap');
    haptic(8);
    setAdded((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      const item = items.find(([itemId]) => itemId === id);
      setCue(next.length >= items.length ? 'All in. Grind up and down' : `${item?.[1] ?? 'Ingredient'} in mortar`);
      const now = performance.now();
      onVisual({ sauceItems: next, sauceLastItem: id, sauceDropAt: now, pulse: now });
      return next;
    });
  };

  const startIngredient = (event: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    if (done.current || added.includes(id)) return;
    event.preventDefault();
    dismissHint();
    event.currentTarget.setPointerCapture(event.pointerId);
    ingredientDrag.current = { id, startX: event.clientX, startY: event.clientY, pointerId: event.pointerId, moved: false };
    setDragging({ id, x: event.clientX, y: event.clientY });
    const item = items.find(([itemId]) => itemId === id);
    setCue(`Drop ${item?.[1] ?? 'ingredient'} into mortar`);
  };

  const moveIngredient = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = ingredientDrag.current;
    if (!drag || done.current) return;
    event.preventDefault();
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    drag.moved = drag.moved || distance > 6;
    setDragging({ id: drag.id, x: event.clientX, y: event.clientY });
  };

  const endIngredient = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = ingredientDrag.current;
    if (!drag) return;
    event.preventDefault();
    try {
      event.currentTarget.releasePointerCapture(drag.pointerId);
    } catch {
      // Pointer capture can already be gone after touch cancellation.
    }
    ingredientDrag.current = null;
    setDragging(null);
    const rect = mortarRef.current?.getBoundingClientRect();
    const overMortar = rect
      ? event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom
      : false;
    if (!drag.moved || overMortar) {
      add(drag.id);
      return;
    }
    playSfx('tap');
    haptic(8);
    setCue('Drop it inside the mortar');
  };

  const cancelIngredient = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = ingredientDrag.current;
    if (!drag) return;
    try {
      event.currentTarget.releasePointerCapture(drag.pointerId);
    } catch {
      // Pointer capture can already be gone after touch cancellation.
    }
    ingredientDrag.current = null;
    setDragging(null);
  };

  const completeMash = () => {
    if (added.length < items.length || done.current) return;
    const next = mashesRef.current + 1;
    mashesRef.current = next;
    setMashes(next);
    setPounding(true);
    playSfx('pound');
    haptic(18);
    setCue(next >= SAUCE_MASH_TARGET ? 'Chili sauce ready' : `Grinding sauce ${next}/${SAUCE_MASH_TARGET}`);
    onVisual({ mashCount: next, mashPress: press, mashPound: performance.now(), sauceItems: added, pulse: performance.now() });
    window.setTimeout(() => setPounding(false), 220);
    if (next >= SAUCE_MASH_TARGET) {
      done.current = true;
      const elapsed = performance.now() - startedAt.current;
      window.setTimeout(() => onFinish(elapsed < 10500 ? 1 : elapsed < 14500 ? 0.86 : 0.72), 260);
    }
  };

  const startMash = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (added.length < items.length || done.current) {
      setCue('Add all ingredients first');
      playSfx('tap');
      return;
    }
    event.preventDefault();
    dismissHint();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    const nextPress = clamp((event.clientY - rect.top) / rect.height, 0.08, 1);
    mashDrag.current = { lastY: event.clientY, pointerId: event.pointerId, direction: 0, travel: 0 };
    setPress(nextPress);
    setCue('Move pestle up and down');
    onVisual({ mashPress: nextPress, sauceItems: added });
  };

  const moveMash = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = mashDrag.current;
    if (!drag || done.current) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const nextPress = clamp((event.clientY - rect.top) / rect.height, 0.05, 1);
    const dy = event.clientY - drag.lastY;
    const direction: -1 | 0 | 1 = dy > 0.4 ? 1 : dy < -0.4 ? -1 : 0;
    drag.lastY = event.clientY;
    drag.travel += Math.abs(dy);
    setPress(nextPress);
    if (direction !== 0 && drag.direction !== 0 && direction !== drag.direction && drag.travel > 26) {
      drag.travel = 0;
      completeMash();
    }
    if (direction !== 0) drag.direction = direction;
    setCue(mashesRef.current > 0 ? 'Keep grinding fast' : 'Move up and down');
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
    if (!done.current) setCue(mashesRef.current ? 'Hold and grind again' : 'Scrub pestle up and down');
    setPress(0);
    onVisual({ mashPress: 0, sauceItems: added });
  };

  return (
    <div className="mini sauce-mini">
      <div className="status-row">
        <span>{cue}</span>
        <strong>{added.length < items.length ? `${added.length}/4` : `${Math.min(mashes, SAUCE_MASH_TARGET)}/${SAUCE_MASH_TARGET}`}</strong>
      </div>
      <div className="sauce-flow" aria-hidden="true">
        <i className={added.length < items.length ? 'active' : 'done'}><b>1</b><span>Add</span></i>
        <i className={added.length >= items.length ? 'active' : ''}><b>2</b><span>Grind</span></i>
      </div>
      <div
        ref={mortarRef}
        className={`mortar-pad sauce-mortar-workpad ${added.length >= items.length ? 'ready' : ''} ${pounding ? 'is-pounding' : ''}`}
        data-testid="mortar-pad"
        role="button"
        tabIndex={0}
        onPointerDown={startMash}
        onPointerMove={moveMash}
        onPointerUp={endMash}
        onPointerCancel={endMash}
      >
        <div className="mortar-scene" aria-hidden="true">
          <i className="mortar-shadow" />
          <i className="mortar-bowl" />
          <b
            className="sauce-paste"
            style={{
              width: `${Math.max(0, (added.length / items.length) * 34 + (mashes / SAUCE_MASH_TARGET) * 46)}%`,
              opacity: added.length >= items.length || mashes ? 1 : 0,
            }}
          />
          <div className="bowl-chunks" aria-hidden="true">
            {added.map((id) => (
              <em key={id} className={`food-chip ${id}`} />
            ))}
          </div>
          <i className="pestle-track">
            <em />
            <b style={{ transform: `translate(-50%, ${pounding ? 92 : press * 88}px) rotate(-10deg)` }} />
          </i>
        </div>
        <span>{added.length < items.length ? 'Drop ingredients here' : 'Hold and grind up/down'}</span>
        <strong>{Math.min(mashes, SAUCE_MASH_TARGET)}/{SAUCE_MASH_TARGET}</strong>
        <CoachHand visible={showHint && added.length >= items.length && !pounding && press === 0} variant="drag-down" />
      </div>
      <div className="sauce-tray">
        {items.map(([id, label, detail]) => (
          <button
            type="button"
            key={id}
            className={`sauce-token ${id} ${added.includes(id) ? 'done' : ''}`}
            data-testid={`sauce-token-${id}`}
            aria-label={`Add ${label} to mortar`}
            onPointerDown={(event) => startIngredient(event, id)}
            onPointerMove={moveIngredient}
            onPointerUp={endIngredient}
            onPointerCancel={cancelIngredient}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') add(id);
            }}
          >
            <i aria-hidden="true" className={`food-icon ${id}`} />
            <span>{label}</span>
            <small>{added.includes(id) ? 'in mortar' : detail}</small>
          </button>
        ))}
        <CoachHand visible={showHint && added.length < items.length && !dragging} variant="tap-token" />
      </div>
      {dragging && (
        <div className={`sauce-drag-ghost ${dragging.id}`} style={{ left: dragging.x, top: dragging.y }} aria-hidden="true">
          <i className={`food-icon ${dragging.id}`} />
        </div>
      )}
      <ProgressBar value={(added.length / items.length) * 0.48 + (mashes / SAUCE_MASH_TARGET) * 0.52} />
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
  const plateTargets: Record<string, { x: number; y: number; label: string }> = {
    rice: { x: 0.28, y: 0.52, label: 'rice mound' },
    chicken: { x: 0.56, y: 0.5, label: 'chicken slices' },
    cucumber: { x: 0.5, y: 0.78, label: 'cucumber row' },
    chili: { x: 0.78, y: 0.68, label: 'chili saucer' },
  };
  const [placed, setPlaced] = useState<string[]>([]);
  const [cue, setCue] = useState('Drag rice to its spot');
  const [dragGhost, setDragGhost] = useState<{ id: string; x: number; y: number } | null>(null);
  const startedAt = useRef(performance.now());
  const done = useRef(false);
  const scoresRef = useRef<number[]>([]);
  const plateRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; pointerId: number; startX: number; startY: number } | null>(null);
  const ignoreClick = useRef(false);
  const [showHint, dismissHint] = useCoachHint(`${placed.length}:${dragGhost?.id ?? ''}`, 1300);
  const expectedId = items[placed.length]?.[0];
  const expectedLabel = items[placed.length]?.[1];

  const place = (id: string, quality = 0.82) => {
    if (done.current) return;
    if (id !== expectedId) {
      const nextLabel = expectedLabel ?? 'next item';
      setCue(`Next is ${nextLabel}`);
      playSfx('tap');
      haptic(8);
      return;
    }
    setPlaced((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      scoresRef.current.push(quality);
      const nextItem = items[next.length];
      setCue(nextItem ? `Now place ${nextItem[1]}` : 'Ready to serve');
      playSfx(next.length >= items.length ? 'success' : 'plate');
      haptic(next.length >= items.length ? 18 : 10);
      onVisual({ plateItems: next, pulse: performance.now() });
      if (next.length >= items.length) {
        done.current = true;
        const elapsed = performance.now() - startedAt.current;
        window.setTimeout(() => onFinish(avg(scoresRef.current) * (elapsed < 12000 ? 1 : elapsed < 16000 ? 0.9 : 0.78)), 360);
      }
      return next;
    });
  };

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    if (done.current || placed.includes(id)) return;
    if (id !== expectedId) {
      setCue(`Next is ${expectedLabel}`);
      playSfx('tap');
      haptic(8);
      return;
    }
    dismissHint();
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
    const target = plateBox && plateTargets[drag.id]
      ? {
          x: plateBox.left + plateBox.width * plateTargets[drag.id].x,
          y: plateBox.top + plateBox.height * plateTargets[drag.id].y,
        }
      : null;
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
      if (!overPlate) {
        setCue(`Drop ${items.find(([id]) => id === expectedId)?.[1] ?? 'it'} on the plate`);
      } else if (drag.id !== expectedId) {
        place(drag.id);
      } else if (target && plateBox) {
        const targetDistance = Math.hypot(event.clientX - target.x, event.clientY - target.y);
        const tolerance = Math.max(44, Math.min(plateBox.width, plateBox.height) * 0.26);
        const closeness = 1 - Math.min(1, targetDistance / tolerance);
        if (closeness < 0.18) {
          setCue(`Aim for the ${plateTargets[drag.id].label}`);
          playSfx('tap');
          haptic(8);
        } else {
          place(drag.id, clamp(0.72 + closeness * 0.28, 0.72, 1));
        }
      }
    }
  };

  const handleTokenClick = (id: string) => {
    if (ignoreClick.current) {
      ignoreClick.current = false;
      return;
    }
    dismissHint();
    const label = items.find(([itemId]) => itemId === id)?.[1] ?? 'item';
    setCue(id === expectedId ? `Drag ${label} to the highlighted spot` : `Next is ${expectedLabel}`);
    playSfx('tap');
    haptic(8);
  };

  return (
    <div className="mini plate-mini">
      <div className="status-row plate-status">
        <span>{cue}</span>
        <strong>{placed.length}/4</strong>
      </div>
      <div className={`plate-drop plate-stage ${dragGhost ? 'is-catching' : ''}`} data-testid="plate-drop" ref={plateRef}>
        <div className="plate-model" aria-hidden="true">
          <i className="plated-rim" />
          {expectedId && <i className={`plate-target ${expectedId}`} />}
          <i className={`plated-piece rice ${placed.includes('rice') ? 'in' : ''}`} />
          <i className={`plated-piece chicken ${placed.includes('chicken') ? 'in' : ''}`} />
          <i className={`plated-piece cucumber ${placed.includes('cucumber') ? 'in' : ''}`} />
          <i className={`plated-piece chili ${placed.includes('chili') ? 'in' : ''}`} />
        </div>
        <strong>{placed.length >= items.length ? 'Ready to serve' : `${placed.length}/4 on plate`}</strong>
        <CoachHand visible={showHint && placed.length === 0 && !dragGhost} variant="tap" />
      </div>
      <div className="plate-active-tray">
        {expectedId && expectedLabel && (
          <button
            className={`plate-token plate-current-token ${expectedId} ${dragGhost?.id === expectedId ? 'dragging' : ''}`}
            data-testid={`plate-token-${expectedId}`}
            onPointerDown={(event) => startDrag(event, expectedId)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClick={() => handleTokenClick(expectedId)}
            aria-label={`Drag ${expectedLabel} to ${plateTargets[expectedId].label}`}
          >
            <i aria-hidden="true" className={`plate-icon ${expectedId}`} />
            <span>{expectedLabel}</span>
            <small>{plateTargets[expectedId].label}</small>
          </button>
        )}
        <div className="plate-queue" aria-hidden="true">
          {items.slice(placed.length + 1).map(([id, label]) => (
            <i key={id} className={id}>
              <b className={`plate-icon ${id}`} />
              <span>{label}</span>
            </i>
          ))}
        </div>
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

function CoachHand({ visible, variant }: { visible: boolean; variant: 'tap' | 'tap-token' | 'swipe' | 'swipe-up' | 'drag-heat' | 'circle' | 'drag-down' }) {
  return <i className={`coach-hand ${variant} ${visible ? 'show' : ''}`} aria-hidden="true" />;
}

function ProgressBar({ value }: { value: number }) {
  return <div className="progress-bar"><i style={{ width: `${clamp(value, 0, 1) * 100}%` }} /></div>;
}

function useCoachHint(signal: string, delay = 1300) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [signal, delay]);

  const dismiss = useCallback(() => setVisible(false), []);
  return [visible, dismiss] as const;
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

function renderStars(value: number) {
  return FILLED_STAR.repeat(value) + EMPTY_STAR.repeat(3 - value);
}

function feedbackNote(stepId: string, score: number) {
  const level = score >= 0.86 ? 0 : score >= 0.64 ? 1 : 2;
  const notes: Record<string, [string, string, string]> = {
    'prep-aromatics': ['Sharp timing', 'Good cuts', 'Center the blade'],
    'toast-rice': ['Great stir', 'Rice toasted', 'Use the wok'],
    'poach-chicken': ['Silky poach', 'Heat steady', 'Watch the heat'],
    'make-chili': ['Sauce bright', 'Good grinding', 'Move faster'],
    'plate-set': ['Beautiful plate', 'Set plated', 'Keep assembling'],
  };
  return (notes[stepId] ?? ['Nice work', 'Good try', 'Try again'])[level];
}

type SfxKind = 'tap' | 'chop' | 'toss' | 'stir' | 'pound' | 'plate' | 'success' | 'gold';

let sfxContext: AudioContext | null = null;

function playSfx(kind: SfxKind) {
  try {
    const AudioCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    if (!sfxContext || sfxContext.state === 'closed') {
      sfxContext = new AudioCtor({ latencyHint: 'interactive' });
    }
    void sfxContext.resume();
    const ctx = sfxContext;
    const now = ctx.currentTime + 0.01;
    const master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);

    const blip = (freq: number, delay: number, duration: number, volume: number, type: OscillatorType, slideTo?: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + delay;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration * 0.82);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + duration + 0.03);
    };

    if (kind === 'tap') blip(520, 0, 0.06, 0.045, 'triangle', 610);
    if (kind === 'chop') {
      blip(190, 0, 0.055, 0.09, 'square', 95);
      blip(760, 0.012, 0.035, 0.035, 'triangle', 520);
    }
    if (kind === 'toss') {
      blip(330, 0, 0.09, 0.05, 'triangle', 560);
      blip(660, 0.08, 0.08, 0.04, 'sine', 880);
    }
    if (kind === 'stir') blip(240, 0, 0.08, 0.04, 'sine', 300);
    if (kind === 'pound') {
      blip(140, 0, 0.07, 0.1, 'square', 80);
      blip(360, 0.02, 0.05, 0.035, 'triangle', 220);
    }
    if (kind === 'plate') blip(620, 0, 0.08, 0.045, 'triangle', 760);
    if (kind === 'success' || kind === 'gold') {
      const chord = kind === 'gold' ? [523.25, 659.25, 783.99] : [392, 493.88, 659.25];
      chord.forEach((freq, i) => blip(freq, i * 0.045, 0.16, 0.04, 'triangle', freq * 1.08));
    }
    window.setTimeout(() => master.disconnect(), 420);
  } catch {
    // Sound effects are progressive enhancement; gameplay must never depend on them.
  }
}

function haptic(duration: number) {
  try {
    const nav = navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean };
    nav.vibrate?.(duration);
  } catch {
    // Vibration support varies by browser and device.
  }
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
