-- Update school_calendar table to support recurring events
ALTER TABLE school_calendar 
ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'none' 
CHECK (recurrence IN ('none', 'weekly', 'monthly', 'annually', 'termly'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_school_calendar_dates ON school_calendar(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_school_calendar_type ON school_calendar(event_type);

-- Commentary:
-- 'none' - One time event
-- 'weekly' - Repeats every week on the same day of week
-- 'monthly' - Repeats every month on the same day of month
-- 'annually' - Repeats every year on same month/day
-- 'termly' - Heuristic repeat every 4 months (aligned with standard 3-term system)
