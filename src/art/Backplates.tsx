import type { DishId } from '../types';

const base = (import.meta.env.BASE_URL as string) ?? '/';

const filenames: Record<DishId, string> = {
  'chicken-rice': 'chicken-rice-pixel.webp',
  laksa: 'laksa-pixel.webp',
  prata: 'prata-pixel.webp',
  'chili-crab': 'chili-crab-pixel.webp',
  'kaya-toast': 'kaya-toast-pixel.webp',
};

export function DishBackplate({
  dishId,
  wash = 0.18,
  vignette = true,
}: {
  dishId: DishId;
  wash?: number;
  vignette?: boolean;
}) {
  const src = `${base}assets/backplates/${filenames[dishId]}`;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover pixel-art"
        decoding="async"
        fetchPriority="high"
        draggable={false}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            `linear-gradient(180deg, rgba(244,239,230,${wash * 0.55}) 0%, rgba(244,239,230,${wash}) 38%, rgba(244,239,230,${wash * 1.6}) 100%)`,
        }}
      />
      {vignette && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 46%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 42%, rgba(58,45,36,0.14) 100%)',
          }}
        />
      )}
    </div>
  );
}
