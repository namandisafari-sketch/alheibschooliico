
-- Add designation and gender to profiles if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender public.gender_type;

-- Update the role check constraint to allow all staff roles
DO $$ 
BEGIN 
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
END $$;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'teacher', 'head_teacher', 'support', 'driver', 'security', 'cook', 'cleaner', 'accountant'));


-- Ensure full_name is unique to allow ON CONFLICT to work
-- Note: In a real production system, you might want a more specific unique key.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_full_name_key') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_full_name_key UNIQUE (full_name);
    END IF;
END $$;

-- Insert staff members
INSERT INTO public.profiles (id, full_name, role, designation, gender, phone, email) VALUES
(gen_random_uuid(), 'ALI ABDO SALEH', 'admin', 'CENTRE DIRECTOR', 'male', NULL, NULL),
(gen_random_uuid(), 'NAKAYIZA AIDAH', 'admin', 'HEADTEACHER', 'female', '788402156', NULL),
(gen_random_uuid(), 'MUSIHO YASIN', 'teacher', 'TEACHER SECULAR', 'male', '700761192', NULL),
(gen_random_uuid(), 'MULONDO RUHUMAN', 'teacher', 'TEACHER SECULAR', 'male', '704653273', 'mulondoruqman312@gmail.com'),
(gen_random_uuid(), 'MUMBUYI ISAAC', 'teacher', 'TEACHER SECULAR', 'male', '789906707', NULL),
(gen_random_uuid(), 'ISABIRYE TAIBU', 'teacher', 'TEACHER SECULAR', 'male', '771837787', NULL),
(gen_random_uuid(), 'SSEREMBA FLUJENSIO', 'teacher', 'TEACHER SECULAR', 'male', '701069096', NULL),
(gen_random_uuid(), 'NAMUKASA REBECCA', 'teacher', 'TEACHER SECULAR', 'female', '762623954', NULL),
(gen_random_uuid(), 'NAKAYE HALIMAH', 'teacher', 'TEACHER SECULAR', 'female', '773900033', NULL),
(gen_random_uuid(), 'BYANGO JALALU-DIIN', 'teacher', 'TEACHER THEOLOGY', 'male', '0704865647', NULL),
(gen_random_uuid(), 'ISIKO MOHAMMED', 'teacher', 'TEACHER SECULAR', 'male', '701700530', NULL),
(gen_random_uuid(), 'JAMAL ABUBAKAR', 'support', 'ORPHAN SUPERVISOR', 'male', '700232171', 'jamaldinjamal256@gmail.com'),
(gen_random_uuid(), 'LOGOSE OLIVER', 'teacher', 'TEACHER SECULAR', 'female', '784835507', NULL),
(gen_random_uuid(), 'NAMULONDO ZAITUN', 'teacher', 'TEACHER THEOLOGY', 'female', '758612864', NULL),
(gen_random_uuid(), 'HANIFAH KALIFAN', 'teacher', 'TEACHER THEOLOGY', 'female', '774067512', NULL),
(gen_random_uuid(), 'NANYANZI ZAITUN', 'support', 'SECRETARY', 'female', '702592341', 'nanyanzizaitun@gmail.com'),
(gen_random_uuid(), 'NAMUSUBO ATIKA', 'support', 'SECRETARY', 'female', NULL, NULL),
(gen_random_uuid(), 'TUSIIME DINAVENCE', 'support', 'MATRON', 'female', '0758881938', NULL),
(gen_random_uuid(), 'KYAKUWAIRE ASIA', 'support', 'MATRON', 'female', '751605352', NULL),
(gen_random_uuid(), 'MWENDEZE SANULA', 'support', 'MATRON', 'female', '701988945', NULL),
(gen_random_uuid(), 'NAKYANZI LAILAH', 'support', 'MATRON', 'female', '707305382', NULL),
(gen_random_uuid(), 'NANYONGA HIDAYAH', 'support', 'NURSE', 'female', '0700991081', NULL),
(gen_random_uuid(), 'ABUDU MAGOHA MAYUNI', 'cook', 'COOK', 'male', '772828179', NULL),
(gen_random_uuid(), 'KALEMA ISA', 'cook', 'COOK', 'male', '786967253', NULL),
(gen_random_uuid(), 'NAMUBIRU ROSE', 'cleaner', 'CLEANER', 'female', '782647067', NULL),
(gen_random_uuid(), 'MBABAZI ZAHARA', 'cleaner', 'CLEANER', 'female', '746013830', NULL),
(gen_random_uuid(), 'WANYAMA HUSSEIN', 'security', 'WATCHMAN', 'male', '700228340', NULL),
(gen_random_uuid(), 'YASIN HARUNA', 'driver', 'DRIVER', 'male', '708181083', NULL),
(gen_random_uuid(), 'NABALA RASHID', 'security', 'WATCHMAN', 'male', '752310154', NULL),
(gen_random_uuid(), 'HIGENYI ISMAIL', 'security', 'WATCHMAN', 'male', '754008064', NULL),
(gen_random_uuid(), 'HANAD MOHAMMED', 'accountant', 'ACCOUNTANT', 'male', '707817492', 'hanadmohammed@alheib.teacher'),
(gen_random_uuid(), 'SAMIIRAH HAMIDU', 'teacher', 'TEACHER THEOLOGY', 'female', NULL, NULL),
(gen_random_uuid(), 'MUGOYA ROGERS', 'security', 'WATCHMAN', 'male', '740496827', NULL),
(gen_random_uuid(), 'RUTAKOME EMMANUEL', 'cleaner', 'CLEANER', 'male', NULL, NULL),
(gen_random_uuid(), 'HAMMAAD KARAARI ABDALLA', 'teacher', 'TEACHER THEOLOGY', 'male', NULL, NULL),
(gen_random_uuid(), 'BBAALE UKASHA', 'teacher', 'TEACHER THEOLOGY', 'male', NULL, NULL),
(gen_random_uuid(), 'ABDULLATWIFU IBRAHIM', 'teacher', 'TEACHER THEOLOGY', 'male', NULL, NULL),
(gen_random_uuid(), 'NASSALI AISHA', 'teacher', 'TEACHER SECULAR', 'female', NULL, NULL),
(gen_random_uuid(), 'MUSIMENTA SYLIVIA', 'support', 'MATRON', 'female', '704151132', NULL),
(gen_random_uuid(), 'KITONGO SARAH', 'support', 'MATRON', 'female', NULL, NULL),
(gen_random_uuid(), 'HARRIET KHAITSA', 'support', 'MATRON', 'female', '780186911', NULL),
(gen_random_uuid(), 'NAMBI AMINA', 'support', 'MATRON', 'female', '705330387', NULL),
(gen_random_uuid(), 'HUSSEIN RAJAB', 'support', 'WELDER', 'male', NULL, NULL),
(gen_random_uuid(), 'KAJULE YUNUSU', 'support', 'TAILOR', 'male', NULL, NULL),
(gen_random_uuid(), 'KAYISINGE JUMA', 'support', 'GENERAL DUTIES', 'male', NULL, NULL),
(gen_random_uuid(), 'NALUBWAMA REHEMAH', 'support', 'MATRON', 'female', NULL, NULL)
ON CONFLICT (full_name) DO NOTHING;
