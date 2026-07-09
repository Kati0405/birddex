const QUALITY_LABELS: Record<number, string> = {
  1: 'Brief glance',
  2: 'Partial view',
  3: 'Good view',
  4: 'Great view',
  5: 'Excellent encounter',
};

const SIZE_CLASSES = {
  sm: 'w-3 h-3 sm:w-2 sm:h-2',
  xs: 'w-2.5 h-2.5 sm:w-1.5 sm:h-1.5',
  list: 'w-2.5 h-2.5',
};

interface ObservationQualityStarsProps {
  rating: number;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export default function ObservationQualityStars({
  rating,
  size = 'sm',
  className = 'text-current',
}: ObservationQualityStarsProps) {
  return (
    <div className={`flex gap-px ${className}`} title={QUALITY_LABELS[rating]}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className={SIZE_CLASSES[size]} aria-hidden="true">
          <path
            d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.24l-4.94 2.46.94-5.49-4-3.9 5.53-.8z"
            fill={i <= rating ? 'currentColor' : 'transparent'}
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
            style={{ opacity: i <= rating ? 1 : 0.3 }}
          />
        </svg>
      ))}
    </div>
  );
}
