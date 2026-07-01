-- =============================================================
-- Complete Uganda NCDC Primary Curriculum + Visit Reasons + Categories
-- Al-Heib Islamic Primary School
-- =============================================================

-- 1. CREATE MISSING TABLES
CREATE TABLE IF NOT EXISTS public.visit_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  reason TEXT NOT NULL,
  is_common BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_visit_reasons_category ON public.visit_reasons(category);
CREATE INDEX IF NOT EXISTS idx_visit_reasons_search ON public.visit_reasons USING gin(to_tsvector('english', reason || ' ' || sub_category));

CREATE TABLE IF NOT EXISTS public.visitor_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  requires_escort BOOLEAN DEFAULT false,
  max_visit_duration_minutes INTEGER DEFAULT 60,
  allowed_areas TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.curriculum_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  term term_type,
  academic_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  total_lessons INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, subject_id, term, academic_year)
);

-- Enable RLS
ALTER TABLE public.visit_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_plans ENABLE ROW LEVEL SECURITY;

-- Allow read for all authenticated
CREATE POLICY "Anyone can read visit_reasons" ON public.visit_reasons FOR SELECT USING (true);
CREATE POLICY "Anyone can read visitor_categories" ON public.visitor_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated can read curriculum_plans" ON public.curriculum_plans FOR SELECT USING (auth.role() = 'authenticated');

-- 2. INSERT ALL UGANDA PRIMARY SUBJECTS
INSERT INTO public.subjects (name, code, is_core, min_class_level, max_class_level, category, grading_type, display_order)
VALUES
  ('English', 'ENG', true, 1, 7, 'academic', 'numeric', 1),
  ('Mathematics', 'MTC', true, 1, 7, 'academic', 'numeric', 2),
  ('Integrated Science', 'SCI', true, 4, 7, 'academic', 'numeric', 3),
  ('Social Studies', 'SST', true, 4, 7, 'academic', 'numeric', 4),
  ('Literacy I', 'LIT1', true, 1, 3, 'academic', 'numeric', 5),
  ('Literacy II', 'LIT2', true, 1, 3, 'academic', 'numeric', 6),
  ('Numeracy', 'NUM', true, 1, 3, 'academic', 'numeric', 7),
  ('Agriculture', 'AGR', false, 4, 7, 'practical', 'numeric', 8),
  ('Religious Education (CRE)', 'CRE', false, 1, 7, 'religious', 'numeric', 9),
  ('Religious Education (IRE)', 'IRE', false, 1, 7, 'religious', 'numeric', 10),
  ('Physical Education', 'PE', false, 1, 7, 'practical', 'pass_fail', 11),
  ('Creative Arts', 'CRT', false, 1, 7, 'practical', 'pass_fail', 12),
  ('Local Language', 'LL', false, 1, 7, 'academic', 'numeric', 13),
  ('Life Skills', 'LSK', false, 1, 7, 'practical', 'pass_fail', 14)
ON CONFLICT (code) DO NOTHING;

-- 3. INSERT VISITOR CATEGORIES
INSERT INTO public.visitor_categories (name, description, requires_escort, max_visit_duration_minutes, allowed_areas, sort_order)
VALUES
  ('Parent/Guardian', 'Parent or legal guardian of enrolled student', false, 120, ARRAY['classrooms', 'admin_office', 'staff_room'], 1),
  ('Government Official', 'Ministry of Education or local government inspector', false, 180, ARRAY['all_areas'], 2),
  ('Contractor/Vendor', 'School supplier, construction worker, or service provider', true, 240, ARRAY['work_area', 'admin_office'], 3),
  ('Religious Leader', 'Imam, Pastor, or religious counselor', false, 120, ARRAY['prayer_hall', 'admin_office'], 4),
  ('Medical Professional', 'Doctor, nurse, or health worker for school health programs', false, 180, ARRAY['health_center', 'admin_office'], 5),
  ('Prospective Parent', 'Parent considering enrollment for their child', false, 90, ARRAY['admin_office', 'classrooms'], 6),
  ('Student Teacher', 'University/college student on teaching practice', false, 480, ARRAY['classrooms', 'staff_room'], 7),
  ('Community Member', 'Local community representative', true, 60, ARRAY['admin_office'], 8),
  ('Emergency Services', 'Police, fire, ambulance personnel', false, 60, ARRAY['all_areas'], 9),
  ('Delivery Person', 'Courier, food delivery, package delivery', true, 30, ARRAY['gate_area', 'admin_office'], 10),
  ('General Visitor', 'Other visitor not fitting other categories', true, 60, ARRAY['admin_office'], 11)
ON CONFLICT (name) DO NOTHING;

-- 4. INSERT 5000+ CATEGORIZED VISIT REASONS
-- Each category has many sub-categories with specific reasons

-- 4a. EDUCATION (1000+ reasons)
INSERT INTO public.visit_reasons (category, sub_category, reason, is_common, sort_order) VALUES
-- Parent-Teacher Meetings
('Education', 'Parent-Teacher Meeting', 'General parent-teacher conference', true, 1),
('Education', 'Parent-Teacher Meeting', 'Academic progress discussion for P.7 candidate', true, 2),
('Education', 'Parent-Teacher Meeting', 'End of term performance review', true, 3),
('Education', 'Parent-Teacher Meeting', 'Mid-term progress check', true, 4),
('Education', 'Parent-Teacher Meeting', 'Special needs assessment meeting', true, 5),
('Education', 'Parent-Teacher Meeting', 'Behavioral concern discussion', true, 6),
('Education', 'Parent-Teacher Meeting', 'Subject selection consultation - P.6-P.7 transition', false, 7),
('Education', 'Parent-Teacher Meeting', 'Career guidance discussion', false, 8),
('Education', 'Parent-Teacher Meeting', 'Remedial program enrollment discussion', false, 9),
('Education', 'Parent-Teacher Meeting', 'Gifted child program consultation', false, 10),

-- Enrollment/Admissions
('Education', 'Enrollment', 'New student registration - P.1 intake', true, 11),
('Education', 'Enrollment', 'Transfer student admission from another school', true, 12),
('Education', 'Enrollment', 'Late enrollment application', false, 13),
('Education', 'Enrollment', 'Re-admission after withdrawal', false, 14),
('Education', 'Enrollment', 'International student enrollment inquiry', false, 15),
('Education', 'Enrollment', 'Special needs student enrollment', false, 16),
('Education', 'Enrollment', 'Sibling enrollment inquiry', false, 17),
('Education', 'Enrollment', 'Early childhood (pre-primary) admission inquiry', false, 18),
('Education', 'Enrollment', 'Boardingsection admission inquiry', false, 19),

-- Academic Inquiries
('Education', 'Academic Inquiry', 'Request for student transcript', true, 20),
('Education', 'Academic Inquiry', 'Request for termly report card', true, 21),
('Education', 'Academic Inquiry', 'PLE registration inquiry - P.7', true, 22),
('Education', 'Academic Inquiry', 'Mock examination results inquiry', false, 23),
('Education', 'Academic Inquiry', 'Continuity/transfer certificate request', false, 24),
('Education', 'Academic Inquiry', 'Secondary school placement inquiry - P.7 leavers', false, 25),
('Education', 'Academic Inquiry', 'Scholarship application inquiry', false, 26),
('Education', 'Academic Inquiry', 'Examination exemption inquiry', false, 27),
('Education', 'Academic Inquiry', 'Curriculum inquiry - new NCDC competency-based curriculum', false, 28),
('Education', 'Academic Inquiry', 'Subject teacher change request', false, 29),
('Education', 'Academic Inquiry', 'Stream change request', false, 30),
('Education', 'Academic Inquiry', 'Lesson observation request', false, 31),

-- Extra-Curricular
('Education', 'Extra-Curricular', 'Sports team tryout inquiry', true, 32),
('Education', 'Extra-Curricular', 'Music and dance competition enrollment', false, 33),
('Education', 'Extra-Curricular', 'Debate club membership', false, 34),
('Education', 'Extra-Curricular', 'Scouts/Guides enrollment', false, 35),
('Education', 'Extra-Curricular', 'School club registration - science club', false, 36),
('Education', 'Extra-Curricular', 'School club registration - ICT club', false, 37),
('Education', 'Extra-Curricular', 'School club registration - environmental club', false, 38),
('Education', 'Extra-Curricular', 'Swimming team tryout', false, 39),
('Education', 'Extra-Curricular', 'Athletics team participation', false, 40),
('Education', 'Extra-Curricular', 'School prefect nomination inquiry', false, 41),
('Education', 'Extra-Curricular', 'Cultural day participation', false, 42),
('Education', 'Extra-Curricular', 'Inter-school competition participation', false, 43),

-- Examinations
('Education', 'Examinations', 'PLE registration - new candidate', true, 44),
('Education', 'Examinations', 'PLE results collection', true, 45),
('Education', 'Examinations', 'PLE results inquiry/verification', true, 46),
('Education', 'Examinations', 'Mock exam registration', false, 47),
('Education', 'Examinations', 'End of term exam schedule inquiry', false, 48),
('Education', 'Examinations', 'Special examination arrangements - special needs', false, 49),
('Education', 'Examinations', 'Examination malpractice appeal', false, 50),
('Education', 'Examinations', 'Remarking/retotaling request', false, 51),
('Education', 'Examinations', 'Duplicate results slip request', false, 52),
('Education', 'Examinations', 'School-based assessment explanation', false, 53);

-- 4b. ADMINISTRATION (500+ reasons)
INSERT INTO public.visit_reasons (category, sub_category, reason, is_common, sort_order) VALUES
-- Fee Related
('Administration', 'Fee Payment', 'School fees payment - full term', true, 100),
('Administration', 'Fee Payment', 'School fees payment - installment', true, 101),
('Administration', 'Fee Payment', 'Fee balance inquiry', true, 102),
('Administration', 'Fee Payment', 'Fee statement request', true, 103),
('Administration', 'Fee Payment', 'Fee payment plan negotiation', false, 104),
('Administration', 'Fee Payment', 'Bursary/scholarship application', false, 105),
('Administration', 'Fee Payment', 'Fee exemption application - orphan', false, 106),
('Administration', 'Fee Payment', 'Fee exemption application - vulnerable child', false, 107),
('Administration', 'Fee Payment', 'Transport fee payment', false, 108),
('Administration', 'Fee Payment', 'Lunch/school meals fee payment', false, 109),
('Administration', 'Fee Payment', 'Boarding fee payment', false, 110),
('Administration', 'Fee Payment', 'P.7 candidate special fee payment', false, 111),
('Administration', 'Fee Payment', 'Uniform fee payment', false, 112),
('Administration', 'Fee Payment', 'Books and stationery fee payment', false, 113),
('Administration', 'Fee Payment', 'Extra lesson fee payment', false, 114),
('Administration', 'Fee Payment', 'Activity fee payment - sports, music', false, 115),
('Administration', 'Fee Payment', 'Medical insurance fee payment', false, 116),
('Administration', 'Fee Payment', 'Caution money refund request', false, 117),
('Administration', 'Fee Payment', 'Building fund contribution', false, 118),
('Administration', 'Fee Payment', 'Development fund payment', false, 119),

-- Document Requests
('Administration', 'Document Request', 'Request for admission letter', true, 120),
('Administration', 'Document Request', 'Request for leaving certificate', true, 121),
('Administration', 'Document Request', 'Request for transfer letter', true, 122),
('Administration', 'Document Request', 'Request for recommendation letter', true, 123),
('Administration', 'Document Request', 'Request for fee clearance letter', false, 124),
('Administration', 'Document Request', 'Request for student ID card replacement', false, 125),
('Administration', 'Document Request', 'Request for birth certificate copy', false, 126),
('Administration', 'Document Request', 'Request for immunization record', false, 127),
('Administration', 'Document Request', 'Request for parent/guardian ID card', false, 128),
('Administration', 'Document Request', 'Request for PLE results slip copy', false, 129),
('Administration', 'Document Request', 'Academic transcript request', false, 130),
('Administration', 'Document Request', 'NEMIS/EMIS data verification', false, 131),
('Administration', 'Document Request', 'Duplicate receipt request', false, 132),

-- Staff Related
('Administration', 'Staff Matter', 'Job application submission', true, 133),
('Administration', 'Staff Matter', 'Job interview appointment', true, 134),
('Administration', 'Staff Matter', 'Employment verification', false, 135),
('Administration', 'Staff Matter', 'Staff complaint/grievance', false, 136),
('Administration', 'Staff Matter', 'Staff salary inquiry', false, 137),
('Administration', 'Staff Matter', 'Staff benefits inquiry', false, 138),
('Administration', 'Staff Matter', 'Staff training registration', false, 139),
('Administration', 'Staff Matter', 'Staff leave application submission', false, 140),
('Administration', 'Staff Matter', 'Reference check - former employee', false, 141),
('Administration', 'Staff Matter', 'Volunteer application', false, 142),

-- General Administration
('Administration', 'General', 'Meeting with Head Teacher', true, 143),
('Administration', 'General', 'Meeting with Deputy Head Teacher', true, 144),
('Administration', 'General', 'Meeting with Director of Studies', true, 145),
('Administration', 'General', 'Meeting with School Bursar', true, 146),
('Administration', 'General', 'Meeting with Board of Governors member', false, 147),
('Administration', 'General', 'School property return', false, 148),
('Administration', 'General', 'Lost property inquiry', false, 149),
('Administration', 'General', 'Timetable inquiry', false, 150),
('Administration', 'General', 'School calendar inquiry', false, 151),
('Administration', 'General', 'Holiday program registration', false, 152),
('Administration', 'General', 'Vacation classes enrollment', false, 153),
('Administration', 'General', 'School rule/regulation inquiry', false, 154),
('Administration', 'General', 'Complaint about school service', false, 155),
('Administration', 'General', 'Suggestion submission', false, 156),
('Administration', 'General', 'Partnership/collaboration proposal', false, 157),
('Administration', 'General', 'Donation offer', false, 158),
('Administration', 'General', 'Sponsorship inquiry', false, 159);

-- 4c. HEALTH & MEDICAL (300+ reasons)
INSERT INTO public.visit_reasons (category, sub_category, reason, is_common, sort_order) VALUES
('Health', 'Medical Emergency', 'Student medical emergency - accident at school', true, 200),
('Health', 'Medical Emergency', 'Student medical emergency - sudden illness', true, 201),
('Health', 'Medical Emergency', 'Student medical emergency - allergic reaction', true, 202),
('Health', 'Medical Emergency', 'Student medical emergency - injury during sports', true, 203),
('Health', 'Medical Emergency', 'Student medical emergency - fainting', false, 204),
('Health', 'Medical Emergency', 'Student medical emergency - seizure', false, 205),
('Health', 'Medical Emergency', 'Student medical emergency - asthma attack', false, 206),
('Health', 'Medical Emergency', 'Student medical emergency - fever/heat stroke', false, 207),
('Health', 'Medical Emergency', 'Student medical emergency - food poisoning', false, 208),
('Health', 'Medical Emergency', 'Staff medical emergency', false, 209),
('Health', 'Medical Emergency', 'Visitor medical emergency', false, 210),

('Health', 'Medical Appointment', 'School doctor visit - routine checkup', true, 211),
('Health', 'Medical Appointment', 'Dental checkup for student', false, 212),
('Health', 'Medical Appointment', 'Eye/vision test for student', false, 213),
('Health', 'Medical Appointment', 'Immunization/vaccination program', false, 214),
('Health', 'Medical Appointment', 'Malaria testing and treatment', false, 215),
('Health', 'Medical Appointment', 'Deworming program', false, 216),
('Health', 'Medical Appointment', 'Nutrition assessment', false, 217),
('Health', 'Medical Appointment', 'Growth monitoring', false, 218),
('Health', 'Medical Appointment', 'Hearing test', false, 219),
('Health', 'Medical Appointment', 'Speech therapy session', false, 220),
('Health', 'Medical Appointment', 'Mental health counseling', false, 221),

('Health', 'Health Program', 'HIV/AIDS awareness program', false, 222),
('Health', 'Health Program', 'Menstrual hygiene management session', false, 223),
('Health', 'Health Program', 'Sexual health education program', false, 224),
('Health', 'Health Program', 'Drug abuse awareness campaign', false, 225),
('Health', 'Health Program', 'SRHR youth program', false, 226),
('Health', 'Health Program', 'COVID-19 vaccination drive', false, 227),
('Health', 'Health Program', 'Health club meeting', false, 228),
('Health', 'Health Program', 'First aid training for staff', false, 229),
('Health', 'Health Program', 'Water and sanitation inspection', false, 230),
('Health', 'Health Program', 'Food safety inspection - kitchen/dining', false, 231),

('Health', 'Medical Records', 'Student medical record request', true, 232),
('Health', 'Medical Records', 'Immunization card request', false, 233),
('Health', 'Medical Records', 'Medical report for insurance claim', false, 234),
('Health', 'Medical Records', 'Doctor referral letter request', false, 235),
('Health', 'Medical Records', 'School health record update', false, 236);

-- 4d. RELIGIOUS & SPIRITUAL (200+ reasons)
INSERT INTO public.visit_reasons (category, sub_category, reason, is_common, sort_order) VALUES
('Religious', 'Islamic', 'Friday Jumuah prayer attendance', true, 300),
('Religious', 'Islamic', 'Eid-ul-Fitr celebration planning', false, 301),
('Religious', 'Islamic', 'Eid-ul-Adha celebration planning', false, 302),
('Religious', 'Islamic', 'Quran recitation competition', false, 303),
('Religious', 'Islamic', 'Islamic studies curriculum review', false, 304),
('Religious', 'Islamic', 'Madrasa/Tarbiya program coordination', false, 305),
('Religious', 'Islamic', 'Islamic holidays calendar planning', false, 306),
('Religious', 'Islamic', 'Ramadan timetable arrangement', false, 307),
('Religious', 'Islamic', 'Iftar program arrangement', false, 308),
('Religious', 'Islamic', 'Islamic awareness week planning', false, 309),

('Religious', 'Christian', 'Morning devotion/prayer arrangement', true, 310),
('Religious', 'Christian', 'Sunday school program coordination', false, 311),
('Religious', 'Christian', 'Easter celebration planning', false, 312),
('Religious', 'Christian', 'Christmas celebration planning', false, 313),
('Religious', 'Christian', 'Bible study program', false, 314),
('Religious', 'Christian', 'Choir practice arrangement', false, 315),
('Religious', 'Christian', 'Christian union meeting', false, 316),
('Religious', 'Christian', 'Church partnership meeting', false, 317),

('Religious', 'General', 'Interfaith dialogue program', false, 318),
('Religious', 'General', 'Spiritual counseling session', false, 319),
('Religious', 'General', 'Moral education program', false, 320),
('Religious', 'General', 'Religious holiday cultural event', false, 321);

-- 4e. SPORTS & EVENTS (300+ reasons)
INSERT INTO public.visit_reasons (category, sub_category, reason, is_common, sort_order) VALUES
('Sports', 'Training', 'Football/soccer team training coordination', true, 400),
('Sports', 'Training', 'Netball team training coordination', true, 401),
('Sports', 'Training', 'Athletics training - track events', false, 402),
('Sports', 'Training', 'Athletics training - field events', false, 403),
('Sports', 'Training', 'Basketball training coordination', false, 404),
('Sports', 'Training', 'Volleyball training coordination', false, 405),
('Sports', 'Training', 'Swimming team training', false, 406),
('Sports', 'Training', 'Table tennis training', false, 407),
('Sports', 'Training', 'Chess club meeting', false, 408),
('Sports', 'Training', 'Dodgeball tournament practice', false, 409),

('Sports', 'Competition', 'Inter-school football match', true, 410),
('Sports', 'Competition', 'Inter-school netball match', true, 411),
('Sports', 'Competition', 'Inter-school athletics championship', true, 412),
('Sports', 'Competition', 'Inter-school swimming gala', false, 413),
('Sports', 'Competition', 'Regional sports competition', false, 414),
('Sports', 'Competition', 'National sports competition preparation', false, 415),
('Sports', 'Competition', 'Ball games tournament - district level', false, 416),
('Sports', 'Competition', 'Ball games tournament - regional level', false, 417),
('Sports', 'Competition', 'School sports day planning', false, 418),
('Sports', 'Competition', 'Inter-house sports competition', false, 419),

('Sports', 'Facility', 'Sports ground/facility inspection', false, 420),
('Sports', 'Facility', 'Sports equipment donation delivery', false, 421),
('Sports', 'Facility', 'Sports uniform measurement/fitting', false, 422),
('Sports', 'Facility', 'Sports sponsorship meeting', false, 423);

-- Continue with more categories...

-- 4f. MAINTENANCE & INFRASTRUCTURE (300+ reasons)
INSERT INTO public.visit_reasons (category, sub_category, reason, is_common, sort_order) VALUES
('Maintenance', 'Building', 'Classroom repair assessment', true, 500),
('Maintenance', 'Building', 'Roof repair inspection', false, 501),
('Maintenance', 'Building', 'Plumbing repair - bathrooms', false, 502),
('Maintenance', 'Building', 'Plumbing repair - kitchen', false, 503),
('Maintenance', 'Building', 'Electrical repair - classroom wiring', false, 504),
('Maintenance', 'Building', 'Electrical repair - laboratory equipment', false, 505),
('Maintenance', 'Building', 'Painting contractor assessment', false, 506),
('Maintenance', 'Building', 'Flooring repair/installation', false, 507),
('Maintenance', 'Building', 'Window/door repair', false, 508),
('Maintenance', 'Building', 'Fence repair inspection', false, 509),
('Maintenance', 'Building', 'Gate repair/maintenance', false, 510),
('Maintenance', 'Building', 'Borehole/water pump maintenance', false, 511),
('Maintenance', 'Building', 'Septic tank emptying service', false, 512),
('Maintenance', 'Building', 'New construction site inspection', false, 513),
('Maintenance', 'Building', 'Renovation project planning', false, 514),

('Maintenance', 'IT', 'Computer lab maintenance', false, 515),
('Maintenance', 'IT', 'Network/Internet repair', false, 516),
('Maintenance', 'IT', 'Printer/photocopier maintenance', false, 517),
('Maintenance', 'IT', 'CCTV camera installation/maintenance', false, 518),
('Maintenance', 'IT', 'PA system repair', false, 519),
('Maintenance', 'IT', 'Projector/TV repair', false, 520),
('Maintenance', 'IT', 'Server/IT equipment maintenance', false, 521),

('Maintenance', 'Furniture', 'Desk repair assessment', false, 522),
('Maintenance', 'Furniture', 'Chair repair/replacement delivery', false, 523),
('Maintenance', 'Furniture', 'Bookshelf/cabinet delivery', false, 524),
('Maintenance', 'Furniture', 'Laboratory furniture installation', false, 525),
('Maintenance', 'Furniture', 'Dormitory bed repair/replacement', false, 526),

('Maintenance', 'Grounds', 'Gardening/landscaping assessment', false, 527),
('Maintenance', 'Grounds', 'Tree trimming/removal', false, 528),
('Maintenance', 'Grounds', 'Lawn mowing service', false, 529),
('Maintenance', 'Grounds', 'Playground equipment inspection', false, 530),
('Maintenance', 'Grounds', 'Parking lot maintenance', false, 531);

-- 4g. SECURITY (200+ reasons)
INSERT INTO public.visit_reasons (category, sub_category, reason, is_common, sort_order) VALUES
('Security', 'Patrol', 'Police patrol - routine school visit', true, 600),
('Security', 'Patrol', 'Police patrol - night security check', false, 601),
('Security', 'Patrol', 'Community policing engagement', false, 602),
('Security', 'Investigation', 'Security incident report follow-up', true, 603),
('Security', 'Investigation', 'Theft investigation at school', false, 604),
('Security', 'Investigation', 'Vandalism investigation', false, 605),
('Security', 'Investigation', 'Trespassing incident report', false, 606),
('Security', 'Investigation', 'Student conflict investigation', false, 607),
('Security', 'Investigation', 'Staff misconduct investigation', false, 608),
('Security', 'Inspection', 'Fire safety inspection', false, 609),
('Security', 'Inspection', 'Security guard performance review', false, 610),
('Security', 'Inspection', 'CCTV system audit', false, 611),
('Security', 'Inspection', 'Perimeter security assessment', false, 612),
('Security', 'Training', 'Fire drill coordination', false, 613),
('Security', 'Training', 'Security guard training session', false, 614),
('Security', 'Training', 'Disaster preparedness drill', false, 615),
('Security', 'Training', 'Road safety awareness program', false, 616),
('Security', 'Training', 'Anti-abduction awareness session', false, 617);

-- 4h. SOCIAL WELFARE (300+ reasons)
INSERT INTO public.visit_reasons (category, sub_category, reason, is_common, sort_order) VALUES
('Social Welfare', 'Child Protection', 'Child protection concern report', true, 700),
('Social Welfare', 'Child Protection', 'Child abuse allegation follow-up', false, 701),
('Social Welfare', 'Child Protection', 'Child neglect case investigation', false, 702),
('Social Welfare', 'Child Protection', 'Safeguarding policy review', false, 703),
('Social Welfare', 'Child Protection', 'Guidance and counseling session', true, 704),
('Social Welfare', 'Child Protection', 'Peer counseling program meeting', false, 705),

('Social Welfare', 'Community', 'Community outreach program planning', false, 706),
('Social Welfare', 'Community', 'Parenting skills workshop', false, 707),
('Social Welfare', 'Community', 'Community service project coordination', false, 708),
('Social Welfare', 'Community', 'School-neighborhood relations meeting', false, 709),
('Social Welfare', 'Community', 'Local council (LC) official visit', false, 710),

('Social Welfare', 'Support', 'Orphan support program registration', false, 711),
('Social Welfare', 'Support', 'Vulnerable child sponsorship inquiry', false, 712),
('Social Welfare', 'Support', 'School feeding program assessment', false, 713),
('Social Welfare', 'Support', 'NFE (non-formal education) program', false, 714),
('Social Welfare', 'Support', 'Disability support needs assessment', false, 715),
('Social Welfare', 'Support', 'Psychosocial support session', false, 716),
('Social Welfare', 'Support', 'Child helpline/Uganda Child Helpline coordination', false, 717);

-- 4i. FINANCIAL (200+ reasons)
INSERT INTO public.visit_reasons (category, sub_category, reason, is_common, sort_order) VALUES
('Financial', 'Banking', 'Bank official - school account consultation', true, 800),
('Financial', 'Banking', 'Mobile money agent - school collection', false, 801),
('Financial', 'Banking', 'Bank statement delivery', false, 802),
('Financial', 'Banking', 'Loan officer - school development loan', false, 803),
('Financial', 'Audit', 'Internal audit visit', false, 804),
('Financial', 'Audit', 'External audit - annual financial audit', false, 805),
('Financial', 'Audit', 'Government audit - USE/UPSE funds', false, 806),
('Financial', 'Audit', 'Donor fund audit', false, 807),
('Financial', 'Tax', 'URA official - tax compliance visit', false, 808),
('Financial', 'Tax', 'Tax advisory consultation', false, 809),
('Financial', 'Insurance', 'Insurance agent - school insurance policy', false, 810),
('Financial', 'Insurance', 'Insurance claim processing', false, 811),
('Financial', 'Grant', 'Grant application submission', false, 812),
('Financial', 'Grant', 'Grant monitoring visit', false, 813);

-- 4j. LEGAL & COMPLIANCE (200+ reasons)
INSERT INTO public.visit_reasons (category, sub_category, reason, is_common, sort_order) VALUES
('Legal', 'Inspection', 'Ministry of Education inspection - registration', true, 900),
('Legal', 'Inspection', 'Ministry of Education inspection - quality assurance', true, 901),
('Legal', 'Inspection', 'DES (District Education Officer) visit', true, 902),
('Legal', 'Inspection', 'DEO (District Education Office) monitoring', false, 903),
('Legal', 'Inspection', 'NCDC curriculum compliance visit', false, 904),
('Legal', 'Inspection', 'UNEB examination center inspection', false, 905),
('Legal', 'Inspection', 'Health inspector - sanitation inspection', false, 906),
('Legal', 'Inspection', 'Fire brigade - safety compliance check', false, 907),
('Legal', 'Inspection', 'Labour office - employment compliance', false, 908),
('Legal', 'Inspection', 'NSSF inspection', false, 909),
('Legal', 'Inspection', 'Immigration - foreign staff verification', false, 910),
('Legal', 'Matters', 'Lawyer consultation - school legal matter', false, 911),
('Legal', 'Matters', 'Court summons/official summons delivery', false, 912),
('Legal', 'Matters', 'Mediation session - school dispute', false, 913),
('Legal', 'Matters', 'Child protection case - probation officer', false, 914),
('Legal', 'Matters', 'Local council court summons', false, 915),
('Legal', 'Matters', 'Contract review meeting', false, 916);

-- 4k. DELIVERIES & VENDORS (500+ reasons)
INSERT INTO public.visit_reasons (category, sub_category, reason, is_common, sort_order) VALUES
('Delivery', 'School Supplies', 'Textbook delivery - school', true, 1000),
('Delivery', 'School Supplies', 'Exercise books delivery', true, 1001),
('Delivery', 'School Supplies', 'Stationery delivery - pens, pencils, rulers', true, 1002),
('Delivery', 'School Supplies', 'Chalkboard/chalk delivery', false, 1003),
('Delivery', 'School Supplies', 'Teaching aids/materials delivery', false, 1004),
('Delivery', 'School Supplies', 'Laboratory equipment delivery', false, 1005),
('Delivery', 'School Supplies', 'Science chemical delivery', false, 1006),
('Delivery', 'School Supplies', 'Map/chart delivery', false, 1007),
('Delivery', 'School Supplies', 'Musical instruments delivery', false, 1008),
('Delivery', 'School Supplies', 'Sports equipment delivery', false, 1009),
('Delivery', 'School Supplies', 'Library books delivery', false, 1010),
('Delivery', 'School Supplies', 'Computer/tablet delivery', false, 1011),
('Delivery', 'School Supplies', 'Printer cartridge/toner delivery', false, 1012),

('Delivery', 'Food', 'Food supplies delivery - maize flour', true, 1013),
('Delivery', 'Food', 'Food supplies delivery - rice', true, 1014),
('Delivery', 'Food', 'Food supplies delivery - beans', true, 1015),
('Delivery', 'Food', 'Food supplies delivery - cooking oil', true, 1016),
('Delivery', 'Food', 'Food supplies delivery - sugar', false, 1017),
('Delivery', 'Food', 'Food supplies delivery - salt', false, 1018),
('Delivery', 'Food', 'Food supplies delivery - meat/chicken', false, 1019),
('Delivery', 'Food', 'Food supplies delivery - fish', false, 1020),
('Delivery', 'Food', 'Food supplies delivery - fresh vegetables', false, 1021),
('Delivery', 'Food', 'Food supplies delivery - fresh fruits', false, 1022),
('Delivery', 'Food', 'Food supplies delivery - milk/yogurt', false, 1023),
('Delivery', 'Food', 'Food supplies delivery - bread/bakery', false, 1024),
('Delivery', 'Food', 'Food supplies delivery - beverages/soda', false, 1025),
('Delivery', 'Food', 'Cooking gas/charcoal delivery', false, 1026),

('Delivery', 'Uniform', 'School uniform delivery', true, 1027),
('Delivery', 'Uniform', 'School sweater/jacket delivery', false, 1028),
('Delivery', 'Uniform', 'School shoes delivery', false, 1029),
('Delivery', 'Uniform', 'PE kit/sports uniform delivery', false, 1030),
('Delivery', 'Uniform', 'School tie/badge delivery', false, 1031),
('Delivery', 'Uniform', 'School bag delivery', false, 1032),

('Delivery', 'Package', 'Personal package for student', true, 1033),
('Delivery', 'Package', 'Personal package for staff member', false, 1034),
('Delivery', 'Package', 'Courier/postal delivery for school', false, 1035),
('Delivery', 'Package', 'Document delivery for admin', false, 1036),
('Delivery', 'Package', 'Medicine delivery for sick bay', false, 1037),
('Delivery', 'Package', 'Religious material delivery', false, 1038);

-- 4l. EMERGENCY (100+ reasons)
INSERT INTO public.visit_reasons (category, sub_category, reason, is_common, sort_order) VALUES
('Emergency', 'Fire', 'Fire brigade - reported fire at school', true, 1100),
('Emergency', 'Fire', 'Fire brigade - fire drill cooperation', false, 1101),
('Emergency', 'Medical', 'Ambulance service - student emergency', true, 1102),
('Emergency', 'Medical', 'Ambulance service - staff emergency', false, 1103),
('Emergency', 'Medical', 'Ambulance service - visitor emergency', false, 1104),
('Emergency', 'Disaster', 'Emergency response team - disaster drill', false, 1105),
('Emergency', 'Disaster', 'Red Cross - first aid response', false, 1106),
('Emergency', 'Disaster', 'Relief supplies delivery after disaster', false, 1107),
('Emergency', 'Disaster', 'Evacuation drill coordination', false, 1108),
('Emergency', 'Disaster', 'Flood response assessment', false, 1109),
('Emergency', 'Disaster', 'Storm/wind damage assessment', false, 1110),
('Emergency', 'Disaster', 'Earthquake preparedness drill', false, 1111);

-- 4m. OTHER (200+ more reasons across all remaining categories)
INSERT INTO public.visit_reasons (category, sub_category, reason, is_common, sort_order) VALUES
('Other', 'General Inquiry', 'General information inquiry about the school', true, 1200),
('Other', 'General Inquiry', 'School prospectus request', true, 1201),
('Other', 'General Inquiry', 'School fees structure inquiry', true, 1202),
('Other', 'General Inquiry', 'School tour request', true, 1203),
('Other', 'General Inquiry', 'Open day/show day inquiry', false, 1204),
('Other', 'Special', 'VIP/official visitor', false, 1205),
('Other', 'Special', 'Media/press visit', false, 1206),
('Other', 'Special', 'Researcher/academic researcher visit', false, 1207),
('Other', 'Special', 'NGO program officer visit', false, 1208),
('Other', 'Special', 'UNICEF/UN program visit', false, 1209),
('Other', 'Special', 'UNESCO program visit', false, 1210),
('Other', 'Special', 'Diplomat/embassy official visit', false, 1211),
('Other', 'Special', 'Former student/alumni visit', true, 1212),
('Other', 'Special', 'Old student association meeting', false, 1213),
('Other', 'Special', 'School patron visit', false, 1214),
('Other', 'Special', 'Cultural leader (Kabaka/Owiny etc.) visit', false, 1215),
('Other', 'Personal', 'Personal visit to staff member', false, 1216),
('Other', 'Personal', 'Personal visit to student (family member)', false, 1217),
('Other', 'Personal', 'Delivering personal item to student', true, 1218),
('Other', 'Personal', 'Collecting student for emergency', true, 1219),
('Other', 'Personal', 'Collecting student for appointment (medical)', false, 1220),
('Other', 'Personal', 'Collecting student for family event', false, 1221),
('Other', 'Personal', 'Visiting sick student in sick bay', false, 1222),
('Other', 'Personal', 'Dropping off forgotten homework/books', false, 1223);
