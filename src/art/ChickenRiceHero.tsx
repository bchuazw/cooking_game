const base = (import.meta.env.BASE_URL as string) ?? '/';

export function ChickenRiceHero({
  className = '',
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative mx-auto ${className}`}
      style={{
        aspectRatio: '360 / 210',
        maxWidth: compact ? 220 : 340,
        width: '100%',
      }}
      aria-hidden
    >
      <img
        src={`${base}assets/gameplay/plate-rice-640.webp`}
        alt=""
        draggable={false}
        className="absolute left-1/2 top-[50%] w-[96%] -translate-x-1/2 -translate-y-1/2 select-none"
        style={{ imageRendering: 'auto' }}
      />
      <img
        src={`${base}assets/gameplay/chicken-slices-512.webp`}
        alt=""
        draggable={false}
        className="absolute left-[29%] top-[26%] w-[42%] select-none drop-shadow-[0_18px_16px_rgba(58,45,36,0.24)]"
        style={{ imageRendering: 'auto' }}
      />
      <img
        src={`${base}assets/gameplay/garnish-320.webp`}
        alt=""
        draggable={false}
        className="absolute left-[58%] top-[46%] w-[28%] select-none drop-shadow-[0_18px_16px_rgba(58,45,36,0.24)]"
        style={{ imageRendering: 'auto' }}
      />
    </div>
  );
}
