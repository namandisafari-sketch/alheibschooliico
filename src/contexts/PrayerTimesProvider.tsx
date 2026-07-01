import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { PrayerTimeBlocker } from '@/components/common/PrayerTimeBlocker';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';

interface PrayerTimesContextType {
  isPrayerTime: boolean;
  isLoading: boolean;
  dismissed: boolean;
  setDismissed: (dismissed: boolean) => void;
}

const PrayerTimesContext = createContext<PrayerTimesContextType | undefined>(undefined);

export const usePrayerTimesContext = () => {
  const context = useContext(PrayerTimesContext);
  if (!context) {
    throw new Error('usePrayerTimesContext must be used within PrayerTimesProvider');
  }
  return context;
};

export const PrayerTimesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isPrayerTime, isLoading, prayerStatus } = usePrayerTimes();
  const [dismissed, setDismissed] = useState(false);
  const [lastPrayer, setLastPrayer] = useState<string | null>(null);

  // Reset dismissal if a new prayer window starts
  useEffect(() => {
    if (isPrayerTime && prayerStatus.currentPrayer !== lastPrayer) {
      setDismissed(false);
      setLastPrayer(prayerStatus.currentPrayer);
    } else if (!isPrayerTime) {
      setDismissed(false);
      setLastPrayer(null);
    }
  }, [isPrayerTime, prayerStatus.currentPrayer, lastPrayer]);

  return (
    <PrayerTimesContext.Provider value={{ isPrayerTime, isLoading, dismissed, setDismissed }}>
      {/* Global Prayer Time Blocker - applies to all pages */}
      <PrayerTimeBlocker 
        isOpen={isPrayerTime && !dismissed} 
        onClose={() => setDismissed(true)} 
      />
      {children}
    </PrayerTimesContext.Provider>
  );
};

export default PrayerTimesProvider;
