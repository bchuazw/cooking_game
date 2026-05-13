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
  stations: [
    { id: 'fridge',     name: 'Prawn Cooler',   shortName: 'Cooler',  x: -3.15, z: -0.55, uiX: 18, uiY: 45 },
    { id: 'pantry',     name: 'Noodle Bar',     shortName: 'Noodles', x: -2.4,  z: -2.0,  uiX: 27, uiY: 26 },
    { id: 'board',      name: 'Herb Board',     shortName: 'Herbs',   x: -0.6,  z: -2.0,  uiX: 44, uiY: 26 },
    { id: 'riceCooker', name: 'Blanch Pot',     shortName: 'Blanch',  x: 1.15,  z: -2.0,  uiX: 62, uiY: 26 },
    { id: 'pot',        name: 'Coconut Wok',    shortName: 'Wok',     x: 2.85,  z: -2.0,  uiX: 80, uiY: 26 },
    { id: 'mortar',     name: 'Sambal Mortar',  shortName: 'Sambal',  x: -2.4,  z: 1.55,  uiX: 27, uiY: 67 },
    { id: 'plate',      name: 'Bowl Bar',       shortName: 'Bowl',    x: -0.15, z: 1.38,  uiX: 50, uiY: 67 },
    { id: 'serve',      name: 'Pickup Window',  shortName: 'Serve',   x: 2.0,   z: 1.38,  uiX: 72, uiY: 67 },
    { id: 'trash',      name: 'Bin',            shortName: 'Trash',   x: 3.35,  z: 0.45,  uiX: 84, uiY: 56 },
  ],
  collisionBoxes: [
    { minX: -3.35, maxX: 3.05, minZ: -2.52, maxZ: -1.56 },
    { minX: -2.98, maxX: 2.62, minZ: 1.05, maxZ: 1.78 },
    { minX: -3.78, maxX: -3.02, minZ: -1.04, maxZ: 0.0 },
    { minX: 2.92, maxX: 3.72, minZ: -0.4, maxZ: 1.18 },
  ],
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
