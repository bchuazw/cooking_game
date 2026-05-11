import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  DISH,
  ITEM_LABELS,
  PLATE_LABELS,
  STATION_BY_ID,
  STATIONS,
  TIMERS,
  WORLD_LIMITS,
  type HeldItem,
  type PlateComponent,
  type StationId,
  type StationItem,
} from './gameData';
import { VoxelCanvas, type KitchenVisualState, type VisualStationState } from './VoxelCanvas';

type Screen = 'menu' | 'play' | 'result';

interface PlayerState {
  x: number;
  z: number;
  facing: number;
  moving: boolean;
}

interface StationSlot {
  item: StationItem;
  startedAt?: number;
  readyAt?: number;
  overcookAt?: number;
}

type StationSlots = Partial<Record<StationId, StationSlot>>;
type PlateState = Record<PlateComponent, boolean>;

type Action =
  | { enabled: true; label: string; station: StationId; kind: 'instant'; run: () => void }
  | { enabled: true; label: string; station: StationId; kind: 'hold'; duration: number; run: () => void }
  | { enabled: false; label: string };

interface ActiveHold {
  station: StationId;
  startedAt: number;
  duration: number;
}

const BEST_KEY = 'hawker-rush:overcooked:v1';
const INTERACT_RADIUS = 0.82;
const MOVE_SPEED = 2.85;
const AUTO_DWELL_MS = 1500;
const START_PLAYER: PlayerState = { x: 0, z: 0.05, facing: Math.PI, moving: false };

const EMPTY_PLATE: PlateState = { rice: false, chicken: false, sauce: false };

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [player, setPlayer] = useState<PlayerState>(START_PLAYER);
  const [held, setHeld] = useState<HeldItem | null>(null);
  const [stations, setStations] = useState<StationSlots>({});
  const [plate, setPlate] = useState<PlateState>(EMPTY_PLATE);
  const [nearStation, setNearStation] = useState<StationId | null>(null);
  const [activeHold, setActiveHold] = useState<ActiveHold | null>(null);
  const [activeProgress, setActiveProgress] = useState(0);
  const [dwell, setDwell] = useState<ActiveHold | null>(null);
  const [dwellProgress, setDwellProgress] = useState(0);
  const [feedback, setFeedback] = useState('Move with the joystick. Cook the order on the ticket.');
  const [startedAt, setStartedAt] = useState(0);
  const [servedAt, setServedAt] = useState(0);
  const [nowTick, setNowTick] = useState(() => performance.now());
  const [mistakes, setMistakes] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY) ?? 0));
  const [pulse, setPulse] = useState<{ station: StationId; key: number } | null>(null);

  const joystickRef = useRef({ x: 0, z: 0 });
  const keysRef = useRef({ left: false, right: false, up: false, down: false });
  const holdFrameRef = useRef<number | null>(null);
  const dwellFrameRef = useRef<number | null>(null);
  const holdDoneRef = useRef(false);
  const autoCooldownRef = useRef({ key: '', until: 0 });

  const elapsed = screen === 'play' ? nowTick - startedAt : servedAt ? servedAt - startedAt : 0;
  const orderComplete = plate.rice && plate.chicken && plate.sauce;
  const stars = scoreStars(elapsed, mistakes);

  const visualStations = useMemo(() => buildVisualStationState(stations, nowTick), [stations, nowTick]);

  const begin = useCallback(() => {
    const now = performance.now();
    setScreen('play');
    setPlayer(START_PLAYER);
    setHeld(null);
    setStations({});
    setPlate(EMPTY_PLATE);
    setNearStation(null);
    setActiveHold(null);
    setActiveProgress(0);
    setDwell(null);
    setDwellProgress(0);
    setFeedback('Get rice from the pantry or chicken from the fridge.');
    setStartedAt(now);
    setServedAt(0);
    setNowTick(now);
    setMistakes(0);
    setPulse(null);
    autoCooldownRef.current = { key: '', until: 0 };
    joystickRef.current = { x: 0, z: 0 };
    keysRef.current = { left: false, right: false, up: false, down: false };
  }, []);

  const pulseStation = useCallback((station: StationId) => {
    setPulse({ station, key: performance.now() });
  }, []);

  const clearStation = useCallback((station: StationId) => {
    setStations((prev) => {
      const next = { ...prev };
      delete next[station];
      return next;
    });
  }, []);

  const setStationItem = useCallback((station: StationId, slot: StationSlot) => {
    setStations((prev) => ({ ...prev, [station]: slot }));
  }, []);

  const finishOrder = useCallback(() => {
    const now = performance.now();
    setServedAt(now);
    const finalStars = scoreStars(now - startedAt, mistakes);
    setBest((prev) => {
      const next = Math.max(prev, finalStars);
      localStorage.setItem(BEST_KEY, String(next));
      return next;
    });
    setScreen('result');
    setFeedback('Order served.');
    pulseStation('serve');
    playSfx('success');
    haptic(35);
  }, [mistakes, pulseStation, startedAt]);

  const action = useMemo<Action>(() => {
    if (!nearStation) return { enabled: false, label: 'Move to a station' };
    const slot = stations[nearStation];

    if (nearStation === 'trash') {
      if (held) {
        return {
          enabled: true,
          label: `Discard ${ITEM_LABELS[held]}`,
          station: 'trash',
          kind: 'instant',
          run: () => {
            setHeld(null);
            setMistakes((value) => value + 1);
            setFeedback('Thrown away. Grab a fresh ingredient.');
            pulseStation('trash');
            playSfx('drop');
          },
        };
      }
      return { enabled: false, label: 'Nothing to throw away' };
    }

    if (nearStation === 'pantry') {
      const riceStarted = Boolean(stations.riceCooker) || plate.rice || held === 'cookedRice' || held === 'rawRice';
      if (!held && !riceStarted) {
        return {
          enabled: true,
          label: 'Pick up uncooked rice',
          station: 'pantry',
          kind: 'instant',
          run: () => {
            setHeld('rawRice');
            setFeedback('Carry rice to the rice cooker.');
            pulseStation('pantry');
            playSfx('pickup');
          },
        };
      }
      return { enabled: false, label: held ? 'Hands full' : 'Rice already started' };
    }

    if (nearStation === 'fridge') {
      const chickenStarted = Boolean(stations.board) || Boolean(stations.pot) || plate.chicken || held === 'rawChicken' || held === 'cutChicken' || held === 'poachedChicken';
      if (!held && !chickenStarted) {
        return {
          enabled: true,
          label: 'Pick up raw chicken',
          station: 'fridge',
          kind: 'instant',
          run: () => {
            setHeld('rawChicken');
            setFeedback('Carry chicken to the cutting board.');
            pulseStation('fridge');
            playSfx('pickup');
          },
        };
      }
      return { enabled: false, label: held ? 'Hands full' : 'Chicken already started' };
    }

    if (nearStation === 'board') {
      if (held === 'rawChicken' && !slot) {
        return {
          enabled: true,
          label: 'Place chicken on board',
          station: 'board',
          kind: 'instant',
          run: () => {
            setHeld(null);
            setStationItem('board', { item: 'rawChicken' });
            setFeedback('Stay by the board to chop the chicken.');
            pulseStation('board');
            playSfx('drop');
          },
        };
      }
      if (slot?.item === 'rawChicken') {
        return {
          enabled: true,
          label: 'Chopping chicken...',
          station: 'board',
          kind: 'hold',
          duration: TIMERS.chopChicken,
          run: () => {
            setStationItem('board', { item: 'cutChicken' });
            setFeedback('Chicken is cut. Pick it up and poach it.');
            pulseStation('board');
            playSfx('chop');
          },
        };
      }
      if (!held && slot?.item === 'cutChicken') {
        return {
          enabled: true,
          label: 'Pick up cut chicken',
          station: 'board',
          kind: 'instant',
          run: () => {
            clearStation('board');
            setHeld('cutChicken');
            setFeedback('Carry cut chicken to the stock pot.');
            pulseStation('board');
            playSfx('pickup');
          },
        };
      }
      return { enabled: false, label: held ? 'Board needs raw chicken' : 'Bring chicken here' };
    }

    if (nearStation === 'riceCooker') {
      if (held === 'rawRice' && !slot) {
        return {
          enabled: true,
          label: 'Place rice in cooker',
          station: 'riceCooker',
          kind: 'instant',
          run: () => {
            const now = performance.now();
            setHeld(null);
            setStationItem('riceCooker', {
              item: 'cookingRice',
              startedAt: now,
              readyAt: now + TIMERS.riceCook,
              overcookAt: now + TIMERS.riceOvercook,
            });
            setFeedback('Rice is cooking. Come back when it is ready.');
            pulseStation('riceCooker');
            playSfx('drop');
          },
        };
      }
      if (slot?.item === 'cookingRice') return { enabled: false, label: 'Rice cooking...' };
      if (!held && (slot?.item === 'cookedRice' || slot?.item === 'overcookedRice')) {
        return {
          enabled: true,
          label: slot.item === 'overcookedRice' ? 'Pick up dry rice' : 'Pick up cooked rice',
          station: 'riceCooker',
          kind: 'instant',
          run: () => {
            clearStation('riceCooker');
            setHeld('cookedRice');
            setFeedback('Carry rice to the plate station.');
            pulseStation('riceCooker');
            playSfx('pickup');
          },
        };
      }
      return { enabled: false, label: held ? 'Cooker needs uncooked rice' : 'Bring rice here' };
    }

    if (nearStation === 'pot') {
      if (held === 'cutChicken' && !slot) {
        return {
          enabled: true,
          label: 'Place chicken in pot',
          station: 'pot',
          kind: 'instant',
          run: () => {
            const now = performance.now();
            setHeld(null);
            setStationItem('pot', {
              item: 'poachingChicken',
              startedAt: now,
              readyAt: now + TIMERS.chickenPoach,
              overcookAt: now + TIMERS.chickenOvercook,
            });
            setFeedback('Chicken is poaching. Watch the pot.');
            pulseStation('pot');
            playSfx('drop');
          },
        };
      }
      if (slot?.item === 'poachingChicken') return { enabled: false, label: 'Chicken poaching...' };
      if (!held && (slot?.item === 'poachedChicken' || slot?.item === 'overcookedChicken')) {
        return {
          enabled: true,
          label: slot.item === 'overcookedChicken' ? 'Pick up tough chicken' : 'Pick up poached chicken',
          station: 'pot',
          kind: 'instant',
          run: () => {
            clearStation('pot');
            setHeld('poachedChicken');
            setFeedback('Carry chicken to the plate station.');
            pulseStation('pot');
            playSfx('pickup');
          },
        };
      }
      return { enabled: false, label: held ? 'Pot needs cut chicken' : 'Bring cut chicken here' };
    }

    if (nearStation === 'mortar') {
      if (!held && !slot && !plate.sauce) {
        return {
          enabled: true,
          label: 'Add chili ingredients',
          station: 'mortar',
          kind: 'instant',
          run: () => {
            setStationItem('mortar', { item: 'chiliIngredients' });
            setFeedback('Stay by the mortar to pound the chili sauce.');
            pulseStation('mortar');
            playSfx('drop');
          },
        };
      }
      if (slot?.item === 'chiliIngredients') {
        return {
          enabled: true,
          label: 'Pounding chili sauce...',
          station: 'mortar',
          kind: 'hold',
          duration: TIMERS.poundSauce,
          run: () => {
            setStationItem('mortar', { item: 'chiliSauce' });
            setFeedback('Sauce is ready. Pick it up for plating.');
            pulseStation('mortar');
            playSfx('pound');
          },
        };
      }
      if (!held && slot?.item === 'chiliSauce') {
        return {
          enabled: true,
          label: 'Pick up chili sauce',
          station: 'mortar',
          kind: 'instant',
          run: () => {
            clearStation('mortar');
            setHeld('chiliSauce');
            setFeedback('Carry chili sauce to the plate station.');
            pulseStation('mortar');
            playSfx('pickup');
          },
        };
      }
      return { enabled: false, label: held ? 'Hands full' : 'Sauce already done' };
    }

    if (nearStation === 'plate') {
      if (held === 'cookedRice' && !plate.rice) return plateAction('rice');
      if (held === 'poachedChicken' && !plate.chicken) return plateAction('chicken');
      if (held === 'chiliSauce' && !plate.sauce) return plateAction('sauce');
      if (!held && orderComplete) {
        return {
          enabled: true,
          label: 'Pick up completed plate',
          station: 'plate',
          kind: 'instant',
          run: () => {
            setHeld('chickenRice');
            setFeedback('Serve the chicken rice at the window.');
            pulseStation('plate');
            playSfx('pickup');
          },
        };
      }
      return { enabled: false, label: held ? 'That item is already plated' : 'Bring cooked parts here' };
    }

    if (nearStation === 'serve') {
      if (held === 'chickenRice') {
        return {
          enabled: true,
          label: 'Serve chicken rice',
          station: 'serve',
          kind: 'instant',
          run: finishOrder,
        };
      }
      return { enabled: false, label: 'Bring the completed plate' };
    }

    return { enabled: false, label: 'Move to a station' };

    function plateAction(component: PlateComponent): Action {
      return {
        enabled: true,
        label: `Plate ${PLATE_LABELS[component]}`,
        station: 'plate',
        kind: 'instant',
        run: () => {
          setPlate((prev) => ({ ...prev, [component]: true }));
          setHeld(null);
          setFeedback(component === 'sauce' ? 'Plate complete. Pick it up and serve.' : `${PLATE_LABELS[component]} plated.`);
          pulseStation('plate');
          playSfx('plate');
        },
      };
    }
  }, [clearStation, finishOrder, held, nearStation, orderComplete, plate, pulseStation, setStationItem, stations]);

  useEffect(() => {
    if (screen !== 'play' || !action.enabled) return;
    if (activeHold || dwell || player.moving) return;
    const key = `${action.station}:${action.label}`;
    const now = performance.now();
    if (autoCooldownRef.current.key === key && autoCooldownRef.current.until > now) return;
    startDwell(action);
    // The state-derived action is the trigger; startAction is intentionally not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, activeHold, dwell, player.moving, screen]);

  useEffect(() => {
    if (screen !== 'play') return undefined;
    const interval = window.setInterval(() => {
      const now = performance.now();
      setNowTick(now);
      let penalty = 0;
      setStations((prev) => {
        let changed = false;
        const next: StationSlots = { ...prev };
        const rice = next.riceCooker;
        if (rice?.item === 'cookingRice' && rice.readyAt && now >= rice.readyAt) {
          next.riceCooker = { ...rice, item: 'cookedRice' };
          changed = true;
          playSfx('ready');
        } else if (rice?.item === 'cookedRice' && rice.overcookAt && now >= rice.overcookAt) {
          next.riceCooker = { ...rice, item: 'overcookedRice' };
          changed = true;
          penalty += 1;
        }

        const chicken = next.pot;
        if (chicken?.item === 'poachingChicken' && chicken.readyAt && now >= chicken.readyAt) {
          next.pot = { ...chicken, item: 'poachedChicken' };
          changed = true;
          playSfx('ready');
        } else if (chicken?.item === 'poachedChicken' && chicken.overcookAt && now >= chicken.overcookAt) {
          next.pot = { ...chicken, item: 'overcookedChicken' };
          changed = true;
          penalty += 1;
        }
        return changed ? next : prev;
      });
      if (penalty) {
        setMistakes((value) => value + penalty);
        setFeedback('Food overcooked. You can still serve it, but the score drops.');
      }
    }, 140);
    return () => window.clearInterval(interval);
  }, [screen]);

  useEffect(() => {
    if (screen !== 'play') return undefined;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      const keyX = (keysRef.current.right ? 1 : 0) - (keysRef.current.left ? 1 : 0);
      const keyZ = (keysRef.current.down ? 1 : 0) - (keysRef.current.up ? 1 : 0);
      let x = joystickRef.current.x + keyX;
      let z = joystickRef.current.z + keyZ;
      const length = Math.hypot(x, z);
      if (length > 1) {
        x /= length;
        z /= length;
      }
      setPlayer((prev) => {
        const moving = Math.hypot(x, z) > 0.05;
        if (!moving) return prev.moving ? { ...prev, moving: false } : prev;
        return {
          x: clamp(prev.x + x * MOVE_SPEED * dt, WORLD_LIMITS.minX, WORLD_LIMITS.maxX),
          z: clamp(prev.z + z * MOVE_SPEED * dt, WORLD_LIMITS.minZ, WORLD_LIMITS.maxZ),
          facing: Math.atan2(x, z),
          moving: true,
        };
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [screen]);

  useEffect(() => {
    if (screen !== 'play') return;
    setNearStation(getNearestStation(player));
  }, [player, screen]);

  useEffect(() => {
    if (dwell && (nearStation !== dwell.station || player.moving)) cancelDwell();
    if (activeHold && nearStation !== activeHold.station) cancelHold();
    // These cancellation helpers read current progress state and should only react to proximity/movement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearStation, activeHold, dwell, player.moving]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') keysRef.current.left = true;
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') keysRef.current.right = true;
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') keysRef.current.up = true;
      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') keysRef.current.down = true;
    };
    const up = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') keysRef.current.left = false;
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') keysRef.current.right = false;
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') keysRef.current.up = false;
      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') keysRef.current.down = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const startAction = (nextAction = action) => {
    if (!nextAction.enabled) {
      setFeedback(nextAction.label);
      playSfx('error');
      return;
    }
    pulseStation(nextAction.station);
    if (nextAction.kind === 'instant') {
      nextAction.run();
      haptic(10);
      return;
    }
    if (holdFrameRef.current) cancelAnimationFrame(holdFrameRef.current);
    holdDoneRef.current = false;
    const started = performance.now();
    setActiveHold({ station: nextAction.station, startedAt: started, duration: nextAction.duration });
    setActiveProgress(0);
    playSfx('work');
    const tick = (now: number) => {
      const value = clamp((now - started) / nextAction.duration, 0, 1);
      setActiveProgress(value);
      if (value >= 1) {
        holdDoneRef.current = true;
        holdFrameRef.current = null;
        setActiveHold(null);
        setActiveProgress(0);
        nextAction.run();
        haptic(18);
        return;
      }
      holdFrameRef.current = requestAnimationFrame(tick);
    };
    holdFrameRef.current = requestAnimationFrame(tick);
  };

  const startDwell = (nextAction: Action) => {
    if (!nextAction.enabled) return;
    if (dwellFrameRef.current) cancelAnimationFrame(dwellFrameRef.current);
    const started = performance.now();
    setDwell({ station: nextAction.station, startedAt: started, duration: AUTO_DWELL_MS });
    setDwellProgress(0);
    const tick = (now: number) => {
      const value = clamp((now - started) / AUTO_DWELL_MS, 0, 1);
      setDwellProgress(value);
      if (value >= 1) {
        dwellFrameRef.current = null;
        setDwell(null);
        setDwellProgress(0);
        autoCooldownRef.current = {
          key: `${nextAction.station}:${nextAction.label}`,
          until: now + (nextAction.kind === 'hold' ? nextAction.duration + 450 : 450),
        };
        startAction(nextAction);
        return;
      }
      dwellFrameRef.current = requestAnimationFrame(tick);
    };
    dwellFrameRef.current = requestAnimationFrame(tick);
  };

  const cancelDwell = () => {
    if (dwellFrameRef.current) cancelAnimationFrame(dwellFrameRef.current);
    dwellFrameRef.current = null;
    if (dwell) setFeedback('Stop at the station to work.');
    autoCooldownRef.current = { key: '', until: 0 };
    setDwell(null);
    setDwellProgress(0);
  };

  const cancelHold = () => {
    if (holdFrameRef.current) cancelAnimationFrame(holdFrameRef.current);
    holdFrameRef.current = null;
    if (activeHold && !holdDoneRef.current) setFeedback('Keep holding until the station finishes.');
    setActiveHold(null);
    setActiveProgress(0);
  };

  const visualState: KitchenVisualState = {
    player,
    held,
    stations: visualStations,
    plate,
    nearStation,
    activeStation: activeHold?.station ?? dwell?.station ?? null,
    activeProgress: activeHold ? activeProgress : dwellProgress,
    pulseStation: pulse?.station ?? null,
    pulseKey: pulse?.key ?? 0,
    served: screen === 'result',
  };

  return (
    <main className="app-shell">
      {screen === 'menu' && <MenuScreen best={best} onBegin={begin} />}
      {screen === 'play' && (
        <section className="screen play-screen">
          <VoxelCanvas state={visualState} />
          <StationLabels near={nearStation} active={activeHold?.station ?? dwell?.station ?? null} />
          <TopHud elapsed={elapsed} held={held} mistakes={mistakes} plate={plate} />
          <WorkflowGuide held={held} stations={stations} plate={plate} />
          <MovePad onMove={(vector) => { joystickRef.current = vector; }} />
          <div className="auto-panel">
            <div className="near-pill">
              <span data-testid="nearby-station">{nearStation ? STATION_BY_ID[nearStation].name : 'No station'}</span>
            </div>
            <div className={`auto-task ${action.enabled ? 'ready' : ''}`} data-testid="auto-task">
              <i style={{ transform: `scaleX(${activeHold ? activeProgress : dwellProgress})` }} />
              <strong>{action.enabled ? activeHold ? 'Working' : dwell ? 'Stay' : 'Stop' : ''}</strong>
            </div>
            <p data-testid="feedback-text">{feedback}</p>
          </div>
          <span className="sr-only" data-testid="player-position">{player.x.toFixed(2)},{player.z.toFixed(2)}</span>
        </section>
      )}
      {screen === 'result' && <ResultScreen elapsed={elapsed} mistakes={mistakes} stars={stars} onReplay={begin} />}
    </main>
  );
}

function MenuScreen({ best, onBegin }: { best: number; onBegin: () => void }) {
  return (
    <section className="screen menu-screen">
      <VoxelCanvas state={null} />
      <div className="menu-vignette" />
      <div className="menu-card">
        <p className="eyebrow">Singapore kitchen rush</p>
        <h1>Hawker Rush</h1>
        <p>{DISH.goal}</p>
        <div className="best-row">
          <span>Best shift</span>
          <strong>{renderStars(best || 1)}</strong>
        </div>
        <button className="primary-button" data-testid="start-chicken-rice" onClick={onBegin}>Start chicken rice</button>
      </div>
    </section>
  );
}

function TopHud({ elapsed, held, mistakes, plate }: { elapsed: number; held: HeldItem | null; mistakes: number; plate: PlateState }) {
  return (
    <header className="top-hud">
      <section className="order-ticket">
        <div>
          <p className="eyebrow">Order</p>
          <h2>{DISH.shortName}</h2>
        </div>
        <OrderChip done={plate.rice} label="Rice" />
        <OrderChip done={plate.chicken} label="Chicken" />
        <OrderChip done={plate.sauce} label="Chili" />
      </section>
      <section className="status-strip">
        <strong data-testid="timer-text">{formatTime(elapsed)}</strong>
        <span data-testid="held-item">{held ? ITEM_LABELS[held] : 'Empty hands'}</span>
        <em>{mistakes ? `${mistakes} mistake${mistakes > 1 ? 's' : ''}` : 'Clean'}</em>
      </section>
    </header>
  );
}

function OrderChip({ done, label }: { done: boolean; label: string }) {
  return (
    <span className={`order-chip ${done ? 'done' : ''} order-${label.toLowerCase()}`}>
      <i />
      <b className="sr-only">{done ? 'Done ' : ''}{label}</b>
    </span>
  );
}

function WorkflowGuide({ held, stations, plate }: { held: HeldItem | null; stations: StationSlots; plate: PlateState }) {
  const active = getActiveWorkflowStep(held, stations, plate);
  const complete = plate.rice && plate.chicken && plate.sauce;
  const steps = [
    { id: 'rice', label: 'Rice', done: plate.rice },
    { id: 'chicken', label: 'Chicken', done: plate.chicken },
    { id: 'chili', label: 'Chili', done: plate.sauce },
    { id: 'plate', label: 'Plate', done: held === 'chickenRice' },
    { id: 'serve', label: 'Serve', done: false },
  ];

  return (
    <div className="workflow-guide" aria-label="Chicken rice checklist">
      {steps.map((step) => (
        <span
          key={step.id}
          className={`workflow-step guide-${step.id} ${step.done ? 'done' : active === step.id ? 'active' : complete && step.id === 'serve' ? 'active' : ''}`}
        >
          <i />
          <b>{step.label}</b>
        </span>
      ))}
    </div>
  );
}

function StationLabels({ near, active }: { near: StationId | null; active: StationId | null }) {
  return (
    <div className="station-labels" aria-hidden>
      {STATIONS.map((station) => (
        <span
          key={station.id}
          className={`station-label station-${station.id} ${near === station.id ? 'near' : ''} ${active === station.id ? 'active' : ''}`}
          style={{ left: `${station.uiX}%`, top: `${station.uiY}%` }}
          data-testid={`station-label-${station.id}`}
        >
          <i />
          <b className="sr-only">{station.shortName}</b>
        </span>
      ))}
    </div>
  );
}

function MovePad({ onMove }: { onMove: (vector: { x: number; z: number }) => void }) {
  const padRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, z: 0 });

  const update = (event: ReactPointerEvent<HTMLDivElement>) => {
    const element = padRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let x = clamp((event.clientX - cx) / (rect.width / 2), -1, 1);
    let z = clamp((event.clientY - cy) / (rect.height / 2), -1, 1);
    const length = Math.hypot(x, z);
    if (length > 1) {
      x /= length;
      z /= length;
    }
    const vector = { x, z };
    setKnob(vector);
    onMove(vector);
  };

  const release = () => {
    const vector = { x: 0, z: 0 };
    setKnob(vector);
    onMove(vector);
  };

  return (
    <div
      ref={padRef}
      className="move-pad"
      data-testid="move-pad"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        update(event);
      }}
      onPointerMove={(event) => {
        if (event.buttons || event.pointerType === 'touch') update(event);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <i style={{ transform: `translate(calc(-50% + ${knob.x * 26}px), calc(-50% + ${knob.z * 26}px))` }} />
    </div>
  );
}

function ResultScreen({ elapsed, mistakes, stars, onReplay }: { elapsed: number; mistakes: number; stars: number; onReplay: () => void }) {
  return (
    <section className="screen result-screen">
      <VoxelCanvas
        state={{
          player: { x: 1.75, z: 1.55, facing: Math.PI, moving: false },
          held: null,
          stations: emptyVisualStations(),
          plate: { rice: true, chicken: true, sauce: true },
          nearStation: 'serve',
          activeStation: null,
          activeProgress: 0,
          pulseStation: 'serve',
          pulseKey: 1,
          served: true,
        }}
      />
      <div className="menu-vignette" />
      <div className="result-card">
        <p className="eyebrow">Order served</p>
        <h1>{DISH.name}</h1>
        <div className="result-stars" data-testid="result-stars">{renderStars(stars)}</div>
        <p className="result-meta">Time {formatTime(elapsed)} - {mistakes ? `${mistakes} mistake${mistakes > 1 ? 's' : ''}` : 'clean cook'}</p>
        <p>{DISH.learning}</p>
        <button className="primary-button" onClick={onReplay}>Play again</button>
      </div>
    </section>
  );
}

function buildVisualStationState(stations: StationSlots, now: number): Record<StationId, VisualStationState> {
  const visual = {} as Record<StationId, VisualStationState>;
  for (const station of STATIONS) {
    const slot = stations[station.id];
    let progress = 0;
    if (slot?.startedAt && slot.readyAt) {
      progress = clamp((now - slot.startedAt) / (slot.readyAt - slot.startedAt), 0, 1);
    } else if (slot?.item === 'cookedRice' || slot?.item === 'overcookedRice' || slot?.item === 'poachedChicken' || slot?.item === 'overcookedChicken') {
      progress = 1;
    }
    visual[station.id] = {
      item: slot?.item ?? null,
      progress,
      overcooked: slot?.item === 'overcookedRice' || slot?.item === 'overcookedChicken',
    };
  }
  return visual;
}

function emptyVisualStations() {
  return Object.fromEntries(STATIONS.map((station) => [station.id, { item: null, progress: 0, overcooked: false }])) as Record<StationId, VisualStationState>;
}

function getNearestStation(player: PlayerState): StationId | null {
  let best: { id: StationId; distance: number } | null = null;
  for (const station of STATIONS) {
    const distance = Math.hypot(player.x - station.x, player.z - station.z);
    if (distance <= INTERACT_RADIUS && (!best || distance < best.distance)) {
      best = { id: station.id, distance };
    }
  }
  return best?.id ?? null;
}

function getActiveWorkflowStep(held: HeldItem | null, stations: StationSlots, plate: PlateState) {
  const riceMoving = held === 'rawRice' || held === 'cookedRice' || Boolean(stations.riceCooker);
  const chickenMoving = held === 'rawChicken' || held === 'cutChicken' || held === 'poachedChicken' || Boolean(stations.board) || Boolean(stations.pot);
  const chiliMoving = held === 'chiliSauce' || Boolean(stations.mortar);

  if (held === 'chickenRice') return 'serve';
  if (plate.rice && plate.chicken && plate.sauce) return 'plate';
  if (!plate.rice && riceMoving) return 'rice';
  if (!plate.chicken && chickenMoving) return 'chicken';
  if (!plate.sauce && chiliMoving) return 'chili';
  if (!plate.rice) return 'rice';
  if (!plate.chicken) return 'chicken';
  if (!plate.sauce) return 'chili';
  return 'plate';
}

function scoreStars(elapsed: number, mistakes: number) {
  let score = elapsed <= 85000 ? 3 : elapsed <= 125000 ? 2 : 1;
  score -= mistakes;
  return clamp(Math.round(score), 1, 3);
}

function renderStars(value: number) {
  return '\u2605'.repeat(value) + '\u2606'.repeat(3 - value);
}

function formatTime(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

let sfxContext: AudioContext | null = null;

function playSfx(kind: 'pickup' | 'drop' | 'chop' | 'pound' | 'plate' | 'work' | 'ready' | 'success' | 'error') {
  try {
    const AudioCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    if (!sfxContext || sfxContext.state === 'closed') sfxContext = new AudioCtor({ latencyHint: 'interactive' });
    void sfxContext.resume();
    const ctx = sfxContext;
    const now = ctx.currentTime + 0.01;
    const output = ctx.createGain();
    output.gain.value = 0.2;
    output.connect(ctx.destination);
    const tone = (freq: number, delay = 0, duration = 0.08, type: OscillatorType = 'square') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.36, now + delay + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
      osc.connect(gain);
      gain.connect(output);
      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.03);
    };
    if (kind === 'success') [523, 659, 784].forEach((freq, index) => tone(freq, index * 0.08, 0.13));
    else if (kind === 'ready') tone(660, 0, 0.11);
    else if (kind === 'error') tone(110, 0, 0.16, 'sawtooth');
    else if (kind === 'work') tone(170, 0, 0.16, 'triangle');
    else if (kind === 'chop') tone(300, 0, 0.06);
    else if (kind === 'pound') tone(190, 0, 0.09, 'triangle');
    else if (kind === 'plate') tone(440, 0, 0.09);
    else tone(260, 0, 0.07);
  } catch {
    // Audio is optional.
  }
}

function haptic(ms: number) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Vibration is optional.
  }
}
