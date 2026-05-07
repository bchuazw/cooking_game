import { useEffect, useRef } from 'react';
import { PixelAuntie } from '../art/PixelAuntie';
import { useT } from '../i18n/useT';
import type { DishResult } from '../types';
import { say } from '../audio/animalese';
import { sfx } from '../audio/audio';
import { track } from '../telemetry';
import { DishBackplate } from '../art/Backplates';

export function DishComplete({
  result,
  onReadCulture,
  onNext,
  onReplay,
}: {
  result: DishResult;
  onReadCulture: () => void;
  onNext: () => void;
  onReplay: () => void;
}) {
  const t = useT();
  const shareRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    sfx.star(result.stars === 0 ? 1 : (result.stars as 1 | 2 | 3));
    const id = setTimeout(() => void say(t(`auntie.complete_${Math.max(1, result.stars)}`)), 600);
    return () => clearTimeout(id);
  }, [result.stars, t]);

  const mood = result.stars >= 3 ? 'dish_perfect' : 'cheering';

  // Build a share-card image from canvas: title + dish + stars + score
  const buildShareCard = (): string | null => {
    const cv = shareRef.current ?? document.createElement('canvas');
    cv.width = 800; cv.height = 800;
    const ctx = cv.getContext('2d');
    if (!ctx) return null;
    // background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, 800);
    bg.addColorStop(0, '#FFE7BD');
    bg.addColorStop(1, '#F4EFE6');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 800, 800);
    // tile divider
    ctx.fillStyle = '#2BA59D';
    ctx.fillRect(0, 130, 800, 16);
    // sambal sign
    ctx.fillStyle = '#7E2113';
    ctx.fillRect(120, 30, 560, 88);
    ctx.fillStyle = '#D8432B';
    ctx.fillRect(124, 34, 552, 80);
    ctx.font = '700 56px "M PLUS Rounded 1c", sans-serif';
    ctx.fillStyle = '#FFF7E8';
    ctx.textAlign = 'center';
    ctx.fillText('Hawker Mama', 400, 92);
    // dish title
    ctx.font = '700 48px "Noto Sans JP", sans-serif';
    ctx.fillStyle = '#3A2D24';
    ctx.fillText(t(`dish.${result.dishId}.name`), 400, 220);
    // stars (large)
    const stars = Math.max(1, result.stars);
    ctx.font = '700 96px "M PLUS Rounded 1c", sans-serif';
    ctx.fillStyle = '#E8B83A';
    ctx.fillText('★'.repeat(stars) + '☆'.repeat(3 - stars), 400, 360);
    // tagline
    ctx.font = '500 28px "Noto Sans JP", sans-serif';
    ctx.fillStyle = '#3A2D24';
    ctx.fillText(t(`auntie.complete_${stars}`), 400, 440);
    // score breakdown
    ctx.font = '500 24px "Noto Sans JP", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#3A2D24';
    result.steps.forEach((s, i) => {
      ctx.fillText(s.stepId.replace(/_/g, ' '), 200, 520 + i * 36);
      ctx.textAlign = 'right';
      ctx.fillStyle = ({ gold: '#A8772D', silver: '#777', bronze: '#A65A2D', miss: '#999' } as Record<string, string>)[s.tier] || '#3A2D24';
      ctx.fillText(t(`hud.${s.tier}`), 600, 520 + i * 36);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#3A2D24';
    });
    // combo
    if (result.maxCombo && result.maxCombo >= 2) {
      ctx.textAlign = 'center';
      ctx.font = '700 32px "M PLUS Rounded 1c", sans-serif';
      ctx.fillStyle = '#D8432B';
      ctx.fillText(`MAX COMBO ${result.maxCombo}×`, 400, 720);
    }
    // footer
    ctx.textAlign = 'center';
    ctx.font = '400 18px "Noto Sans JP", sans-serif';
    ctx.fillStyle = '#3A2D24';
    ctx.fillText('bchuazw.github.io/cooking_game', 400, 770);
    return cv.toDataURL('image/png');
  };

  const onShare = async () => {
    const text = t('complete.share_text', { dish: t(`dish.${result.dishId}.name`) });
    track('share_card_generated', { dish_id: result.dishId });
    const dataUrl = buildShareCard();
    // Try Web Share API with file
    if (dataUrl && navigator.canShare && (window as Window & typeof globalThis).fetch) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `hawker-mama-${result.dishId}.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: t('app.title'), text, files: [file] });
          return;
        }
      } catch {/* */}
    }
    // Fallback: download the image
    if (dataUrl) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `hawker-mama-${result.dishId}.png`;
      a.click();
      return;
    }
    // Final fallback: clipboard
    try {
      await navigator.clipboard.writeText(text);
      alert(t('menu.share') + ' ✓');
    } catch {/* */}
  };

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden pixel-art">
      <DishBackplate dishId={result.dishId} wash={0.42} />
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="pixel-panel w-full max-w-sm px-4 py-5">
        <PixelAuntie mood={mood} size={170} />
        <h2 className="text-2xl font-display font-bold mt-3">{t('complete.title')}</h2>
        <p className="text-3xl font-display font-bold mt-2 text-kaya-shade">
          {t(`complete.stars_${Math.max(1, result.stars)}`)}
        </p>

        <div className="surface p-3 mt-5 w-full max-w-xs">
          <div className="text-xs text-outline/70 mb-1">{t(`dish.${result.dishId}.name`)}</div>
          <ul className="text-sm space-y-1">
            {result.steps.map((s) => (
              <li key={s.stepId} className="flex justify-between">
                <span>{s.stepId.replace(/_/g, ' ')}</span>
                <span className="text-outline/70">{t(`hud.${s.tier}`)}</span>
              </li>
            ))}
          </ul>
          {result.maxCombo && result.maxCombo >= 2 && (
            <div className="mt-2 text-center text-sm font-display font-bold text-sambal">
              {result.maxCombo}× COMBO
            </div>
          )}
        </div>
        <canvas ref={shareRef} width={800} height={800} className="hidden" />
        </div>
      </div>

      <div className="relative z-10 px-5 pb-6 space-y-2">
        <button className="btn-primary w-full" onClick={onReadCulture}>{t('menu.read_culture')}</button>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" onClick={onReplay}>{t('menu.replay')}</button>
          <button className="btn-ghost" onClick={onShare}>{t('menu.share')}</button>
        </div>
        <button className="btn-ghost w-full" onClick={onNext}>{t('menu.back')}</button>
      </div>
    </div>
  );
}
