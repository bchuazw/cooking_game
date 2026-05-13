import type { DishConfig } from './types';

// Same station-ID set as chicken-rice so the existing cooking flow keeps working;
// each ID is re-themed for a laksa stall:
//   pantry      → noodle bar (rice noodles)
//   fridge      → prawn cooler
//   board       → herb / prep board (devein prawns)
//   riceCooker  → noodle blanching pot
//   pot         → coconut broth wok
//   mortar      → sambal/laksa-paste mortar
//   plate       → assembly bowl
//   serve       → hawker hand-off window
//   trash       → bin
// Stations are repositioned along the same two counter strips so the kitchen
// reads as a different stall, not a reshuffle of the same one.
export const laksa: DishConfig = {
  id: 'laksa',
  palette: {
    wall: '#e87b54',
    wallDark: '#7a2f1a',
    floor: '#f4cfa3',
    tileLine: '#a86a3a',
    counter: '#3b2a26',
    counterTop: '#c45846',
    counterDark: '#3c1a10',
    accentTop: '#f4b34a',
    accentBottom: '#c83e2a',
    pendantWarm: '#ffc46c',
    pendantRing: '#b04324',
  },
  // Stations sit at the same coordinates as chicken-rice so the underlying
  // cooking mechanics still trigger correctly, BUT a new center-island
  // counter (see collisionBoxes below) forces the player to navigate around
  // an obstacle in the middle of the room — different floor plan from the
  // open rectangular chicken-rice kitchen.
  stations: [
    { id: 'fridge', name: 'Prawn Cooler', shortName: 'Cooler', x: -3.15, z: -1.25, uiX: 18, uiY: 34 },
    { id: 'pantry', name: 'Noodle Bar', shortName: 'Noodles', x: -1.6, z: -2.0, uiX: 34, uiY: 26 },
    { id: 'board', name: 'Herb Board', shortName: 'Herbs', x: 0.05, z: -2.0, uiX: 50, uiY: 26 },
    { id: 'riceCooker', name: 'Blanch Pot', shortName: 'Blanch', x: 1.75, z: -2.0, uiX: 68, uiY: 26 },
    { id: 'pot', name: 'Coconut Wok', shortName: 'Wok', x: 3.35, z: -0.35, uiX: 82, uiY: 45 },
    { id: 'mortar', name: 'Sambal Mortar', shortName: 'Sambal', x: -2.4, z: 1.55, uiX: 27, uiY: 67 },
    { id: 'plate', name: 'Bowl Bar', shortName: 'Bowl', x: -0.15, z: 1.38, uiX: 50, uiY: 67 },
    { id: 'serve', name: 'Pickup Window', shortName: 'Serve', x: 1.75, z: 1.38, uiX: 70, uiY: 67 },
    { id: 'trash', name: 'Bin', shortName: 'Trash', x: -3.3, z: 0.65, uiX: 15, uiY: 57 },
  ],
  collisionBoxes: [
    { minX: -3.35, maxX: 2.85, minZ: -2.52, maxZ: -1.56 },
    { minX: -2.98, maxX: 2.62, minZ: 1.05, maxZ: 1.78 },
    { minX: -3.78, maxX: -3.02, minZ: -1.34, maxZ: 1.36 },
    { minX: 2.92, maxX: 3.72, minZ: -1.04, maxZ: 1.58 },
    // Laksa-only: center prep island the cook must walk around.
    { minX: -0.85, maxX: 0.85, minZ: -0.55, maxZ: 0.4 },
  ],
  // Tighter overcook windows than chicken-rice so the player has less buffer
  // to retrieve finished ingredients before they spoil. Same cook durations,
  // less margin → "slightly harder" without changing mechanics.
  timers: {
    chopChicken: 1500,
    poundSauce: 1700,
    riceCook: 5200,
    riceOvercook: 11500,
    chickenPoach: 5600,
    chickenOvercook: 13000,
  },
  strings: {
    en: {
      name: 'Laksa',
      shortName: 'Laksa',
      goal: 'Blanch noodles, simmer coconut broth, sear sambal, assemble the bowl, and serve it bubbling.',
      itemLabels: {
        rawRice: 'Raw noodles',
        cookingRice: 'Blanching noodles',
        cookedRice: 'Cooked noodles',
        overcookedRice: 'Soggy noodles',
        rawChicken: 'Raw prawns',
        cutChicken: 'Deveined prawns',
        poachingChicken: 'Simmering broth',
        poachedChicken: 'Coconut broth',
        overcookedChicken: 'Broken broth',
        chiliIngredients: 'Sambal paste',
        chiliSauce: 'Laksa sambal',
        chickenRice: 'Laksa bowl',
      },
      plateLabels: { rice: 'Noodles', chicken: 'Broth', sauce: 'Sambal' },
      workflowLabels: { rice: 'Noodles', chicken: 'Broth', sauce: 'Sambal', plate: 'Bowl', serve: 'Serve' },
      stationTips: {
        pantry: { title: 'Noodle bar', body: 'Thick rice vermicelli soaks up the curry; pull a portion for one bowl.' },
        riceCooker: { title: 'Blanch fast', body: 'Drop noodles into rolling water for ~60s, then rinse to stop the cook.' },
        fridge: { title: 'Prawn pick', body: 'Medium tiger prawns shell easily and stay sweet against the rich broth.' },
        board: { title: 'Devein', body: 'Slit the back, lift the dark vein out — keeps the broth clean and the prawns crisp.' },
        pot: { title: 'Coconut broth', body: 'Bloom the paste in oil, then loosen with stock and finish with coconut cream — never re-boil.' },
        mortar: { title: 'Laksa sambal', body: 'Pound dried chilies, shallots, lemongrass, galangal, candlenut, and shrimp paste into a rempah.' },
        plate: { title: 'Build the bowl', body: 'Noodles first, prawns on top, ladle the broth, finish with sambal and a daun kesum sprig.' },
        serve: { title: 'Pass it hot', body: 'Serve immediately — laksa loses its sheen if the broth sits.' },
      },
      startFeedback: 'Grab noodles at the bar or prawns from the cooler.',
    },
    ja: {
      name: 'ラクサ',
      shortName: 'ラクサ',
      goal: '麺を湯通し、ココナッツスープを煮て、サンバルを炒め、盛り付けて熱々で出そう。',
      itemLabels: {
        rawRice: '生米麺',
        cookingRice: '麺を湯通し中',
        cookedRice: '茹で麺',
        overcookedRice: '伸びた麺',
        rawChicken: '生エビ',
        cutChicken: '背わた取りエビ',
        poachingChicken: 'スープ煮込み中',
        poachedChicken: 'ココナッツスープ',
        overcookedChicken: '分離したスープ',
        chiliIngredients: 'サンバルの素',
        chiliSauce: 'ラクササンバル',
        chickenRice: 'ラクサ',
      },
      plateLabels: { rice: '麺', chicken: 'スープ', sauce: 'サンバル' },
      workflowLabels: { rice: '麺', chicken: 'スープ', sauce: 'サンバル', plate: '盛付', serve: '提供' },
      stationTips: {
        pantry: { title: '麺バー', body: '太めのビーフン麺がカレーをよく吸う。1人前ずつ取ろう。' },
        riceCooker: { title: '湯通しは手早く', body: '沸騰湯に約60秒、その後冷水で締めて余熱を止める。' },
        fridge: { title: 'エビ選び', body: '中サイズのタイガープラウンは殻が剥きやすく、濃いスープにも甘味で勝てる。' },
        board: { title: '背わた', body: '背に切り込みを入れて黒い筋を抜く。スープが濁らず、エビの食感も残る。' },
        pot: { title: 'ココナッツスープ', body: 'ペーストを油で炒め、出汁でのばし、最後にココナッツクリーム。再沸騰はNG。' },
        mortar: { title: 'ラクサのサンバル', body: '乾燥唐辛子、エシャロット、レモングラス、ガランガル、キャンドルナッツ、シュリンプペーストを潰す。' },
        plate: { title: '盛り付け', body: '麺→エビ→スープ→サンバル→ダウンクスムの葉、の順で重ねる。' },
        serve: { title: 'すぐ出す', body: 'ラクサは置くと風味が落ちる。熱々で提供しよう。' },
      },
      startFeedback: '麺バーから麺、または冷蔵庫からエビを取ろう。',
    },
  },
};
