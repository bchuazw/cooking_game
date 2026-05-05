import { useApp } from '../state/store';
import { useT } from '../i18n/useT';
import type { DishId } from '../types';

export function Leaderboard({ onBack }: { onBack: () => void }) {
  const t = useT();
  const results = useApp((s) => s.results);

  const grouped = new Map<DishId, typeof results>();
  for (const r of results) {
    if (!grouped.has(r.dishId)) grouped.set(r.dishId, []);
    grouped.get(r.dishId)!.push(r);
  }

  return (
    <div className="absolute inset-0 bg-marble overflow-y-auto pb-12">
      <header className="sticky top-0 z-10 bg-marble flex items-center px-4 py-3 border-b border-outline/20">
        <button className="btn-ghost text-sm py-1 px-3" onClick={onBack} aria-label={t('menu.back')}>← {t('menu.back')}</button>
        <h2 className="ml-4 text-lg font-display font-bold">{t('leaderboard.title')}</h2>
        <span className="ml-auto text-[10px] px-2 py-1 rounded bg-tile-teal text-white">
          {t('leaderboard.local_badge')}
        </span>
      </header>

      <div className="p-4 space-y-4">
        {results.length === 0 && <p className="text-outline/70">{t('leaderboard.empty')}</p>}
        {Array.from(grouped.entries()).map(([dishId, rs]) => {
          const top = [...rs].sort((a, b) => b.totalScore - a.totalScore).slice(0, 5);
          return (
            <div key={dishId} className="surface p-3">
              <div className="font-display font-bold mb-2">{t(`dish.${dishId}.name`)}</div>
              <ol className="text-sm space-y-1">
                {top.map((r, i) => (
                  <li key={r.completedAt} className="flex justify-between gap-2">
                    <span className="text-outline/70">#{i + 1}</span>
                    <span>{'★'.repeat(r.stars)}{'☆'.repeat(3 - r.stars)}</span>
                    <span className="text-outline/70 ml-auto">
                      {new Date(r.completedAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </div>
  );
}
