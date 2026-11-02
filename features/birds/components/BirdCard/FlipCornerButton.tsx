import flipOverIcon from '@/entities/bird-icons/ui/flipover.svg';

export default function FlipCornerButton({ frameColor }: { frameColor: string }) {
  const mask = `url(${flipOverIcon.src}) center / contain no-repeat`;
  return (
    <button
      type='button'
      aria-label='Flip card'
      title='Click card to flip'
      className='absolute bottom-0 right-0 flex h-7 w-7 sm:h-5 sm:w-5 items-center justify-center rounded-tl-lg cursor-pointer transition-[filter] hover:brightness-110 active:brightness-90'
      style={{ background: frameColor }}
    >
      <span
        aria-hidden
        className='block h-4 w-4 sm:h-3 sm:w-3 bg-card'
        style={{ mask, WebkitMask: mask }}
      />
    </button>
  );
}
