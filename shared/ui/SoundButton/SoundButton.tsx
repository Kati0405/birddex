'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import soundWaveImg from '@/components/icons/ui/sound-wave.png';

interface Props {
  soundUrl?: string;
}

export default function SoundButton({ soundUrl }: Props) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!soundUrl) {
    return (
      <div className="relative group">
        <Image
          src={soundWaveImg}
          alt=""
          width={18}
          height={18}
          className="brightness-0 opacity-20 select-none"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute top-full mt-1.5 right-0
            opacity-0 group-hover:opacity-100 transition-opacity duration-150
            bg-foreground/80 text-background text-[8px] tracking-wide uppercase
            px-1.5 py-0.5 rounded-sm whitespace-nowrap z-20"
        >
          No recording
        </span>
      </div>
    );
  }

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) {
      audioRef.current = new Audio(soundUrl);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={toggle}
        className="transition-opacity hover:opacity-70 active:scale-90"
        aria-label={playing ? 'Stop bird call' : 'Play bird call'}
      >
        <Image
          src={soundWaveImg}
          alt=""
          width={18}
          height={18}
          className={`brightness-0 ${playing ? 'opacity-100' : 'opacity-80'}`}
        />
      </button>
      <span
        className="pointer-events-none absolute top-full mt-1.5 right-0
          opacity-0 group-hover:opacity-100 transition-opacity duration-150
          bg-foreground/80 text-background text-[8px] tracking-wide uppercase
          px-1.5 py-0.5 rounded-sm whitespace-nowrap z-20"
      >
        {playing ? 'Stop' : 'Play call'}
      </span>
    </div>
  );
}
