-- Fix Realtime publication: ensure all needed tables are added
-- Run this in the Supabase SQL editor

-- 1. Ensure the publication exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- 2. Add all tables used by the frontend
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.learners;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.classes;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.fee_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.fee_structures;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.fee_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.guardians;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.inventory_items;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.inventory_stock;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.inventory_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.assets;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.term_results;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.exam_series;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.exam_timetable;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.notification_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.subjects;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.lesson_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.homework;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.visitors;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.visitor_visits;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.discipline_cases;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.in_app_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.report_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.site_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.parent_learner_links;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.library_books;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.inventory_categories;

-- 3. Verify what's in the publication
SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' ORDER BY tablename;
