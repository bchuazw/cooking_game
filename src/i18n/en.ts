import type { Dictionary } from './types';

export const en: Dictionary = {
  menu: {
    eyebrow: 'Singapore Kitchen Rush',
    titleChickenRice: 'Chicken Rice',
    titleLaksa: 'Laksa',
    bestShift: 'Best shift',
    play: (dish) => `Start ${dish}`,
    languageLabel: 'Language',
    pick: 'Pick a dish',
  },
  result: {
    eyebrow: 'Order served',
    h1: 'Service over',
    timeLabel: 'Time',
    mistakesLabel: 'Mistakes',
    replay: (dish) => `Replay ${dish}`,
  },
  hud: {
    emptyHands: 'Empty hands',
    clean: 'Clean',
    mistakes: (n) => `${n} mistake${n > 1 ? 's' : ''}`,
    noStation: 'No station',
    moveLabel: 'Move',
    moveAria: 'Move joystick: drag to walk',
    stopHere: 'Stop here',
    working: 'Working',
  },
  feedback: {
    moveToStation: 'Move to a station',
    hands: 'Hands full',
    none: 'Nothing to throw away',
    throwAway: 'Thrown away. Grab a fresh ingredient.',
  },
};
