import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { DISHES, dishById, starsFromAverage, tierFromScore, type DishDefinition, type DishId, type StepDefinition, type Tier } from './gameData';
import { VoxelCanvas, type VisualState } from './VoxelCanvas';

interface StepResult {
  id: string;
  title: string;
  score: number;
  tier: Tier;
}

type Screen = 'menu' | 'cook' | 'result';

const BEST_KEY = 'hawker-mama-voxel:v1';

interface DragState {
  id: string;
  x: number;
  y: number;
  startY: number;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [dishId, setDishId] = useState<DishId>('chicken-rice');
  const [stepIndex, setStepIndex] = useState(0);
  const [results, setResults] = useState<StepResult[]>([]);
  const [feedback, setFeedback] = useState<StepResult | null>(null);
  const [visualState, setVisualState] = useState<VisualState>({});
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
    setVisualState({});
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

  useEffect(() => {
    setVisualState({});
  }, [dishId, stepIndex]);

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
          visualState={visualState}
          onExit={() => setScreen('menu')}
          onFinish={finishStep}
          onVisualState={setVisualState}
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
  visualState,
  onExit,
  onFinish,
  onVisualState,
}: {
  dish: DishDefinition;
  step: StepDefinition;
  stepIndex: number;
  totalSteps: number;
  feedback: StepResult | null;
  visualState: VisualState;
  onExit: () => void;
  onFinish: (score: number) => void;
  onVisualState: (state: VisualState) => void;
}) {
  return (
    <section className="screen cook-screen" style={{ '--accent': dish.palette.main, '--accent-dark': dish.palette.dark } as CSSProperties}>
      <VoxelCanvas mode="cook" dishId={dish.id} stepId={step.id} visualState={visualState} />
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
        <MiniGame key={`${dish.id}-${step.id}-${stepIndex}`} step={step} onFinish={onFinish} onVisualState={onVisualState} />
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

function MiniGame({
  step,
  onFinish,
  onVisualState,
}: {
  step: StepDefinition;
  onFinish: (score: number) => void;
  onVisualState: (state: VisualState) => void;
}) {
  if (step.kind === 'slider') return <SliderGame step={step} onFinish={onFinish} onVisualState={onVisualState} />;
  if (step.kind === 'sequence') return <SequenceGame step={step} onFinish={onFinish} onVisualState={onVisualState} />;
  if (step.kind === 'stir') return <StirGame step={step} onFinish={onFinish} onVisualState={onVisualState} />;
  if (step.kind === 'hold') return <HoldGame step={step} onFinish={onFinish} onVisualState={onVisualState} />;
  if (step.kind === 'swipe') return <SwipeGame step={step} onFinish={onFinish} onVisualState={onVisualState} />;
  if (step.kind === 'fold') return <FoldGame onFinish={onFinish} onVisualState={onVisualState} />;
  return <PlateGame step={step} onFinish={onFinish} onVisualState={onVisualState} />;
}

function SliderGame({
  step,
  onFinish,
  onVisualState,
}: {
  step: StepDefinition;
  onFinish: (score: number) => void;
  onVisualState: (state: VisualState) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(0.18);
  const holdRef = useRef(0);
  const startRef = useRef(performance.now());
  const touchedRef = useRef(false);
  const doneRef = useRef(false);
  const finishRef = useRef(onFinish);
  const visualRef = useRef(onVisualState);
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
    valueRef.current = next;
    touchedRef.current = true;
    setValue(next);
    onVisualState({ sliderValue: next, temp: 60 + next * 40, inZone: (60 + next * 40) >= min && (60 + next * 40) <= max, holdPct: clamp(holdRef.current / holdGoal, 0, 1) });
  };

  useEffect(() => {
    finishRef.current = onFinish;
    visualRef.current = onVisualState;
  }, [onFinish, onVisualState]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const liveValue = valueRef.current;
      const liveTemp = 60 + liveValue * 40;
      const liveInZone = liveTemp >= min && liveTemp <= max;
      if (touchedRef.current && liveInZone) holdRef.current += dt;
      else if (touchedRef.current) holdRef.current = Math.max(0, holdRef.current - dt * 0.9);
      setHold(holdRef.current);
      visualRef.current({ sliderValue: liveValue, temp: liveTemp, inZone: liveInZone, holdPct: clamp(holdRef.current / holdGoal, 0, 1) });
      if (!doneRef.current && holdRef.current >= holdGoal) {
        doneRef.current = true;
        const elapsed = performance.now() - startRef.current;
        finishRef.current(elapsed < 4300 ? 1 : elapsed < 6500 ? 0.78 : 0.58);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [holdGoal, max, min]);

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

function SequenceGame({
  step,
  onFinish,
  onVisualState,
}: {
  step: StepDefinition;
  onFinish: (score: number) => void;
  onVisualState: (state: VisualState) => void;
}) {
  const items = step.items ?? [];
  const dropRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const startRef = useRef(performance.now());
  const lastDropAt = useRef(0);

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  useEffect(() => {
    onVisualState({ sequenceIndex: index, placedIds: placed, dragId: drag?.id ?? null });
  }, [drag?.id, index, onVisualState, placed]);

  const beginDrag = (id: string, x: number, y: number) => {
    const next = { id, x, y, startY: y };
    dragRef.current = next;
    setDrag(next);
  };

  const moveDrag = (x: number, y: number) => {
    const current = dragRef.current;
    if (!current) return;
    const next = { ...current, x, y };
    dragRef.current = next;
    setDrag(next);
    const rect = dropRef.current?.getBoundingClientRect();
    const inside = rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    const tossedUp = y < current.startY - 18;
    if (inside || tossedUp) drop(current.id, x, y, tossedUp, false);
  };

  const drop = (id: string, x: number, y: number, force = false, release = true) => {
    if (index >= items.length) return;
    const rect = dropRef.current?.getBoundingClientRect();
    const inside = !!rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    if (!force && !inside) {
      if (release) {
        dragRef.current = null;
        setDrag(null);
      }
      return;
    }
    dragRef.current = null;
    setDrag(null);
    lastDropAt.current = performance.now();
    addIngredient(id);
  };

  const addIngredient = (id: string) => {
    if (index >= items.length || placed.includes(id)) return;
    if (id !== items[index].id) {
      setMistakes((m) => m + 1);
      return;
    }
    const next = index + 1;
    const nextPlaced = [...placed, id];
    setPlaced(nextPlaced);
    setIndex(next);
    if (next === items.length) {
      const elapsed = performance.now() - startRef.current;
      const mistakePenalty = mistakes * 0.16;
      const speedBonus = elapsed < 5000 ? 0.06 : 0;
      onVisualState({ sequenceIndex: next, placedIds: nextPlaced, dragId: null });
      window.setTimeout(() => onFinish(0.9 + speedBonus - mistakePenalty), 260);
    }
  };

  useEffect(() => {
    if (!drag) return undefined;
    const onMove = (e: PointerEvent) => {
      moveDrag(e.clientX, e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      const current = dragRef.current;
      if (current) drop(current.id, e.clientX, e.clientY, false, true);
    };
    const onMouseMove = (e: MouseEvent) => {
      moveDrag(e.clientX, e.clientY);
    };
    const onMouseUp = (e: MouseEvent) => {
      const current = dragRef.current;
      if (current) drop(current.id, e.clientX, e.clientY, false, true);
    };
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0] ?? e.changedTouches[0];
      if (!touch) return;
      moveDrag(touch.clientX, touch.clientY);
    };
    const onTouchEnd = (e: TouchEvent) => {
      const current = dragRef.current;
      const touch = e.changedTouches[0];
      if (current && touch) drop(current.id, touch.clientX, touch.clientY, false, true);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  });

  return (
    <div className="sequence-game">
      <div className="next-chip">
        <span>{step.targetLabel}</span>
        <strong>{items[index]?.label ?? 'Ready'}</strong>
      </div>
      <div ref={dropRef} className="ingredient-drop-zone" data-testid="sequence-drop-zone">
        <span>{items[index] ? `Drop ${items[index].label} here` : 'Ready'}</span>
        <div className="drop-bowl">
          {placed.map((id) => {
            const item = items.find((candidate) => candidate.id === id);
            return item ? <i key={id} style={{ '--tile': item.color } as CSSProperties} /> : null;
          })}
        </div>
      </div>
      <div className="sequence-grid">
        {items.map((item, i) => (
          <button
            key={item.id}
            className={`ingredient-tile ${i === index ? 'active' : ''} ${i < index ? 'done' : ''}`}
            style={{ '--tile': item.color } as CSSProperties}
            data-testid={`sequence-${item.id}`}
            disabled={placed.includes(item.id)}
            onClick={() => {
              if (performance.now() - lastDropAt.current < 350) return;
              if (i === index) addIngredient(item.id);
              else setMistakes((m) => m + 1);
            }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              beginDrag(item.id, e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (e.buttons || e.pointerType === 'touch') moveDrag(e.clientX, e.clientY);
            }}
            onMouseMove={(e) => {
              if (e.buttons) moveDrag(e.clientX, e.clientY);
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              if (touch) moveDrag(touch.clientX, touch.clientY);
            }}
            onPointerUp={(e) => {
              const current = dragRef.current;
              if (current) drop(current.id, e.clientX, e.clientY, false, true);
            }}
            onPointerCancel={(e) => {
              const current = dragRef.current;
              if (current) drop(current.id, e.clientX, e.clientY, false, true);
            }}
            onMouseDown={(e) => {
              beginDrag(item.id, e.clientX, e.clientY);
            }}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              if (touch) beginDrag(item.id, touch.clientX, touch.clientY);
            }}
          >
            <span className="voxel-swatch" />
            <strong>{item.label}</strong>
            <small>{i < index ? 'added' : i === index ? 'drag' : 'locked'}</small>
          </button>
        ))}
      </div>
      <p className="microcopy">{mistakes ? `${mistakes} wrong drop${mistakes > 1 ? 's' : ''}; keep going.` : 'Drag the glowing ingredient into the pot.'}</p>
      {drag && (
        <div
          className="drag-ghost ingredient-ghost"
          style={{ left: drag.x, top: drag.y, '--tile': items.find((item) => item.id === drag.id)?.color ?? '#fff8e4' } as CSSProperties}
        >
          {items.find((item) => item.id === drag.id)?.label}
        </div>
      )}
    </div>
  );
}

function StirGame({
  step,
  onFinish,
  onVisualState,
}: {
  step: StepDefinition;
  onFinish: (score: number) => void;
  onVisualState: (state: VisualState) => void;
}) {
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
    onVisualState({ stirProgress: progressRef.current });
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

function HoldGame({
  step,
  onFinish,
  onVisualState,
}: {
  step: StepDefinition;
  onFinish: (score: number) => void;
  onVisualState: (state: VisualState) => void;
}) {
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
      onVisualState({ holdProgress: clamp(next / total, 0, 1), inZone: next >= min && next <= max });
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
          onVisualState({ holdProgress: 0, inZone: false });
        }}
        onPointerUp={release}
        onPointerCancel={release}
      >
        {inZone ? 'Release now' : holding ? `${held.toFixed(1)}s` : 'Hold to cook'}
      </button>
    </div>
  );
}

function SwipeGame({
  step,
  onFinish,
  onVisualState,
}: {
  step: StepDefinition;
  onFinish: (score: number) => void;
  onVisualState: (state: VisualState) => void;
}) {
  const [count, setCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const countRef = useRef(0);
  const mistakesRef = useRef(0);
  const startX = useRef(0);
  const draggingRef = useRef(false);
  const startRef = useRef(performance.now());
  const target = step.swipes ?? 6;
  const expected = count % 2 === 0 ? 'right' : 'left';

  const register = (direction: 'left' | 'right' | 'short') => {
    const liveCount = countRef.current;
    const liveExpected = liveCount % 2 === 0 ? 'right' : 'left';
    if (direction === liveExpected) {
      const next = liveCount + 1;
      countRef.current = next;
      setCount(next);
      onVisualState({ swipeProgress: next / target, swipeDirection: direction, swipeDrag: 0 });
      if (next >= target) {
        const elapsed = performance.now() - startRef.current;
        onFinish((elapsed < 6500 ? 0.98 : 0.82) - mistakesRef.current * 0.08);
      }
    } else {
      mistakesRef.current += 1;
      setMistakes(mistakesRef.current);
      onVisualState({ swipeProgress: liveCount / target, swipeDirection: direction, swipeDrag: 0 });
    }
  };

  const move = (clientX: number) => {
    if (!draggingRef.current) return;
    const dx = clientX - startX.current;
    const normalized = clamp(dx / 135, -1, 1);
    setDragDelta(dx);
    onVisualState({ swipeProgress: countRef.current / target, swipeDirection: dx > 12 ? 'right' : dx < -12 ? 'left' : 'short', swipeDrag: normalized });
    if (Math.abs(dx) > 12) {
      draggingRef.current = false;
      setDragDelta(0);
      register(dx > 0 ? 'right' : 'left');
    }
  };

  const start = (clientX: number) => {
    startX.current = clientX;
    draggingRef.current = true;
    setDragDelta(0);
  };

  const end = (clientX: number) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const dx = clientX - startX.current;
    setDragDelta(0);
    register(dx > 48 ? 'right' : dx < -48 ? 'left' : 'short');
  };

  return (
    <div className="swipe-game">
      <div
        className="swipe-pad"
        data-testid="swipe-pad"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          start(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons || e.pointerType === 'touch') move(e.clientX);
        }}
        onPointerUp={(e) => end(e.clientX)}
        onPointerCancel={(e) => end(e.clientX)}
        onMouseDown={(e) => start(e.clientX)}
        onMouseMove={(e) => {
          if (e.buttons) move(e.clientX);
        }}
        onMouseUp={(e) => end(e.clientX)}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          if (touch) start(touch.clientX);
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          if (touch) move(touch.clientX);
        }}
        onTouchEnd={(e) => {
          const touch = e.changedTouches[0];
          if (touch) end(touch.clientX);
        }}
      >
        <div className={`swipe-lane ${expected}`}>
          <i style={{ transform: `translateX(${clamp(dragDelta, -96, 96)}px) scaleX(${1 + Math.min(Math.abs(dragDelta) / 180, 0.45)})` }} />
        </div>
        <strong>Swipe {expected}</strong>
        <span>{count}/{target}</span>
      </div>
      <div className="meter"><i style={{ width: `${(count / target) * 100}%` }} /></div>
      {mistakes > 0 && <p className="microcopy">Alternate directions: right, left, right, left.</p>}
    </div>
  );
}

function FoldGame({
  onFinish,
  onVisualState,
}: {
  onFinish: (score: number) => void;
  onVisualState: (state: VisualState) => void;
}) {
  const corners = ['top left', 'top right', 'bottom left', 'bottom right'];
  const boardRef = useRef<HTMLDivElement>(null);
  const [folded, setFolded] = useState<boolean[]>([false, false, false, false]);
  const [dragging, setDragging] = useState<number | null>(null);
  const startRef = useRef(performance.now());

  const fold = (i: number) => {
    if (folded[i]) return;
    const next = folded.map((value, index) => (index === i ? true : value));
    setFolded(next);
    onVisualState({ foldedCorners: next });
    if (next.every(Boolean)) {
      const elapsed = performance.now() - startRef.current;
      onFinish(elapsed < 5200 ? 1 : 0.74);
    }
  };

  const dragTowardCenter = (i: number, clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = Math.abs(clientX - centerX);
    const dy = Math.abs(clientY - centerY);
    if (dx < rect.width * 0.24 && dy < rect.height * 0.24) fold(i);
  };

  return (
    <div ref={boardRef} className="fold-game">
      <div className="fold-sheet" aria-hidden>
        <i className={`fold-crease horizontal ${folded[0] || folded[1] ? 'active' : ''}`} />
        <i className={`fold-crease vertical ${folded[2] || folded[3] ? 'active' : ''}`} />
      </div>
      {corners.map((corner, i) => (
        <button
          key={corner}
          className={`corner-button c${i} ${folded[i] ? 'done' : ''} ${dragging === i ? 'dragging' : ''}`}
          data-testid={`fold-${i}`}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging(i);
          }}
          onPointerMove={(e) => {
            if (e.buttons || e.pointerType === 'touch') dragTowardCenter(i, e.clientX, e.clientY);
          }}
          onPointerUp={(e) => {
            dragTowardCenter(i, e.clientX, e.clientY);
            setDragging(null);
          }}
          onPointerCancel={() => setDragging(null)}
          onClick={() => fold(i)}
        >
          <span>{folded[i] ? 'folded' : 'fold'}</span>
        </button>
      ))}
      <div className="dough-target" data-testid="fold-center">centre</div>
    </div>
  );
}

function PlateGame({
  step,
  onFinish,
  onVisualState,
}: {
  step: StepDefinition;
  onFinish: (score: number) => void;
  onVisualState: (state: VisualState) => void;
}) {
  const plateRef = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<string[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const startRef = useRef(performance.now());
  const items = step.items ?? [];

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  const beginDrag = (id: string, x: number, y: number) => {
    const next = { id, x, y, startY: y };
    dragRef.current = next;
    setDrag(next);
    onVisualState({ platePlaced: placed, dragId: id });
  };

  const moveDrag = (x: number, y: number) => {
    const current = dragRef.current;
    if (!current) return;
    const next = { ...current, x, y };
    dragRef.current = next;
    setDrag(next);
    const rect = plateRef.current?.getBoundingClientRect();
    if (rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      drop(current.id, x, y);
    }
  };

  const drop = (id: string, x: number, y: number) => {
    const rect = plateRef.current?.getBoundingClientRect();
    dragRef.current = null;
    setDrag(null);
    if (!rect || placed.includes(id)) return;
    const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    if (!inside) return;
    const next = [...placed, id];
    setPlaced(next);
    onVisualState({ platePlaced: next, dragId: null });
    if (next.length === items.length) {
      const elapsed = performance.now() - startRef.current;
      onFinish(elapsed < 7000 ? 1 : 0.76);
    }
  };

  useEffect(() => {
    if (!drag) return undefined;
    const onMove = (e: PointerEvent) => {
      moveDrag(e.clientX, e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      const current = dragRef.current;
      if (current) drop(current.id, e.clientX, e.clientY);
    };
    const onMouseMove = (e: MouseEvent) => {
      moveDrag(e.clientX, e.clientY);
    };
    const onMouseUp = (e: MouseEvent) => {
      const current = dragRef.current;
      if (current) drop(current.id, e.clientX, e.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0] ?? e.changedTouches[0];
      if (touch) moveDrag(touch.clientX, touch.clientY);
    };
    const onTouchEnd = (e: TouchEvent) => {
      const current = dragRef.current;
      const touch = e.changedTouches[0];
      if (current && touch) drop(current.id, touch.clientX, touch.clientY);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  });

  return (
    <div className="plate-game">
      <div ref={plateRef} className="plate-target" data-testid="plate-target">
        <div className="plate-visual" aria-hidden>
          {items.map((item) => (
            <i
              key={item.id}
              className={`plate-piece ${item.id} ${placed.includes(item.id) ? 'placed' : ''}`}
              style={{ '--tile': item.color } as CSSProperties}
            />
          ))}
        </div>
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
              beginDrag(item.id, e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (e.buttons || e.pointerType === 'touch') moveDrag(e.clientX, e.clientY);
            }}
            onMouseMove={(e) => {
              if (e.buttons) moveDrag(e.clientX, e.clientY);
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              if (touch) moveDrag(touch.clientX, touch.clientY);
            }}
            onPointerUp={(e) => {
              const current = dragRef.current;
              if (current) drop(current.id, e.clientX, e.clientY);
            }}
            onPointerCancel={(e) => {
              const current = dragRef.current;
              if (current) drop(current.id, e.clientX, e.clientY);
            }}
            onMouseDown={(e) => {
              beginDrag(item.id, e.clientX, e.clientY);
            }}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              if (touch) beginDrag(item.id, touch.clientX, touch.clientY);
            }}
          >
            <span className="voxel-swatch mini" />
            <strong>{item.label}</strong>
          </button>
        ))}
      </div>
      {drag && (
        <div
          className="drag-ghost"
          style={{ left: drag.x, top: drag.y, '--tile': items.find((item) => item.id === drag.id)?.color ?? '#fff8e4' } as CSSProperties}
        >
          {items.find((item) => item.id === drag.id)?.label}
        </div>
      )}
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
