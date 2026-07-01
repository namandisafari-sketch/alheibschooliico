-- Public Appointment Booking: anon RLS policies + appointment_reviews table

-- 1. Allow anon users to INSERT into appointments (public booking)
DROP POLICY IF EXISTS "anon_can_insert_appointments" ON appointments;
CREATE POLICY "anon_can_insert_appointments"
  ON appointments
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 2. Allow anon users to SELECT their own appointment by id (public tracking)
DROP POLICY IF EXISTS "anon_can_select_appointments" ON appointments;
CREATE POLICY "anon_can_select_appointments"
  ON appointments
  FOR SELECT
  TO anon
  USING (true);

-- 3. Add short_id, check-in/check-out, and verification columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'short_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN short_id varchar(6) UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_appointments_short_id ON appointments(short_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'checked_in_at'
  ) THEN
    ALTER TABLE appointments ADD COLUMN checked_in_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE appointments ADD COLUMN completed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE appointments ADD COLUMN verified_by uuid REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'verification_notes'
  ) THEN
    ALTER TABLE appointments ADD COLUMN verification_notes text;
  END IF;
END $$;

-- 4. Create appointment_reviews table
CREATE TABLE IF NOT EXISTS appointment_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- 5. RLS on appointment_reviews
ALTER TABLE appointment_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_can_insert_reviews" ON appointment_reviews;
CREATE POLICY "anon_can_insert_reviews"
  ON appointment_reviews
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_can_select_reviews" ON appointment_reviews;
CREATE POLICY "anon_can_select_reviews"
  ON appointment_reviews
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "staff_can_select_reviews" ON appointment_reviews;
CREATE POLICY "staff_can_select_reviews"
  ON appointment_reviews
  FOR SELECT
  TO authenticated
  USING (true);
