import { useEffect, useRef, useState } from 'react';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { Button } from '@/components/ui/button';
import { Volume2, Volume, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

const ADHAN_AUDIO_URL = 'https://www.zekr.org/media/audio/adhans/adhan.mp3';

interface AdhanPlayerProps {
  showButton?: boolean;
  autoPlay?: boolean;
  className?: string;
}

export const AdhanPlayer = ({ showButton = true, autoPlay = false, className = '' }: AdhanPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const { prayerStatus } = usePrayerTimes();
  const playedAdhanRef = useRef<string | null>(null);

  // Auto-play Adhan when prayer time starts
  useEffect(() => {
    if (!autoPlay) return;

    const prayerToday = `${new Date().toDateString()}-${prayerStatus.currentPrayer}`;
    
    if (prayerStatus.currentPrayer && playedAdhanRef.current !== prayerToday && audioRef.current) {
      playAdhan();
      playedAdhanRef.current = prayerToday;
    }
  }, [prayerStatus.currentPrayer, autoPlay]);

  const playAdhan = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = volume;
      audioRef.current.play().catch(err => console.error('Error playing Adhan:', err));
      setIsPlaying(true);
    }
  };

  const stopAdhan = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <audio
        ref={audioRef}
        src={ADHAN_AUDIO_URL}
        onEnded={() => setIsPlaying(false)}
        crossOrigin="anonymous"
      />

      {showButton && (
        <>
          <Button
            size="sm"
            variant={isPlaying ? 'destructive' : 'default'}
            onClick={isPlaying ? stopAdhan : playAdhan}
            className="gap-2"
          >
            {isPlaying ? (
              <>
                <VolumeX className="h-4 w-4" />
                Stop Adhan
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4" />
                Play Adhan
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Volume className="h-4 w-4 text-muted-foreground" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AdhanPlayer;
