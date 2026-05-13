export type Locale = 'en' | 'ja';

export interface Dictionary {
  menu: {
    eyebrow: string;
    titleChickenRice: string;
    titleLaksa: string;
    bestShift: string;
    play: (dishName: string) => string;
    languageLabel: string;
    pick: string;
  };
  result: {
    eyebrow: string;
    h1: string;
    timeLabel: string;
    mistakesLabel: string;
    replay: (dishName: string) => string;
  };
  hud: {
    emptyHands: string;
    clean: string;
    mistakes: (n: number) => string;
    noStation: string;
    moveLabel: string;
    moveAria: string;
    stopHere: string;
    working: string;
  };
  feedback: {
    moveToStation: string;
    hands: string;
    none: string;
    throwAway: string;
  };
}
