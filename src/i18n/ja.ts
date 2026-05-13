import type { Dictionary } from './types';

export const ja: Dictionary = {
  menu: {
    eyebrow: 'シンガポール屋台',
    titleChickenRice: 'チキンライス',
    titleLaksa: 'ラクサ',
    bestShift: '最高記録',
    play: (dish) => `${dish}を作る`,
    languageLabel: '言語',
    pick: '料理を選ぶ',
  },
  result: {
    eyebrow: '提供完了',
    h1: 'お疲れさま',
    timeLabel: '時間',
    mistakesLabel: 'ミス',
    replay: (dish) => `${dish}をもう一度`,
  },
  hud: {
    emptyHands: '手は空っぽ',
    clean: 'ノーミス',
    mistakes: (n) => `ミス${n}回`,
    noStation: '近くに台なし',
    moveLabel: '移動',
    moveAria: '移動スティック：ドラッグで歩く',
    stopHere: 'ここで止まる',
    working: '作業中',
  },
  feedback: {
    moveToStation: '調理台に移動',
    hands: '両手がふさがってる',
    none: '捨てるものなし',
    throwAway: '捨てた。新しい食材を取って。',
  },
};
