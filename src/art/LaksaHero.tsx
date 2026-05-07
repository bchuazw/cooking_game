const base = (import.meta.env.BASE_URL as string) ?? '/';

export function LaksaHero({
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
        aspectRatio: '760 / 573',
        maxWidth: compact ? 220 : 340,
        width: '100%',
      }}
      aria-hidden
    >
      <img
        src={`${base}assets/gameplay/laksa-bowl-700.webp`}
        alt=""
        draggable={false}
        className="food-breathe absolute inset-0 h-full w-full select-none object-contain drop-shadow-[0_18px_18px_rgba(58,45,36,0.24)]"
        style={{ imageRendering: 'auto' }}
      />
    </div>
  );
}
