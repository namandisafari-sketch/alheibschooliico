-- Expanded seed data for governance (upserts to avoid conflicts)

-- Additional governance members
INSERT INTO public.governance_members (full_name, role, status) VALUES
('Sheikh Ahmad Khalid', 'Chairman', 'active'),
('Haji Ibrahim Isma', 'Director / Secretary', 'active'),
('Dr. Aisha Mariam', 'Board Member', 'active'),
('Mr. Yusuf Nsubuga', 'Treasurer', 'active'),
('Ms. Sarah Nakato', 'Parent Representative', 'active'),
('Rev. John Ssempijja', 'Community Representative', 'active')
ON CONFLICT DO NOTHING;

-- Governance meetings
INSERT INTO public.governance_meetings (title, meeting_date, venue, status, agenda) VALUES
('Term II Board Strategy Session', '2026-02-15', 'Boardroom', 'completed', 'Review of Term I performance, budget approval for Term II, staffing updates'),
('Emergency Board Meeting - Infrastructure', '2026-04-10', 'Conference Hall', 'completed', 'Dormitory renovation approval, new classroom block discussion'),
('Q3 Governance Review', '2026-06-22', 'Boardroom', 'scheduled', 'Mid-term academic review, financial audit report, strategic planning'),
('Annual General Meeting', '2026-08-15', 'School Hall', 'scheduled', 'Annual report presentation, board elections, policy amendments')
ON CONFLICT DO NOTHING;

-- School policies
INSERT INTO public.governance_policies (title, category, status, version, last_updated, document_url) VALUES
('Staff Code of Conduct', 'Human Resource', 'active', '2.1', '2026-01-15', NULL),
('Academic Integrity Policy', 'Academic', 'active', '1.3', '2026-02-01', NULL),
('Financial Management Framework', 'Financial', 'active', '3.0', '2026-03-10', NULL),
('Learner Discipline & Welfare', 'Academic', 'active', '1.0', '2026-04-01', NULL),
('Admissions Policy', 'Academic', 'active', '2.0', '2026-01-20', NULL),
('ICT & Data Protection', 'Human Resource', 'active', '1.1', '2026-05-01', NULL),
('Anti-Bullying & Harassment', 'Human Resource', 'active', '1.0', '2026-02-28', NULL),
('Health & Safety Policy', 'Human Resource', 'under_review', '2.0', '2026-05-15', NULL),
('Board Governance Charter', 'Human Resource', 'active', '1.0', '2026-01-01', NULL),
('Safeguarding Policy', 'Human Resource', 'active', '1.2', '2026-03-01', NULL)
ON CONFLICT DO NOTHING;
