CREATE TABLE IF NOT EXISTS device_employee_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_no TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  learner_id UUID REFERENCES learners(id) ON DELETE CASCADE,
  device_name TEXT DEFAULT 'hikvision-ds-k1a802amf-b',
  employee_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_employee_no UNIQUE (employee_no)
);

CREATE INDEX IF NOT EXISTS idx_device_mapping_employee_no ON device_employee_mapping(employee_no);
CREATE INDEX IF NOT EXISTS idx_device_mapping_user_id ON device_employee_mapping(user_id);
CREATE INDEX IF NOT EXISTS idx_device_mapping_learner_id ON device_employee_mapping(learner_id);

ALTER TABLE device_employee_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage mappings" ON device_employee_mapping
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'head_teacher', 'director'))
  );

CREATE POLICY "Anyone can read mappings" ON device_employee_mapping
  FOR SELECT USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE device_employee_mapping;

INSERT INTO site_settings (key, value, description) VALUES
  ('hikvision_ip', '192.168.88.100', 'Hikvision device IP address'),
  ('hikvision_enabled', 'true', 'Enable Hikvision polling service'),
  ('hikvision_poll_interval', '30', 'Poll interval in seconds')
ON CONFLICT (key) DO NOTHING;
