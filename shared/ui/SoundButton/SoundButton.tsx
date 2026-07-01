'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Pause } from 'lucide-react';
import soundWaveImg from '@/components/icons/ui/sound-wave.png';

interface Props {
  soundUrl?: string;
}

export default function SoundButton({ soundUrl }: Props) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const circleBase = 'relative group flex items-center justify-center rounded-full transition-all';
  const size = { width: 26, height: 26 };
  const imgSize = 13;

  if (!soundUrl) {
    return (
      <div
        className={circleBase}
        style={{ ...size, background: 'rgba(42,24,8,0.08)', border: '1px solid rgba(42,24,8,0.15)' }}
      >
        <Image src={soundWaveImg} alt="" width={imgSize} height={imgSize} className="brightness-0 opacity-20 select-none" aria-hidden />
        <span className="pointer-events-none absolute top-full mt-1.5 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-foreground/80 text-background text-[8px] tracking-wide uppercase px-1.5 py-0.5 rounded-sm whitespace-nowrap z-20">
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
        className={`${circleBase} hover:opacity-80 active:scale-90`}
        style={{
          ...size,
          background: playing ? 'rgba(42,24,8,0.18)' : 'rgba(42,24,8,0.08)',
          border: `1px solid ${playing ? 'rgba(42,24,8,0.35)' : 'rgba(42,24,8,0.15)'}`,
        }}
        aria-label={playing ? 'Stop bird call' : 'Play bird call'}
      >
        {playing ? (
          <Pause size={imgSize} className="brightness-0 opacity-100 fill-current" strokeWidth={0} />
        ) : (
          <Image
            src={soundWaveImg}
            alt=""
            width={imgSize}
            height={imgSize}
            className="brightness-0 opacity-55"
          />
        )}
      </button>
      <span className="pointer-events-none absolute top-full mt-1.5 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-foreground/80 text-background text-[8px] tracking-wide uppercase px-1.5 py-0.5 rounded-sm whitespace-nowrap z-20">
        {playing ? 'Stop' : 'Play call'}
      </span>
    </div>
  );
}
