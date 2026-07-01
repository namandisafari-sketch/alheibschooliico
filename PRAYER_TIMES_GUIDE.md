# Islamic Prayer Times Integration - Library Module

## Overview

The Al-Heiib School Library module has been enhanced with Islamic prayer times integration, allowing the system to automatically restrict library access during the five daily congregational prayers (Fajr, Dhuhr, Asr, Maghrib, and Isha).

## Features

### 1. **Automatic Prayer Time Detection**
- Fetches daily prayer times from the free Al-Adhan API
- No API key required - uses public endpoint
- Automatically updated daily based on school location
- Displays accurate prayer times in Uganda (Kampala coordinates by default)

### 2. **Smart Access Control**
- Library becomes inaccessible during prayer time windows
- Configurable prayer time window (default: 20 minutes before and after each prayer)
- Visual modal blocker prevents access attempts during prayers
- Graceful overlay prevents interaction with library content

### 3. **In-App Adhan (Call to Prayer)**
- Optional in-app audio notification using free Adhan audio
- Volume control for users
- Manually triggered or automatic (configurable)
- Uses high-quality Islamic Adhan audio from Zekr.org

### 4. **Prayer Times Dashboard**
- Real-time display of all 5 daily prayers
- Visual indicator of current active prayer
- Countdown to next prayer time
- Color-coded prayer status (Green = currently praying, Blue = upcoming)

### 5. **Culturally Aware Design**
- Islamic prayer times prominently displayed
- Encourages congregational prayer participation
- Educational value for students learning Islamic practices
- Aligned with Islamic school values

## Components

### `usePrayerTimes` Hook
Manages prayer time calculations and status tracking.

```typescript
const { isPrayerTime, prayerStatus, prayerTimes, isLoading } = usePrayerTimes();

// Returns:
// - isPrayerTime: boolean - whether currently in a prayer window
// - prayerStatus: object with currentPrayer, nextPrayer, timeUntilNext
// - prayerTimes: object with fajr, dhuhr, asr, maghrib, isha times
// - isLoading: boolean - loading state
```

### `AdhanPlayer` Component
Plays the Adhan with volume control.

```tsx
<AdhanPlayer 
  showButton={true} 
  autoPlay={false} 
  className="flex justify-center" 
/>
```

### `PrayerTimeBlocker` Component
Modal that blocks library access during prayer times.

```tsx
<PrayerTimeBlocker 
  isOpen={isPrayerTime} 
  onClose={() => setShowPrayerBlocker(false)} 
/>
```

### `PrayerTimesSettings` Component
Settings panel for configuring prayer times location and preferences.

```tsx
<PrayerTimesSettings onSave={(settings) => {
  console.log('Prayer settings updated:', settings);
}} />
```

## Configuration

### Prayer Times Settings
Settings are stored in browser localStorage under the key `prayerTimesSettings`.

**Default Settings:**
```javascript
{
  schoolName: "Al-Heiib Islamic School",
  latitude: 0.3167,          // Kampala, Uganda
  longitude: 32.5825,        // Kampala, Uganda
  timezone: "Africa/Kampala",
  enableAdhan: true,
  adhanVolume: 0.7,          // 70%
  prayerTimeWindowMinutes: 20
}
```

**To customize:**
1. Navigate to Settings → Prayer Times Configuration (if available)
2. Update school location using latitude/longitude
3. Adjust prayer window and Adhan settings
4. Click "Save Prayer Settings"

### For Administrators

If you need to set prayer times for a different location:

1. **Find your coordinates:**
   - Go to: https://maps.google.com
   - Search for your school
   - Right-click and select "What's here?"
   - Copy the latitude, longitude

2. **Update settings:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Run:
   ```javascript
   localStorage.setItem('prayerTimesSettings', JSON.stringify({
     schoolName: "Your School Name",
     latitude: 1.3521,
     longitude: 103.8198,
     timezone: "Asia/Singapore",
     enableAdhan: true,
     adhanVolume: 0.7,
     prayerTimeWindowMinutes: 20
   }));
   location.reload();
   ```

## Prayer Methods

The system uses the **"University of Islamic Sciences, Karachi (Method 2)"** for calculating prayer times, which is the most widely used method in Muslim countries.

- **Fajr:** Dawn (before sunrise)
- **Dhuhr:** Noon (when sun passes meridian)
- **Asr:** Afternoon
- **Maghrib:** Sunset
- **Isha:** Night (after sunset)

## Features Implementation Details

### Smart Prayer Time Windows

The prayer time window (default 20 minutes) creates a buffer around each prayer time. This allows users to:
- Prepare for prayer 20 minutes before
- Continue in prayer 20 minutes after

Example: If Dhuhr is at 12:45:
- Window starts: 12:25
- Window ends: 13:05
- Library inaccessible during this period

### Adhan Audio

The Adhan audio is fetched from `https://www.zekr.org/media/audio/adhans/adhan.mp3`, a free Islamic resource.

### Prayer Status Display

The Library page displays:
1. **Prayer Times Bar** at the top showing all 5 prayers
2. **Current Prayer Indicator** (highlighted in green if active)
3. **Next Prayer Counter** showing minutes until next prayer

## User Experience Flow

### During Prayer Time

1. User navigates to Library page → Prayer Blocker modal appears
2. Modal shows:
   - Current active prayer (e.g., "Fajr (Dawn)")
   - Animated prayer icon with pulsing effect
   - Option to play Adhan call to prayer
   - Islamic quote from Quran
   - Message about library closing for prayer

3. User cannot:
   - Search for books
   - Issue/return books
   - Manage library items
   - Click any library buttons

4. Library content becomes semi-transparent (50% opacity)

### After Prayer Time

1. Prayer Blocker modal automatically closes
2. Library becomes fully accessible
3. Prayer times still visible at top for reference

## Technical Architecture

### Data Flow

```
Browser localStorage (settings)
       ↓
usePrayerTimes Hook
       ↓
Al-Adhan API (daily fetch)
       ↓
Prayer Status Calculation
       ↓
PrayerTimeBlocker + AdhanPlayer Components
       ↓
Library Page Rendering
```

### Performance Optimizations

- Prayer times are cached for 24 hours using React Query
- Status updates every minute (not continuously)
- Settings cached in localStorage
- No repeated API calls during same day
- Lazy loading of Adhan audio

## API Integration

### Al-Adhan API

**Endpoint:** `https://api.aladhan.com/v1/timings/{date}?latitude={lat}&longitude={lon}&method=2&school=0`

**Rate Limits:** Free to use, no authentication required

**Parameters:**
- `date`: DD-MM-YYYY format
- `latitude`: School latitude
- `longitude`: School longitude
- `method=2`: University of Islamic Sciences, Karachi
- `school=0`: Fajr angle 18°, Isha angle 18°

**Response:**
```json
{
  "data": {
    "timings": {
      "Fajr": "05:45",
      "Sunrise": "07:10",
      "Dhuhr": "12:34",
      "Asr": "15:45",
      "Sunset": "18:15",
      "Maghrib": "18:15",
      "Isha": "19:40"
    }
  }
}
```

## Customization

### Modify Prayer Window Duration

Edit `usePrayerTimes` hook and change:
```typescript
const prayerWindow = settings.prayerTimeWindowMinutes ?? 20;
```

### Change Prayer Times Method

Visit [Al-Adhan API docs](https://aladhan.com/api) and update the `method` parameter:
- `method=1`: Ummul Qura University, Makkah
- `method=2`: University of Islamic Sciences, Karachi (recommended)
- `method=3`: Muslim World League
- `method=4`: Diyanet (Turkey)
- `method=5`: Egyptian General Authority

### Add Prayer Times to Other Pages

Simply import and use the components:

```tsx
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { PrayerTimeBlocker } from '@/components/common/PrayerTimeBlocker';

// In your component:
const { isPrayerTime } = usePrayerTimes();

return (
  <>
    <PrayerTimeBlocker isOpen={isPrayerTime} />
    {/* Your content */}
  </>
);
```

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 14+)
- Mobile browsers: ✅ Responsive design

## Privacy & Data

- **No user data is stored** on external servers
- **Settings stored locally** in browser localStorage only
- **Prayer times API** only receives school coordinates (public data)
- **No tracking** of user activity during prayer times

## Troubleshooting

### Prayer times not displaying

1. Check browser console for errors
2. Verify internet connection (API call required)
3. Clear localStorage and refresh:
   ```javascript
   localStorage.removeItem('prayerTimesSettings');
   location.reload();
   ```

### Adhan audio not playing

1. Check browser volume is not muted
2. Check volume slider in AdhanPlayer component
3. Verify audio file is accessible (network tab in DevTools)
4. Some browsers require user interaction before audio plays (browser policy)

### Prayer times incorrect for your location

1. Verify latitude/longitude coordinates
2. Update timezone setting
3. Try different prayer calculation method (see Customization section)

## Future Enhancements

Potential features for future versions:

1. **Prayer Reminders** - Desktop notifications before each prayer
2. **Email Integration** - Send prayer time schedule to staff/students
3. **Qibla Direction** - Show direction to Mecca from school location
4. **Hijri Calendar** - Display Islamic calendar alongside Gregorian
5. **Jummah (Friday Prayer)** - Special handling for Friday prayer
6. **Prayer Statistics** - Track student participation in prayers
7. **Fasting Schedule** - Ramadan fast times display
8. **Multiple Locations** - Support for branches/satellite campuses

## References

- [Al-Adhan API Documentation](https://aladhan.com/api)
- [Prayer Times Calculation Methods](https://www.al-adhan.com/calculation/)
- [Islamic Prayer Information](https://en.wikipedia.org/wiki/Salah)

## Support

For issues or questions about the prayer times feature, please contact:
- School IT Support
- System Administrator

---

**Last Updated:** 2024
**Feature Version:** 1.0
**Status:** Production Ready ✅
