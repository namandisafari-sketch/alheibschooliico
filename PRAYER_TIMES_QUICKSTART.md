# Quick Start: Islamic Prayer Times Library Feature

## What Was Done

Your Al-Heiib Islamic School Library has been enhanced with Islamic prayer times integration. The library will now:

✅ **Automatically block access during prayer times** (Fajr, Dhuhr, Asr, Maghrib, Isha)
✅ **Display prayer times** on the Library page for all to see
✅ **Play in-app Adhan** (call to prayer) with volume control
✅ **Show countdown** to next prayer time
✅ **Respect Islamic values** by discouraging library use during congregational prayers

## How It Works

### When Accessing the Library

1. **Prayer Times Bar** appears at the top showing all 5 daily prayers
2. **Current Prayer** is highlighted in green if one is active
3. **Next Prayer** shows in blue with countdown timer
4. **During Prayer Time:**
   - A beautiful modal appears
   - Library becomes inaccessible (semi-transparent)
   - Shows current prayer with animated icon
   - Option to play the Adhan (call to prayer)
   - Inspirational Islamic quote displayed

## Features Available Now

### For Everyone
- View daily prayer times
- See which prayer is currently happening
- Know when the next prayer starts
- Listen to Adhan (optional)
- See countdown timer

### For Administrators
- Configure school location (latitude/longitude)
- Adjust prayer window duration (how long library stays blocked)
- Control Adhan volume
- Enable/disable Adhan notifications
- Customize timezone

## Default Configuration

**Current Settings:**
- **Location:** Kampala, Uganda
- **Prayer Times:** Automatically updated daily
- **Prayer Window:** 20 minutes before and after each prayer
- **Adhan Volume:** 70%
- **Timezone:** Africa/Kampala

## Customizing for Your Location

If your school is not in Kampala, update the location:

1. **Find your school coordinates:**
   - Go to Google Maps
   - Search for your school
   - Right-click → "What's here?"
   - Copy the latitude and longitude

2. **Update in browser console:**
   - Open DevTools (F12 or right-click → Inspect)
   - Go to "Console" tab
   - Copy and paste:

```javascript
localStorage.setItem('prayerTimesSettings', JSON.stringify({
  schoolName: "Your School Name",
  latitude: 0.3167,      // Replace with your latitude
  longitude: 32.5825,    // Replace with your longitude
  timezone: "Africa/Kampala",
  enableAdhan: true,
  adhanVolume: 0.7,
  prayerTimeWindowMinutes: 20
}));
location.reload();
```

**Replace the coordinates with your school's location.**

## Example: Setting for Nairobi

```javascript
localStorage.setItem('prayerTimesSettings', JSON.stringify({
  schoolName: "Al-Heiib Islamic School - Nairobi",
  latitude: -1.2921,
  longitude: 36.8219,
  timezone: "Africa/Nairobi",
  enableAdhan: true,
  adhanVolume: 0.7,
  prayerTimeWindowMinutes: 20
}));
location.reload();
```

## Available Timezones

- Africa/Kampala (Uganda) - Default
- Africa/Nairobi (Kenya)
- Africa/Lagos (Nigeria)
- Asia/Dubai (UAE)
- Europe/London (UK)
- America/New_York (USA)

## How Prayer Times Are Calculated

The system uses the **University of Islamic Sciences, Karachi** method, which is widely used in Muslim countries.

**Five Daily Prayers:**
1. **Fajr** - Dawn (before sunrise)
2. **Dhuhr** - Noon (sun at highest point)
3. **Asr** - Afternoon
4. **Maghrib** - Sunset
5. **Isha** - Night (after sunset)

Each prayer has a **20-minute window** (default):
- 20 minutes BEFORE the prayer time
- 20 minutes AFTER the prayer time

**Example:** If Dhuhr is at 12:45 PM:
- Library blocked from 12:25 PM to 1:05 PM
- Can borrow/return books after 1:05 PM

## Adhan Audio

- **Source:** Free Islamic audio resource (Zekr.org)
- **Quality:** High-quality, respectful audio
- **Automatic:** Can play automatically at prayer time
- **Manual:** Users can click "Play Adhan" button anytime
- **Volume:** Adjustable from 0-100%

## Islamic Significance

This feature aligns with Islamic values by:
- Encouraging congregational prayer (Jamaah)
- Discouraging worldly activities during prayer time
- Teaching students respect for Islamic practices
- Creating a prayer-conscious school environment
- Supporting the school's Islamic mission

## Quranic Reference

The blocker shows: *"Indeed, prayer prevents immorality and wrongdoing..." — Quran 29:45*

## Troubleshooting

### Prayer times not showing?
- Check internet connection
- Refresh page (Ctrl+R or Cmd+R)
- Clear browser cache

### Wrong prayer times?
- Verify latitude/longitude are correct
- Check timezone setting
- Try a different location nearby to test

### Adhan not playing?
- Check speaker volume
- Increase Adhan volume in settings
- Some browsers require clicking first (security policy)

### Library blocked when shouldn't be?
- Verify your timezone matches your location
- Check device time is correct
- Refresh page

## Contact Support

For issues or questions:
- IT Support: (School IT contact)
- System Administrator: (Admin contact)

## Files Modified/Created

**New Files:**
- `/src/hooks/usePrayerTimes.ts` - Prayer calculations
- `/src/components/common/AdhanPlayer.tsx` - Audio player
- `/src/components/common/PrayerTimeBlocker.tsx` - Access blocker
- `/src/components/common/PrayerTimesSettings.tsx` - Admin panel
- `/PRAYER_TIMES_GUIDE.md` - Full technical guide

**Modified Files:**
- `/src/pages/Library.tsx` - Added prayer times UI

## Performance Impact

- ✅ No additional npm packages needed
- ✅ Prayer times cached for 24 hours
- ✅ Minimal API calls
- ✅ Fast response time
- ✅ Mobile-friendly

## Privacy

- ✅ Settings stored only in your browser (localStorage)
- ✅ No user data sent to external servers
- ✅ Only school coordinates sent to prayer times API
- ✅ No tracking of user activity

## Version

- **Feature:** Islamic Prayer Times Library Integration
- **Version:** 1.0
- **Status:** Production Ready ✅
- **Build:** Verified and tested

---

**Congratulations! Your school now has an Islamic prayer-aware digital library!** 🕌📚

For more details, see [PRAYER_TIMES_GUIDE.md](./PRAYER_TIMES_GUIDE.md)
