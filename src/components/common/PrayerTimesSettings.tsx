import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Save } from 'lucide-react';

interface PrayerTimesSettingsProps {
  onSave?: (settings: PrayerTimesSettings) => void;
}

export interface PrayerTimesSettings {
  schoolName: string;
  latitude: number;
  longitude: number;
  timezone: string;
  enableAdhan: boolean;
  adhanVolume: number;
  prayerTimeWindowMinutes: number;
}

const DEFAULT_SETTINGS: PrayerTimesSettings = {
  schoolName: 'Al-Heiib Islamic School',
  latitude: 0.3167, // Kampala, Uganda
  longitude: 32.5825,
  timezone: 'Africa/Kampala',
  enableAdhan: true,
  adhanVolume: 0.7,
  prayerTimeWindowMinutes: 20,
};

export const PrayerTimesSettings = ({ onSave }: PrayerTimesSettingsProps) => {
  const [settings, setSettings] = useState<PrayerTimesSettings>(() => {
    const saved = localStorage.getItem('prayerTimesSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('prayerTimesSettings', JSON.stringify(settings));
      onSave?.(settings);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Prayer Times Configuration</CardTitle>
            <CardDescription>Customize your school's prayer time settings</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert>
          <AlertDescription className="text-sm">
            Prayer times are fetched daily from the Al-Adhan API for your school location. The library will be inaccessible during the 5 daily congregational prayers: Fajr, Dhuhr, Asr, Maghrib, and Isha.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          {/* School Location */}
          <div className="md:col-span-2">
            <Label htmlFor="schoolName">School Name</Label>
            <Input
              id="schoolName"
              value={settings.schoolName}
              onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
              placeholder="e.g., Al-Heiib Islamic School"
              className="mt-2"
            />
          </div>

          {/* Latitude */}
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="0.0001"
              value={settings.latitude}
              onChange={(e) => setSettings({ ...settings, latitude: parseFloat(e.target.value) })}
              placeholder="0.3167"
              className="mt-2"
            />
            <p className="text-xs text-slate-500 mt-1">Current: {settings.latitude.toFixed(4)}</p>
          </div>

          {/* Longitude */}
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="0.0001"
              value={settings.longitude}
              onChange={(e) => setSettings({ ...settings, longitude: parseFloat(e.target.value) })}
              placeholder="32.5825"
              className="mt-2"
            />
            <p className="text-xs text-slate-500 mt-1">Current: {settings.longitude.toFixed(4)}</p>
          </div>

          {/* Timezone */}
          <div className="md:col-span-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Africa/Kampala">Africa/Kampala (Uganda)</option>
              <option value="Africa/Nairobi">Africa/Nairobi (Kenya)</option>
              <option value="Africa/Lagos">Africa/Lagos (Nigeria)</option>
              <option value="Asia/Dubai">Asia/Dubai (UAE)</option>
              <option value="Europe/London">Europe/London (UK)</option>
              <option value="America/New_York">America/New_York (USA)</option>
            </select>
          </div>

          {/* Prayer Window */}
          <div>
            <Label htmlFor="prayerWindow">Prayer Time Window (minutes)</Label>
            <Input
              id="prayerWindow"
              type="number"
              min="5"
              max="60"
              value={settings.prayerTimeWindowMinutes}
              onChange={(e) => setSettings({ ...settings, prayerTimeWindowMinutes: parseInt(e.target.value) })}
              className="mt-2"
            />
            <p className="text-xs text-slate-500 mt-1">Library blocked from {settings.prayerTimeWindowMinutes} min before to {settings.prayerTimeWindowMinutes} min after each prayer</p>
          </div>

          {/* Adhan Volume */}
          <div>
            <Label htmlFor="adhanVolume">Adhan Volume</Label>
            <div className="flex items-center gap-3 mt-2">
              <input
                id="adhanVolume"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.adhanVolume}
                onChange={(e) => setSettings({ ...settings, adhanVolume: parseFloat(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm font-bold w-12 text-right">{Math.round(settings.adhanVolume * 100)}%</span>
            </div>
          </div>

          {/* Enable Adhan */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableAdhan}
                onChange={(e) => setSettings({ ...settings, enableAdhan: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700">Enable in-app Adhan call to prayer</span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Prayer Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

export const usePrayerTimesSettings = (): PrayerTimesSettings => {
  const saved = localStorage.getItem('prayerTimesSettings');
  return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
};

export default PrayerTimesSettings;
