import Image from 'next/image';
import type { StaticImageData } from 'next/image';

type Props = {
  imageSrc?: StaticImageData;
  emoji?: string;
  label?: string;
  size?: number;
  bgColor?: string;
};

export default function HexIcon({
  imageSrc,
  emoji,
  label,
  size = 28,
  bgColor = 'rgba(42,24,8,0.13)',
}: Props) {
  const innerSize = Math.round(size * 0.62);

  return (
    <div className="relative group flex items-center justify-center shrink-0">
      <div
        className="flex items-center justify-center"
        style={{
          width: size,
          height: size,
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          background: bgColor,
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
        <span
          className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2
            opacity-0 group-hover:opacity-100 transition-opacity duration-150
            bg-[#2a1808cc] text-[#faf6ed] text-[8px] tracking-wide uppercase
            px-1.5 py-0.5 rounded-sm whitespace-nowrap z-20"
        >
          {label}
        </span>
      )}
    </div>
  );
}
