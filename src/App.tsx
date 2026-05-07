import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { DISHES, dishById, starsFromAverage, tierFromScore, type DishDefinition, type DishId, type StepDefinition, type Tier } from './gameData';
import { VoxelCanvas } from './VoxelCanvas';

interface StepResult {
  id: string;
  title: string;
  score: number;
  tier: Tier;
}

type Screen = 'menu' | 'cook' | 'result';

const BEST_KEY = 'hawker-mama-voxel:v1';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [dishId, setDishId] = useState<DishId>('chicken-rice');
  const [stepIndex, setStepIndex] = useState(0);
  const [results, setResults] = useState<StepResult[]>([]);
  const [feedback, setFeedback] = useState<StepResult | null>(null);
  const [best, setBest] = useState<Record<string, number>>(() => loadBest());
  const completedRef = useRef(false);

  const dish = dishById(dishId);
  const activeStep = dish.steps[stepIndex] ?? dish.steps[0];
  const average = results.length ? results.reduce((sum, r) => sum + r.score, 0) / results.length : 0;
  const stars = results.length ? starsFromAverage(average) : 1;

  const beginDish = (id: DishId) => {
    setDishId(id);
    setStepIndex(0);
    setResults([]);
    setFeedback(null);
    completedRef.current = false;
    setScreen('cook');
  };

  const finishStep = (score: number) => {
    if (completedRef.current) return;
    completedRef.current = true;
    const cleanScore = clamp(score, 0.2, 1);
    const result: StepResult = {
      id: activeStep.id,
      title: activeStep.title,
      score: cleanScore,
      tier: tierFromScore(cleanScore),
    };
    setResults((prev) => [...prev, result]);
    setFeedback(result);

    window.setTimeout(() => {
      setFeedback(null);
      completedRef.current = false;
      if (stepIndex + 1 < dish.steps.length) {
        setStepIndex((n) => n + 1);
      } else {
        setScreen('result');
      }
    }, 850);
  };

  useEffect(() => {
    if (screen !== 'result') return;
    const finalStars = starsFromAverage(average);
    setBest((prev) => {
      const next = { ...prev, [dishId]: Math.max(prev[dishId] ?? 0, finalStars) };
      localStorage.setItem(BEST_KEY, JSON.stringify(next));
      return next;
    });
  }, [screen, average, dishId]);

  return (
    <main className="app-shell">
      {screen === 'menu' && (
        <MenuScreen best={best} onBegin={beginDish} />
      )}

      {screen === 'cook' && (
        <CookScreen
          dish={dish}
          step={activeStep}
          stepIndex={stepIndex}
          totalSteps={dish.steps.length}
          feedback={feedback}
          onExit={() => setScreen('menu')}
          onFinish={finishStep}
        />
      )}

      {screen === 'result' && (
        <ResultScreen
          dish={dish}
          results={results}
          stars={stars}
          onMenu={() => setScreen('menu')}
          onReplay={() => beginDish(dish.id)}
        />
      )}
    </main>
  );
}

function MenuScreen({ best, onBegin }: { best: Record<string, number>; onBegin: (id: DishId) => void }) {
  const [featured, setFeatured] = useState<DishId>('chicken-rice');
  const dish = dishById(featured);
  return (
    <section className="screen menu-screen">
      <VoxelCanvas mode="menu" dishId={featured} dim />
      <header className="brand-panel">
        <p className="eyebrow">Singapore hawker cooking game</p>
        <h1>Hawker Mama</h1>
        <p>Pick a dish, play short cooking mini-games, and earn a hawker rating.</p>
      </header>

      <div className="dish-dock" aria-label="Choose a dish">
        {DISHES.map((item) => (
          <article
            key={item.id}
            className={`dish-card ${featured === item.id ? 'is-featured' : ''}`}
            style={{ '--accent': item.palette.main } as CSSProperties}
            onPointerEnter={() => setFeatured(item.id)}
            onFocus={() => setFeatured(item.id)}
          >
            <div className="dish-card-top">
              <div>
                <p className="card-kicker">{item.steps.length} steps</p>
                <h2>{item.name}</h2>
              </div>
              <div className="stars" aria-label={`best ${best[item.id] ?? 0} stars`}>
                {'★'.repeat(best[item.id] ?? 0)}{'☆'.repeat(3 - (best[item.id] ?? 0))}
              </div>
            </div>
            <p>{item.tagline}</p>
            <button
              className="primary-button"
              data-testid={`dish-${item.id}`}
              onClick={() => onBegin(item.id)}
              onPointerDown={() => setFeatured(item.id)}
            >
              Cook {item.shortName}
            </button>
          </article>
        ))}
      </div>

      <div className="fact-strip">
        <strong>{dish.shortName}</strong>
        <span>{dish.learning}</span>
      </div>
    </section>
  );
}

function CookScreen({
  dish,
  step,
  stepIndex,
  totalSteps,
  feedback,
  onExit,
  onFinish,
}: {
  dish: DishDefinition;
  step: StepDefinition;
  stepIndex: number;
  totalSteps: number;
  feedback: StepResult | null;
  onExit: () => void;
  onFinish: (score: number) => void;
}) {
  return (
    <section className="screen cook-screen" style={{ '--accent': dish.palette.main, '--accent-dark': dish.palette.dark } as CSSProperties}>
      <VoxelCanvas mode="cook" dishId={dish.id} stepId={step.id} />
      <div className="cook-hud">
        <button className="ghost-button" onClick={onExit}>Exit</button>
        <div className="progress-pips" aria-label={`step ${stepIndex + 1} of ${totalSteps}`}>
          {dish.steps.map((item, i) => (
            <span key={item.id} className={i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''} />
          ))}
        </div>
        <div className="step-count">{stepIndex + 1}/{totalSteps}</div>
      </div>

      <div className="step-sheet">
        <p className="eyebrow">{dish.name}</p>
        <h2>{step.title}</h2>
        <p className="instruction">{step.instruction}</p>
        <MiniGame key={`${dish.id}-${step.id}-${stepIndex}`} step={step} onFinish={onFinish} />
      </div>

      {feedback && (
        <div className={`feedback-badge ${feedback.tier}`} role="status">
          <strong>{feedback.tier}</strong>
          <span>{Math.round(feedback.score * 100)}%</span>
        </div>
      )}
    </section>
  );
}

function MiniGame({ step, onFinish }: { step: StepDefinition; onFinish: (score: number) => void }) {
  if (step.kind === 'slider') return <SliderGame step={step} onFinish={onFinish} />;
  if (step.kind === 'sequence') return <SequenceGame step={step} onFinish={onFinish} />;
  if (step.kind === 'stir') return <StirGame step={step} onFinish={onFinish} />;
  if (step.kind === 'hold') return <HoldGame step={step} onFinish={onFinish} />;
  if (step.kind === 'swipe') return <SwipeGame step={step} onFinish={onFinish} />;
  if (step.kind === 'fold') return <FoldGame onFinish={onFinish} />;
  return <PlateGame step={step} onFinish={onFinish} />;
}

function SliderGame({ step, onFinish }: { step: StepDefinition; onFinish: (score: number) => void }) {
  const railRef = useRef<HTMLDivElement>(null);
  const holdRef = useRef(0);
  const startRef = useRef(performance.now());
  const touchedRef = useRef(false);
  const doneRef = useRef(false);
  const [value, setValue] = useState(0.18);
  const [hold, setHold] = useState(0);
  const temp = 60 + value * 40;
  const min = step.target?.min ?? 75;
  const max = step.target?.max ?? 85;
  const inZone = temp >= min && temp <= max;
  const holdGoal = 1250;

  const updateFromY = (clientY: number) => {
    const rect = railRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = 1 - clamp((clientY - rect.top) / rect.height, 0, 1);
    touchedRef.current = true;
    setValue(next);
  };

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (touchedRef.current && inZone) holdRef.current += dt;
      else if (touchedRef.current) holdRef.current = Math.max(0, holdRef.current - dt * 0.9);
      setHold(holdRef.current);
      if (!doneRef.current && holdRef.current >= holdGoal) {
        doneRef.current = true;
        const elapsed = performance.now() - startRef.current;
        onFinish(elapsed < 4300 ? 1 : elapsed < 6500 ? 0.78 : 0.58);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inZone, onFinish]);

  const pct = clamp(hold / holdGoal, 0, 1);
  const status = !touchedRef.current ? 'Drag the handle' : inZone ? 'Good, hold steady' : temp < min ? 'Too cool, drag up' : 'Too hot, drag down';

  return (
    <div className="slider-game">
      <div
        ref={railRef}
        className="thermo-rail"
        data-testid="slider-rail"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          updateFromY(e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.buttons || e.pointerType === 'touch') updateFromY(e.clientY);
        }}
      >
        <div className="target-zone" style={{ bottom: `${((min - 60) / 40) * 100}%`, height: `${((max - min) / 40) * 100}%` }}>
          target
        </div>
        <div className="thermo-fill" style={{ height: `${value * 100}%` }} />
        <div className="thermo-handle" style={{ bottom: `calc(${value * 100}% - 17px)` }}>drag</div>
      </div>
      <div className="readout-card">
        <span>{Math.round(temp)}{step.target?.unit}</span>
        <strong>{status}</strong>
        <div className="meter"><i style={{ width: `${pct * 100}%` }} /></div>
      </div>
    </div>
  );
}

function SequenceGame({ step, onFinish }: { step: StepDefinition; onFinish: (score: number) => void }) {
  const items = step.items ?? [];
  const [index, setIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const startRef = useRef(performance.now());

  const tap = (id: string) => {
    if (index >= items.length) return;
    if (id !== items[index].id) {
      setMistakes((m) => m + 1);
      return;
    }
    const next = index + 1;
    setIndex(next);
    if (next === items.length) {
      const elapsed = performance.now() - startRef.current;
      const mistakePenalty = mistakes * 0.16;
      const speedBonus = elapsed < 5000 ? 0.06 : 0;
      onFinish(0.9 + speedBonus - mistakePenalty);
    }
  };

  return (
    <div className="sequence-game">
      <div className="next-chip">
        <span>{step.targetLabel}</span>
        <strong>{items[index]?.label ?? 'Ready'}</strong>
      </div>
      <div className="sequence-grid">
        {items.map((item, i) => (
          <button
            key={item.id}
            className={`ingredient-tile ${i === index ? 'active' : ''} ${i < index ? 'done' : ''}`}
            style={{ '--tile': item.color } as CSSProperties}
            data-testid={`sequence-${item.id}`}
            onClick={() => tap(item.id)}
          >
            <span className="voxel-swatch" />
            <strong>{item.label}</strong>
            <small>{i < index ? 'done' : i === index ? 'tap now' : 'wait'}</small>
          </button>
        ))}
      </div>
      <p className="microcopy">{mistakes ? `${mistakes} wrong tap${mistakes > 1 ? 's' : ''}; keep going.` : 'The glowing tile is always the next action.'}</p>
    </div>
  );
}

function StirGame({ step, onFinish }: { step: StepDefinition; onFinish: (score: number) => void }) {
  const padRef = useRef<HTMLDivElement>(null);
  const lastAngle = useRef<number | null>(null);
  const progressRef = useRef(0);
  const startRef = useRef(performance.now());
  const doneRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const turns = step.turns ?? 2.5;

  const angleFor = (clientX: number, clientY: number) => {
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.atan2(clientY - (rect.top + rect.height / 2), clientX - (rect.left + rect.width / 2));
  };

  const move = (clientX: number, clientY: number) => {
    const angle = angleFor(clientX, clientY);
    if (lastAngle.current === null) {
      lastAngle.current = angle;
      return;
    }
    let delta = angle - lastAngle.current;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    progressRef.current = clamp(progressRef.current + Math.abs(delta) / (Math.PI * 2 * turns), 0, 1);
    lastAngle.current = angle;
    setProgress(progressRef.current);
    if (!doneRef.current && progressRef.current >= 1) {
      doneRef.current = true;
      const elapsed = performance.now() - startRef.current;
      onFinish(elapsed < 5800 ? 1 : elapsed < 8200 ? 0.76 : 0.58);
    }
  };

  return (
    <div className="stir-game">
      <div
        ref={padRef}
        className="stir-pad"
        data-testid="stir-pad"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          move(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.buttons || e.pointerType === 'touch') move(e.clientX, e.clientY);
        }}
        onPointerUp={() => {
          lastAngle.current = null;
        }}
      >
        <div className="stir-ring" />
        <div className="spoon-orbit" style={{ transform: `rotate(${progress * 900}deg)` }}>
          <span />
        </div>
        <strong>{Math.round(progress * 100)}%</strong>
      </div>
      <div className="meter"><i style={{ width: `${progress * 100}%` }} /></div>
    </div>
  );
}

function HoldGame({ step, onFinish }: { step: StepDefinition; onFinish: (score: number) => void }) {
  const [held, setHeld] = useState(0);
  const [holding, setHolding] = useState(false);
  const startRef = useRef(0);
  const doneRef = useRef(false);
  const min = step.target?.min ?? 2.4;
  const max = step.target?.max ?? 3.7;
  const total = step.seconds ?? 4.5;
  const inZone = held >= min && held <= max;

  useEffect(() => {
    if (!holding) return undefined;
    let raf = 0;
    const tick = () => {
      const next = (performance.now() - startRef.current) / 1000;
      setHeld(next);
      if (next > total + 0.35 && !doneRef.current) {
        doneRef.current = true;
        setHolding(false);
        onFinish(0.45);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [holding, total, onFinish]);

  const release = () => {
    if (!holding || doneRef.current) return;
    doneRef.current = true;
    setHolding(false);
    const score = inZone ? 1 : held >= min - 0.65 && held <= max + 0.9 ? 0.72 : 0.42;
    onFinish(score);
  };

  return (
    <div className="hold-game">
      <div className="timing-bar">
        <div className="timing-zone" style={{ left: `${(min / total) * 100}%`, width: `${((max - min) / total) * 100}%` }} />
        <i style={{ left: `${clamp(held / total, 0, 1) * 100}%` }} />
      </div>
      <button
        className={`hold-button ${holding ? 'holding' : ''} ${inZone ? 'release' : ''}`}
        data-testid="hold-button"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          doneRef.current = false;
          startRef.current = performance.now();
          setHeld(0);
          setHolding(true);
        }}
        onPointerUp={release}
        onPointerCancel={release}
      >
        {inZone ? 'Release now' : holding ? `${held.toFixed(1)}s` : 'Hold to cook'}
      </button>
    </div>
  );
}

function SwipeGame({ step, onFinish }: { step: StepDefinition; onFinish: (score: number) => void }) {
  const [count, setCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const startX = useRef(0);
  const startRef = useRef(performance.now());
  const target = step.swipes ?? 6;
  const expected = count % 2 === 0 ? 'right' : 'left';

  const register = (direction: 'left' | 'right' | 'short') => {
    if (direction === expected) {
      const next = count + 1;
      setCount(next);
      if (next >= target) {
        const elapsed = performance.now() - startRef.current;
        onFinish((elapsed < 6500 ? 0.98 : 0.82) - mistakes * 0.08);
      }
    } else {
      setMistakes((n) => n + 1);
    }
  };

  const end = (clientX: number) => {
    const dx = clientX - startX.current;
    register(dx > 48 ? 'right' : dx < -48 ? 'left' : 'short');
  };

  return (
    <div className="swipe-game">
      <div
        className="swipe-pad"
        data-testid="swipe-pad"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          startX.current = e.clientX;
        }}
        onPointerUp={(e) => end(e.clientX)}
      >
        <strong>Swipe {expected}</strong>
        <span>{count}/{target}</span>
      </div>
      <div className="swipe-buttons">
        <button data-testid="swipe-left" className={expected === 'left' ? 'active' : ''} onClick={() => register('left')}>
          Left
        </button>
        <button data-testid="swipe-right" className={expected === 'right' ? 'active' : ''} onClick={() => register('right')}>
          Right
        </button>
      </div>
      <div className="meter"><i style={{ width: `${(count / target) * 100}%` }} /></div>
      {mistakes > 0 && <p className="microcopy">Alternate directions: right, left, right, left.</p>}
    </div>
  );
}

function FoldGame({ onFinish }: { onFinish: (score: number) => void }) {
  const corners = ['top left', 'top right', 'bottom left', 'bottom right'];
  const [folded, setFolded] = useState<boolean[]>([false, false, false, false]);
  const startRef = useRef(performance.now());

  const tap = (i: number) => {
    const next = folded.map((value, index) => (index === i ? true : value));
    setFolded(next);
    if (next.every(Boolean)) {
      const elapsed = performance.now() - startRef.current;
      onFinish(elapsed < 5200 ? 1 : 0.74);
    }
  };

  return (
    <div className="fold-game">
      {corners.map((corner, i) => (
        <button
          key={corner}
          className={`corner-button c${i} ${folded[i] ? 'done' : ''}`}
          data-testid={`fold-${i}`}
          onClick={() => tap(i)}
        >
          {folded[i] ? 'folded' : corner}
        </button>
      ))}
      <div className="dough-target">centre</div>
    </div>
  );
}

function PlateGame({ step, onFinish }: { step: StepDefinition; onFinish: (score: number) => void }) {
  const plateRef = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<string[]>([]);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);
  const startRef = useRef(performance.now());
  const items = step.items ?? [];

  const drop = (id: string, x: number, y: number) => {
    const rect = plateRef.current?.getBoundingClientRect();
    setDrag(null);
    if (!rect || placed.includes(id)) return;
    const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    if (!inside) return;
    const next = [...placed, id];
    setPlaced(next);
    if (next.length === items.length) {
      const elapsed = performance.now() - startRef.current;
      onFinish(elapsed < 7000 ? 1 : 0.76);
    }
  };

  return (
    <div className="plate-game">
      <div ref={plateRef} className="plate-target" data-testid="plate-target">
        <span>{placed.length ? placed.map((id) => items.find((item) => item.id === id)?.label).join(' + ') : 'Drop food here'}</span>
      </div>
      <div className="token-tray">
        {items.map((item) => (
          <button
            key={item.id}
            className={`food-token ${placed.includes(item.id) ? 'placed' : ''}`}
            style={{ '--tile': item.color } as CSSProperties}
            data-testid={`plate-token-${item.id}`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setDrag({ id: item.id, x: e.clientX, y: e.clientY });
            }}
            onPointerMove={(e) => {
              if (drag?.id === item.id) setDrag({ id: item.id, x: e.clientX, y: e.clientY });
            }}
            onPointerUp={(e) => drop(item.id, e.clientX, e.clientY)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {drag && <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>{items.find((item) => item.id === drag.id)?.label}</div>}
    </div>
  );
}

function ResultScreen({
  dish,
  results,
  stars,
  onMenu,
  onReplay,
}: {
  dish: DishDefinition;
  results: StepResult[];
  stars: number;
  onMenu: () => void;
  onReplay: () => void;
}) {
  return (
    <section className="screen result-screen" style={{ '--accent': dish.palette.main } as CSSProperties}>
      <VoxelCanvas mode="result" dishId={dish.id} dim />
      <div className="result-card">
        <p className="eyebrow">Dish complete</p>
        <h1>{dish.name}</h1>
        <div className="big-stars" data-testid="result-stars">{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
        <ul className="score-list">
          {results.map((result) => (
            <li key={result.id}>
              <span>{result.title}</span>
              <strong className={result.tier}>{result.tier}</strong>
            </li>
          ))}
        </ul>
        <div className="learning-card">
          <strong>What you learned</strong>
          <p>{dish.learning}</p>
        </div>
        <div className="result-actions">
          <button className="primary-button" onClick={onReplay}>Cook again</button>
          <button className="secondary-button" onClick={onMenu}>Choose dish</button>
        </div>
      </div>
    </section>
  );
}

function loadBest() {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    return raw ? JSON.parse(raw) as Record<string, number> : {};
  } catch {
    return {};
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
