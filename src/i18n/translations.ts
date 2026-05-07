// Lightweight i18n. JP-first per brief §10. EN is a faithful translation, not literal.
// Keys are flat to keep TS happy and the diff readable.

import type { Locale } from '../types';

type Dict = Record<string, string>;

const ja: Dict = {
  // common / menu
  'app.title': 'Hawker Mama',
  'app.tagline': 'メイおばさんとホーカー料理',
  'menu.tap_to_start': 'タップしてスタート',
  'menu.locale_picker': '言語',
  'menu.settings': '設定',
  'menu.leaderboard': 'スコア',
  'menu.back': '戻る',
  'menu.next': 'つぎへ',
  'menu.continue': 'つづける',
  'menu.start_cooking': '料理をはじめる',
  'menu.read_culture_first': '先に文化カードを見る',
  'menu.next_dish': 'つぎの料理',
  'menu.share': 'シェアする',
  'menu.read_culture': '文化カードを読む',
  'menu.replay': 'もう一度',
  'menu.done': 'できた！',
  'menu.locked': 'まだロック中',

  // first launch / halal explainer
  'first.welcome_title': 'ようこそ、シンガポールのホーカーへ！',
  'first.welcome_body':
    'メイおばさんと、ホーカー（屋台）料理を作ろう。各料理は2〜4分。最後に文化カードがもらえます。',
  'first.halal_explainer':
    'ハラルモードはオフ。MVPの5品はすべてハラル対応の作り方です。設定でいつでも切り替えられます。',
  'first.continue': 'はじめる',

  // hawker map
  'map.title': 'ホーカーセンター',
  'daily.title': '今日のチャレンジ',
  'daily.mod_speed': 'スピードラン',
  'daily.mod_no-hints': 'ヒントなし',
  'daily.mod_silent-auntie': '無言メイ',
  'daily.mod_tight-windows': 'タイトな採点',
  'map.unesco_note': 'シンガポールのホーカー文化はUNESCO無形文化遺産（2020年登録）',

  // dishes — names
  'dish.chicken-rice.name': '海南鶏飯',
  'dish.chicken-rice.name_en': 'Hainanese Chicken Rice',
  'dish.chicken-rice.hook':
    '海南島ルーツ、シンガポールで進化した一皿。鶏は柔らか、米は香り高く。',
  'dish.laksa.name': 'ラクサ',
  'dish.laksa.name_en': 'Laksa',
  'dish.laksa.hook':
    'カトン風ラクサ。ココナッツミルクは最後に。割れないようにそっと。',
  'dish.prata.name': 'ロティ・プラタ',
  'dish.prata.name_en': 'Roti Prata',
  'dish.prata.hook':
    '叩いて伸ばして、宙に放る。タミル系の朝ごはんがホーカーの定番に。',
  'dish.chili-crab.name': 'チリクラブ',
  'dish.chili-crab.name_en': 'Chili Crab',
  'dish.chili-crab.hook':
    '甘くて辛いソースに卵のリボン。マントウでぬぐって食べきる。',
  'dish.kaya-toast.name': 'カヤトースト',
  'dish.kaya-toast.name_en': 'Kaya Toast & Soft-Boiled Eggs',
  'dish.kaya-toast.hook':
    '朝のコピティアム。トーストにカヤ、半熟卵に醤油と胡椒。コピを流しこむ。',

  // chicken rice steps
  'cr.step1.title': '鶏をポーチする',
  'cr.step1.hint': 'スライダーを動かして、温度を緑のゾーン（75〜85°C）に保つ',
  'cr.step2.title': '氷水でしめる',
  'cr.step2.hint': '鶏を氷水に運んで、0.5秒キープ',
  'cr.step3.title': '香味野菜を加える',
  'cr.step3.hint': 'ビートに合わせてタップ：エシャロット、にんにく、生姜、パンダンの葉',
  'cr.step4.title': 'タレを叩く',
  'cr.step4.hint': '左右交互にタップして、ペーストを作る',
  'cr.step5.title': '盛り付け',
  'cr.step5.hint': '鶏をご飯に、たれは控えめ（60〜85%）、香菜ときゅうりを添えて',
  'cr.step5.sauce_label': 'たれ：{{coverage}}%（60〜85%）',

  // laksa
  'la.step1.title': 'ルンパを炒める',
  'la.step1.hint': 'ぐるぐる混ぜて、ペーストの香りを引き出す',
  'la.step2.title': '順番に加える',
  'la.step2.hint': '出汁 → ココナッツミルク → タウポー（順番が大事）',
  'la.step2.broth_stable': 'スープは安定',
  'la.step2.broth_split': '⚠ スープが割れた — 混ぜて立て直す',
  'la.step2.stock': '出汁',
  'la.step2.coconut': 'ココナッツミルク',
  'la.step2.taupok': 'タウポー',
  'la.step3.title': '麺を茹でる',
  'la.step3.hint': '5秒前後、光ったタイミングで引き上げる',
  'la.step4.title': '盛り付け',
  'la.step4.hint': 'えび、フィッシュケーキ、もやし、サンバル、ラクサの葉を散らす',

  // prata
  'pr.step1.title': '生地をこねる',
  'pr.step1.hint': '指でつまんで広げる',
  'pr.step2.title': '叩いて伸ばす',
  'pr.step2.hint': '左右にスワイプして、薄さメーターを70%以上に',
  'pr.step3.title': '宙で回す',
  'pr.step3.hint': '上にスワイプ、影が重なった瞬間にタップ（3回）',
  'pr.step4.title': 'たたむ',
  'pr.step4.hint': '四隅を中央へドラッグ',

  // chili crab
  'cc.step1.title': 'サンバルを叩く',
  'cc.step1.hint': '唐辛子、エシャロット、ブラチャンを左右交互に叩く',
  'cc.step2.title': 'カニを焼く',
  'cc.step2.hint': '光った節を順番にタップ',
  'cc.step3.title': '卵リボン',
  'cc.step3.hint': '指でゆっくり円を描く（速度バンドを保つ）',
  'cc.step4.title': '盛り付け',
  'cc.step4.hint': 'カニとマントウを並べる',

  // kaya toast
  'kt.step1.title': 'パンを焼く',
  'kt.step1.hint': '長押しで焼く、こんがりしたら離す',
  'kt.step2.title': 'カヤを塗る',
  'kt.step2.hint': '指でなでて、均等に広げる',
  'kt.step3.title': '半熟卵',
  'kt.step3.hint': 'タップで割って、醤油と胡椒をフリック',
  'kt.step4.title': 'コピを注ぐ',
  'kt.step4.hint': '長押しで高く持ち上げて、フォームを作る',

  // HUD
  'hud.step': 'ステップ',
  'hud.score': 'スコア',
  'hud.gold': 'ゴールド',
  'hud.silver': 'シルバー',
  'hud.bronze': 'ブロンズ',
  'hud.miss': 'ミス',
  'hud.tap_to_continue': 'タップで次へ',

  // dish complete
  'complete.title': 'できあがり！',
  'complete.stars_1': '★☆☆ — おつかれさま',
  'complete.stars_2': '★★☆ — いい感じ！',
  'complete.stars_3': '★★★ — シオック！',
  'complete.share_text': 'Hawker Mamaで{{dish}}を作ったよ！',

  // settings
  'settings.title': '設定',
  'settings.locale': '言語',
  'settings.halal': 'ハラルモード',
  'settings.halal_help': 'ストレッチ料理用のフラグ。MVPはすべてハラル対応。',
  'settings.music': '音楽',
  'settings.sfx': '効果音',
  'settings.voice': 'メイおばさんの声',
  'settings.reduced_motion': '動きを減らす',
  'settings.describe_step': 'ステップを読み上げ（アクセシビリティ）',
  'settings.contact': 'お問い合わせ',
  'settings.privacy': 'プライバシーポリシー',
  'settings.terms': '利用規約',
  'settings.accessibility': 'アクセシビリティ宣言',
  'settings.reset': 'データをリセット',
  'settings.reset_confirm': '本当にリセットしますか？',

  // leaderboard
  'leaderboard.title': 'スコア',
  'leaderboard.local_badge': 'ローカルスコア',
  'leaderboard.empty': 'まだスコアがありません。料理を作ってみよう！',

  // culture card
  'culture.did_you_know': '知ってた？',
  'culture.sources': '出典',

  // accessibility live region
  'aria.step_description': 'いまの手順：{{step}}',
  'aria.score_announce': 'スコア：{{tier}}',

  // catchphrases
  'auntie.welcome': 'いらっしゃい！何作る？',
  'auntie.gold': 'シオック！',
  'auntie.silver': 'いい感じ！',
  'auntie.bronze': 'まあまあ。',
  'auntie.miss': 'カンノットラー！もう一回！',
  'auntie.complete_3': 'よくできた！うちの孫みたいに上手！',
  'auntie.complete_2': 'いい感じ。次はもっと上手にできるよ。',
  'auntie.complete_1': 'お疲れさま。料理は練習！',

  // culture card content (per dish)
  'cc.chicken-rice.body':
    '海南鶏飯（Hainanese Chicken Rice）は、中国・海南島の文昌鶏に起源を持ち、20世紀前半にシンガポールへ渡った海南島出身の移民によって独自に進化した料理。米を鶏の脂と出汁で炊き、生姜・チリ・黒醤油の3種のたれが定番。',
  'cc.chicken-rice.didyouknow':
    'ティオンバル発祥の屋台が今も多く、店ごとに「鶏」「米」「たれ」のバランスが違う。',
  'cc.laksa.body':
    'ラクサにはペナン、サラワク、カトンなど複数の系統がある。シンガポールで一般的なのはカトン風（プラナカン系）で、ココナッツミルクと干しエビベースのスープに、太めの米麺を短く切って入れる。',
  'cc.laksa.didyouknow':
    'ラクサの葉（daun kesum）はミントではない。香りで違いがすぐ分かる。',
  'cc.prata.body':
    'ロティ・プラタはタミル系インド人移民が持ち込んだ朝食。生地を叩いて層を作り、鉄板で焼く。卵入り、チーズ入り、玉ねぎ入りなど派生は数十種類。カレーで食べるのが定番。',
  'cc.prata.didyouknow':
    'インドのパロタとルーツは同じだが、シンガポールでは独自進化を遂げた。',
  'cc.chili-crab.body':
    'チリクラブは1956年、シンガポールのCher Yam Tianが考案したとされる。甘辛いトマトとサンバルのソースに溶き卵を流し、マントウ（揚げパン）でソースを残さずぬぐって食べる。',
  'cc.chili-crab.didyouknow':
    '辛さよりも甘みと旨みが主役。本場では蟹味噌ごとソースに溶け込ませる。',
  'cc.kaya-toast.body':
    'カヤはココナッツミルク、卵、砂糖、パンダンで作るジャム。プラナカン文化由来で、コピティアム（伝統的な喫茶店）では半熟卵、コピ（コーヒー）と一緒に出される。',
  'cc.kaya-toast.didyouknow':
    'シンガポールのホーカー文化は2020年にUNESCO無形文化遺産に登録された。',

  // policy stubs
  'policy.privacy_title': 'プライバシーポリシー',
  'policy.privacy_body':
    'Hawker Mamaは個人情報を収集しません。スコアと設定は端末内のみに保存されます。匿名のプレイ統計は、設定キーが構成されている場合にのみ収集されます。Do Not Trackを尊重します。',
  'policy.terms_title': '利用規約',
  'policy.terms_body':
    '本ゲームは無料で提供され、アプリ内課金はありません。著作権は各クリエイターに帰属します。料理の手順はゲーム的に簡略化されており、本物のレシピではありません。',
  'policy.accessibility_title': 'アクセシビリティ宣言',
  'policy.accessibility_body':
    'WCAG AAコントラストを目標に設計しています。キーボード操作、prefers-reduced-motion、ステップ読み上げに対応。改善のご提案は歓迎します。',
  'policy.contact': 'hawker-mama@example.com',

  // status
  'status.local_only': 'オフライン保存',
  'status.unlocks_chicken-rice': '★ ラクサが解放！',
  'status.unlocks_laksa': '★ ロティ・プラタが解放！',
  'status.unlocks_prata': '★ チリクラブが解放！',
  'status.unlocks_chili-crab': '★ カヤトーストが解放！',
  'status.unlocks_kaya-toast': '全料理クリア！もう一度遊んでベストを更新しよう。',
};

const en: Dict = {
  'app.title': 'Hawker Mama',
  'app.tagline': 'Cooking with Auntie May',
  'menu.tap_to_start': 'Tap to start',
  'menu.locale_picker': 'Language',
  'menu.settings': 'Settings',
  'menu.leaderboard': 'Scores',
  'menu.back': 'Back',
  'menu.next': 'Next',
  'menu.continue': 'Continue',
  'menu.start_cooking': 'Start cooking',
  'menu.read_culture_first': 'Read culture card first',
  'menu.next_dish': 'Next dish',
  'menu.share': 'Share',
  'menu.read_culture': 'Read culture card',
  'menu.replay': 'Play again',
  'menu.done': "I'm done!",
  'menu.locked': 'Locked',

  'first.welcome_title': 'Welcome to the hawker centre!',
  'first.welcome_body':
    "Cook hawker (street food) dishes with Auntie May. Each one's 2–4 minutes. You'll get a culture card at the end.",
  'first.halal_explainer':
    'Halal mode is off. All five MVP dishes are halal-compatible by default. Toggle anytime in settings.',
  'first.continue': 'Begin',

  'map.title': 'Hawker Centre',
  'daily.title': "Today's challenge",
  'daily.mod_speed': 'Speedrun',
  'daily.mod_no-hints': 'No hints',
  'daily.mod_silent-auntie': 'Silent Auntie',
  'daily.mod_tight-windows': 'Tight scoring',
  'map.unesco_note':
    "Singapore's Hawker Culture is on UNESCO's Intangible Cultural Heritage list (2020).",

  'dish.chicken-rice.name': 'Hainanese Chicken Rice',
  'dish.chicken-rice.name_en': 'Hainanese Chicken Rice',
  'dish.chicken-rice.hook':
    'Hainanese roots, Singapore evolution. Tender poached chicken, fragrant rice.',
  'dish.laksa.name': 'Laksa',
  'dish.laksa.name_en': 'Katong Laksa',
  'dish.laksa.hook':
    'Katong-style laksa. Coconut milk goes in last — keep it from splitting.',
  'dish.prata.name': 'Roti Prata',
  'dish.prata.name_en': 'Roti Prata',
  'dish.prata.hook':
    'Slap, stretch, flick. A Tamil breakfast that became a hawker staple.',
  'dish.chili-crab.name': 'Chili Crab',
  'dish.chili-crab.name_en': 'Chili Crab',
  'dish.chili-crab.hook':
    'Sweet, spicy, with egg ribbons. Mop the sauce with mantou — leave nothing.',
  'dish.kaya-toast.name': 'Kaya Toast',
  'dish.kaya-toast.name_en': 'Kaya Toast & Soft-Boiled Eggs',
  'dish.kaya-toast.hook':
    'Morning at the kopitiam. Toast with kaya, runny eggs with soy and pepper, kopi to chase it.',

  'cr.step1.title': 'Poach the chicken',
  'cr.step1.hint': 'Hold the thermometer in the green band (75–85°C)',
  'cr.step2.title': 'Ice bath',
  'cr.step2.hint': 'Drag the chicken into the ice bowl',
  'cr.step3.title': 'Rice aromatics',
  'cr.step3.hint': 'Tap each glowing ingredient in order',
  'cr.step4.title': 'Pound the sauce',
  'cr.step4.hint': 'Alternate left and right taps on the pestle',
  'cr.step5.title': 'Plate',
  'cr.step5.hint':
    'Place chicken, sauce coverage 60–85%, garnish cucumber and coriander',
  'cr.step5.sauce_label': 'sauce: {{coverage}}% (60–85%)',

  'la.step1.title': 'Bloom the rempah',
  'la.step1.hint': 'Stir in circles in the wok at the right speed',
  'la.step2.title': 'Add in order',
  'la.step2.hint': 'Stock → coconut milk → tau pok (order matters)',
  'la.step2.broth_stable': 'broth stable',
  'la.step2.broth_split': '⚠ broth split — keep stirring',
  'la.step2.stock': 'stock',
  'la.step2.coconut': 'coconut',
  'la.step2.taupok': 'tau pok',
  'la.step3.title': 'Noodle bath',
  'la.step3.hint': 'Lift when the noodles glow — 4–6 second window',
  'la.step4.title': 'Garnish',
  'la.step4.hint': 'Drop prawns, fishcake, sprouts, sambal, laksa leaf',

  'pr.step1.title': 'Knead the dough',
  'pr.step1.hint': 'Pinch outwards with two fingers',
  'pr.step2.title': 'Slap-stretch',
  'pr.step2.hint': 'Swipe left-right to build the thinness meter past 70%',
  'pr.step3.title': 'Flick-flip',
  'pr.step3.hint': 'Swipe up to flick, tap when shadow aligns (3 flips)',
  'pr.step4.title': 'Fold',
  'pr.step4.hint': 'Drag the corners inward',

  'cc.step1.title': 'Pound sambal',
  'cc.step1.hint': 'Alternate taps: chilies, shallots, belacan',
  'cc.step2.title': 'Sear the crab',
  'cc.step2.hint': 'Tap each pulsing joint in sequence',
  'cc.step3.title': 'Egg ribbons',
  'cc.step3.hint': 'Slow circular drag — keep speed in the band',
  'cc.step4.title': 'Plate',
  'cc.step4.hint': 'Crab and mantou on the platter',

  'kt.step1.title': 'Toast the bread',
  'kt.step1.hint': 'Hold to grill, release when golden',
  'kt.step2.title': 'Spread kaya',
  'kt.step2.hint': 'Drag finger across — even spread scores higher',
  'kt.step3.title': 'Soft-boiled egg',
  'kt.step3.hint': 'Tap to crack, double-flick for soy and pepper',
  'kt.step4.title': 'Pour kopi',
  'kt.step4.hint': 'Hold and lift to extend the pour, build froth',

  'hud.step': 'Step',
  'hud.score': 'Score',
  'hud.gold': 'Gold',
  'hud.silver': 'Silver',
  'hud.bronze': 'Bronze',
  'hud.miss': 'Miss',
  'hud.tap_to_continue': 'Tap to continue',

  'complete.title': 'All done!',
  'complete.stars_1': '★☆☆ — nice try',
  'complete.stars_2': '★★☆ — getting there!',
  'complete.stars_3': '★★★ — shiok!',
  'complete.share_text': 'I cooked {{dish}} on Hawker Mama!',

  'settings.title': 'Settings',
  'settings.locale': 'Language',
  'settings.halal': 'Halal mode',
  'settings.halal_help':
    'Plumbing for stretch dishes. The five MVP dishes are halal-compatible.',
  'settings.music': 'Music',
  'settings.sfx': 'Sound effects',
  'settings.voice': "Auntie May's voice",
  'settings.reduced_motion': 'Reduce motion',
  'settings.describe_step': 'Describe current step (a11y)',
  'settings.contact': 'Contact',
  'settings.privacy': 'Privacy policy',
  'settings.terms': 'Terms of use',
  'settings.accessibility': 'Accessibility statement',
  'settings.reset': 'Reset all data',
  'settings.reset_confirm': 'Really reset?',

  'leaderboard.title': 'Scores',
  'leaderboard.local_badge': 'Local scores',
  'leaderboard.empty': "No scores yet. Cook something!",

  'culture.did_you_know': 'Did you know?',
  'culture.sources': 'Sources',

  'aria.step_description': 'Current step: {{step}}',
  'aria.score_announce': 'Score: {{tier}}',

  'auntie.welcome': "Eh come, what we cooking?",
  'auntie.gold': 'Shiok!',
  'auntie.silver': 'Not bad lah.',
  'auntie.bronze': "Can lah.",
  'auntie.miss': 'Walao eh! One more time.',
  'auntie.complete_3': 'Wah, my own grandchild also not as good!',
  'auntie.complete_2': 'Quite good. Next one we go faster.',
  'auntie.complete_1': "Cooking is practice. Don't give up.",

  'cc.chicken-rice.body':
    'Hainanese Chicken Rice traces back to Wenchang chicken on Hainan island, China; Hainanese migrants reshaped it in early-20th-century Singapore. Rice is cooked in chicken fat and stock; three sauces — ginger, chili, dark soy — are standard.',
  'cc.chicken-rice.didyouknow':
    'Tiong Bahru is full of stalls that still do it old-school. Each one balances chicken, rice, and sauce a little differently.',
  'cc.laksa.body':
    "Laksa has Penang, Sarawak and Katong (Peranakan) lineages. Singapore's everyday laksa is Katong-style: coconut-milk and dried-shrimp broth, thick rice noodles cut short so you can spoon them.",
  'cc.laksa.didyouknow': 'Laksa leaf (daun kesum) is not mint — the smell tells.',
  'cc.prata.body':
    'Roti prata came with Tamil migrants. Dough is slapped into translucent layers, cooked on a flat tawa. Variants run into the dozens — egg, cheese, onion. Eaten with curry.',
  'cc.prata.didyouknow':
    'Same root as Indian parotta, evolved its own way in Singapore.',
  'cc.chili-crab.body':
    'Chili crab is credited to Cher Yam Tian, Singapore, 1956. A sweet-spicy sauce of tomato and sambal, finished with egg ribbons. Mop with mantou — leave nothing.',
  'cc.chili-crab.didyouknow':
    'Sweetness and umami carry it more than heat. Crab tomalley goes back into the sauce.',
  'cc.kaya-toast.body':
    'Kaya is a Peranakan jam of coconut milk, eggs, sugar and pandan. At a kopitiam (traditional coffee shop) it comes with soft-boiled eggs and kopi.',
  'cc.kaya-toast.didyouknow':
    "Singapore's Hawker Culture was inscribed on UNESCO's Intangible Cultural Heritage list in 2020.",

  'policy.privacy_title': 'Privacy policy',
  'policy.privacy_body':
    'Hawker Mama collects no personal data. Scores and settings live only on your device. Anonymous play stats are collected only when keys are configured by the operator. We respect Do Not Track.',
  'policy.terms_title': 'Terms of use',
  'policy.terms_body':
    'This game is free with no in-app purchases. Cooking steps are gamified and not real recipes.',
  'policy.accessibility_title': 'Accessibility statement',
  'policy.accessibility_body':
    'Designed to WCAG AA contrast. Keyboard navigation, prefers-reduced-motion, and step description supported. Suggestions welcome.',
  'policy.contact': 'hawker-mama@example.com',

  'status.local_only': 'Saved locally',
  'status.unlocks_chicken-rice': '★ Laksa unlocked!',
  'status.unlocks_laksa': '★ Roti Prata unlocked!',
  'status.unlocks_prata': '★ Chili Crab unlocked!',
  'status.unlocks_chili-crab': '★ Kaya Toast unlocked!',
  'status.unlocks_kaya-toast':
    'All dishes complete! Replay to beat your best.',
};

const tables: Record<Locale, Dict> = { ja, en };

export function t(locale: Locale, key: string, vars?: Record<string, string>): string {
  const dict = tables[locale] ?? tables.ja;
  const fallback = tables.ja[key] ?? key;
  let str = dict[key] ?? fallback;
  if (vars) {
    for (const k of Object.keys(vars)) {
      str = str.split(`{{${k}}}`).join(vars[k]);
    }
  }
  return str;
}
