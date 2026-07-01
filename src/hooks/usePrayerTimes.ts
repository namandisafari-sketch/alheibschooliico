import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export interface PrayerTime {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  imsak?: string;
  sunrise?: string;
  sunset?: string;
  midnight?: string;
}

export interface PrayerStatus {
  currentPrayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | null;
  nextPrayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | null;
  timeUntilNext: number; // in minutes
  isWithinPrayerTime: boolean;
  prayerTimeMinutes: number; // prayer window in minutes (typically 15-30)
}

const PRAYER_ORDER: Array<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'> = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

// Get prayer time settings from localStorage with defaults
const getPrayerSettings = () => {
  try {
    const saved = localStorage.getItem('prayerTimesSettings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error loading prayer settings:', e);
  }
  // Default: Kampala, Uganda
  return {
    latitude: 0.3167,
    longitude: 32.5825,
    prayerTimeWindowMinutes: 20,
  };
};

export const usePrayerTimes = (customLatitude?: number, customLongitude?: number) => {
  const [prayerStatus, setPrayerStatus] = useState<PrayerStatus>({
    currentPrayer: null,
    nextPrayer: null,
    timeUntilNext: 0,
    isWithinPrayerTime: false,
    prayerTimeMinutes: 20,
  });

  const settings = getPrayerSettings();
  const latitude = customLatitude ?? settings.latitude;
  const longitude = customLongitude ?? settings.longitude;
  const prayerWindow = settings.prayerTimeWindowMinutes ?? 20;

  const today = new Date();
  const dateString = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

  const { data: prayerTimes, isLoading, error } = useQuery({
    queryKey: ['prayer-times', dateString, latitude, longitude],
    queryFn: async (): Promise<PrayerTime> => {
      try {
        const response = await fetch(
          `https://api.aladhan.com/v1/timings/${dateString}?latitude=${latitude}&longitude=${longitude}&method=2&school=0`
        );
        if (!response.ok) throw new Error('Failed to fetch prayer times');
        const data = await response.json();
        const timings = data.data.timings;
        return {
          fajr: timings.Fajr,
          dhuhr: timings.Dhuhr,
          asr: timings.Asr,
          maghrib: timings.Maghrib,
          isha: timings.Isha,
          sunrise: timings.Sunrise,
          sunset: timings.Sunset,
          imsak: timings.Imsak,
          midnight: timings.Midnight,
        };
      } catch (err) {
        console.error('Error fetching prayer times:', err);
        throw err;
      }
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 2,
  });

  // Update prayer status every minute
  useEffect(() => {
    if (!prayerTimes) return;

    const updateStatus = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const timeToMinutes = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const prayerMinutes: Record<string, number> = {
        fajr: timeToMinutes(prayerTimes.fajr),
        dhuhr: timeToMinutes(prayerTimes.dhuhr),
        asr: timeToMinutes(prayerTimes.asr),
        maghrib: timeToMinutes(prayerTimes.maghrib),
        isha: timeToMinutes(prayerTimes.isha),
      };

      let currentPrayer: typeof prayerStatus.currentPrayer = null;
      let nextPrayer: typeof prayerStatus.nextPrayer = null;
      let isWithinWindow = false;

      // Check if within any prayer time window
      for (const prayer of PRAYER_ORDER) {
        const prayerTime = prayerMinutes[prayer];
        if (currentMinutes >= prayerTime - prayerWindow && currentMinutes <= prayerTime + prayerWindow) {
          currentPrayer = prayer as any;
          isWithinWindow = true;
          break;
        }
      }

      // Find next prayer
      for (const prayer of PRAYER_ORDER) {
        const prayerTime = prayerMinutes[prayer];
        if (currentMinutes < prayerTime) {
          nextPrayer = prayer as any;
          break;
        }
      }

      // If no prayer found today, next is Fajr tomorrow
      if (!nextPrayer && currentMinutes > prayerMinutes.isha) {
        nextPrayer = 'fajr';
      }

      const nextPrayerTime = nextPrayer ? prayerMinutes[nextPrayer] : prayerMinutes.fajr + 24 * 60;
      const timeUntilNext = Math.max(0, nextPrayerTime - currentMinutes);

      setPrayerStatus({
        currentPrayer,
        nextPrayer,
        timeUntilNext,
        isWithinPrayerTime: isWithinWindow,
        prayerTimeMinutes: prayerWindow,
      });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [prayerTimes, prayerWindow]);

  return {
    prayerTimes,
    prayerStatus,
    isLoading,
    error,
    isPrayerTime: prayerStatus.isWithinPrayerTime,
  };
};
