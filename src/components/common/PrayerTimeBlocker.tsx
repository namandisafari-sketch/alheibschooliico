import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Zap, Clock, Moon } from 'lucide-react';
import { format } from 'date-fns';
import { AdhanPlayer } from './AdhanPlayer';
import { cn } from '@/lib/utils';

interface PrayerTimeBlockerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const PRAYER_NAMES: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  fajr: { name: 'Fajr (Dawn)', icon: <Moon className="h-6 w-6" />, color: 'text-blue-600' },
  dhuhr: { name: 'Dhuhr (Noon)', icon: <Zap className="h-6 w-6" />, color: 'text-yellow-600' },
  asr: { name: 'Asr (Afternoon)', icon: <Zap className="h-6 w-6" />, color: 'text-orange-600' },
  maghrib: { name: 'Maghrib (Sunset)', icon: <Zap className="h-6 w-6" />, color: 'text-red-600' },
  isha: { name: 'Isha (Night)', icon: <Moon className="h-6 w-6" />, color: 'text-indigo-600' },
};

export const PrayerTimeBlocker = ({ isOpen, onClose }: PrayerTimeBlockerProps) => {
  const { isPrayerTime, prayerStatus, prayerTimes } = usePrayerTimes();

  const open = isOpen ?? isPrayerTime;
  const currentPrayerInfo = prayerStatus.currentPrayer ? PRAYER_NAMES[prayerStatus.currentPrayer] : null;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !newOpen && onClose?.()}>
      <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl p-8">
        <div className="space-y-8 text-center">
          {/* Adhan Animation */}
          <div className="flex justify-center">
            <div className="relative h-24 w-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20 animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 opacity-30 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="relative z-10 h-16 w-16 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg">
                {currentPrayerInfo?.icon || <Clock className="h-8 w-8" />}
              </div>
            </div>
          </div>

          {/* Title and Message */}
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-3">
              {currentPrayerInfo?.name || 'Prayer Time'}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              The library is temporarily closed during congregational prayers as part of our Islamic school values.
            </p>
          </div>

          {/* Prayer Info */}
          {prayerTimes && prayerStatus.currentPrayer && (
            <Card className="p-6 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Prayer Time</p>
                <p className={cn(
                  'text-2xl font-black font-mono',
                  currentPrayerInfo?.color
                )}>
                  {prayerTimes[prayerStatus.currentPrayer]}
                </p>
                <p className="text-xs text-slate-500 mt-3">
                  Please join us in the prayer hall for Jamaah (congregational prayer).
                </p>
              </div>
            </Card>
          )}

          {/* Next Prayer */}
          {prayerStatus.nextPrayer && prayerStatus.timeUntilNext > 0 && (
            <Card className="p-4 border-slate-100 bg-slate-50">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Next Prayer</p>
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-slate-600" />
                <p className="text-sm font-bold text-slate-700">
                  {PRAYER_NAMES[prayerStatus.nextPrayer]?.name} in {prayerStatus.timeUntilNext} minutes
                </p>
              </div>
            </Card>
          )}

          {/* Adhan Player */}
          <AdhanPlayer showButton={true} autoPlay={false} className="flex justify-center w-full" />

          {/* Inspirational Text */}
          <div className="text-center">
            <p className="text-xs text-slate-500 italic font-medium">
              "Indeed, prayer prevents immorality and wrongdoing..." — Quran 29:45
            </p>
          </div>

          {/* Close Button */}
          {onClose && (
            <Button
              onClick={onClose}
              className="w-full h-12 rounded-2xl bg-slate-900 text-white font-bold uppercase tracking-widest"
            >
              {isPrayerTime ? 'Proceed to System (Ignore Reminder)' : 'Return to Library'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrayerTimeBlocker;
