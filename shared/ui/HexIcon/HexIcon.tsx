import Image from 'next/image';
import type { StaticImageData } from 'next/image';

type Props = {
  imageSrc?: StaticImageData;
  emoji?: string;
  label?: string;
  size?: number;
  bgColor?: string;
  tooltipPosition?: 'top' | 'bottom';
  onClick?: () => void;
  active?: boolean;
};

export default function HexIcon({
  imageSrc,
  emoji,
  label,
  size = 28,
  bgColor = 'rgba(42,24,8,0.13)',
  tooltipPosition = 'top',
  onClick,
  active = false,
}: Props) {
  const innerSize = Math.round(size * 0.62);
  const clickable = !!onClick;

  return (
    <div className="relative group flex flex-col items-center shrink-0">
      <div
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-label={clickable ? `Filter by ${label}` : undefined}
        aria-pressed={clickable ? active : undefined}
        onClick={
          clickable
            ? (e) => {
                e.stopPropagation();
                onClick();
              }
            : undefined
        }
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onClick();
                }
              }
            : undefined
        }
        className={clickable ? 'flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer' : 'flex items-center justify-center'}
        style={{
          width: size,
          height: size,
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          background: bgColor,
          outline: clickable && active ? '2px solid currentColor' : undefined,
          outlineOffset: clickable && active ? '1px' : undefined,
        }}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={label ?? ''}
            width={innerSize}
            height={innerSize}
            className="object-contain"
          />
        ) : (
          <span style={{ fontSize: innerSize * 0.9, lineHeight: 1 }}>{emoji}</span>
        )}
      </div>

      {label && (
        <>
          {/* hover tooltip — desktop */}
          <span
            className={`pointer-events-none absolute left-1/2 -translate-x-1/2
              opacity-0 group-hover:opacity-100 transition-opacity duration-150
              bg-[#2a1808cc] text-[#faf6ed] text-[8px] tracking-wide uppercase
              px-1.5 py-0.5 rounded-sm whitespace-nowrap z-20 hidden sm:block
              ${tooltipPosition === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5'}`}
          >
            {label}
          </span>
          {/* inline label — mobile */}
          <span className="sm:hidden mt-0.5 text-[7px] uppercase tracking-wide text-muted-foreground text-center leading-tight max-w-[48px] truncate font-mono">
            {label}
          </span>
        </>
      )}
    </div>
  );
}
