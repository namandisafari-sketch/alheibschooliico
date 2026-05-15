-- =====================================================================
-- ALHEIB SCHOOL — SAMPLE TEST DATA FOR PRINTOUT WORKFLOWS
-- Run this in: Lovable Cloud → Backend → SQL Editor
-- Idempotent: safe to run multiple times.
-- =====================================================================

-- ---------------------------------------------------------------------
-- STEP 0 — Auto-create test user accounts (password: Test1234!)
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_email text;
  v_uid uuid;
  v_emails text[] := ARRAY[
    'storekeeper@alheib.test',
    'manager@alheib.test',
    'director@alheib.test',
    'office@alheib.test',
    'accountant@alheib.test',
    'gateman@alheib.test',
    'teacher@alheib.test'
  ];
BEGIN
  FOREACH v_email IN ARRAY v_emails LOOP
    SELECT id INTO v_uid FROM auth.users WHERE email = v_email;
    IF v_uid IS NULL THEN
      v_uid := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data, confirmation_token,
        recovery_token, email_change_token_new, email_change
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
        v_email, crypt('Test1234!', gen_salt('bf')),
        now(), now(), now(),
        jsonb_build_object('provider','email','providers',jsonb_build_array('email')),
        jsonb_build_object('full_name', split_part(v_email,'@',1)),
        '', '', '', ''
      );
      INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), v_uid, v_uid::text,
        jsonb_build_object('sub', v_uid::text, 'email', v_email),
        'email', now(), now(), now()
      );
    END IF;
  END LOOP;
END $$;


-- ---------------------------------------------------------------------

-- Insert profiles (user_roles.user_id FKs to profiles.id)
INSERT INTO public.profiles (id, full_name, email)
SELECT u.id, split_part(u.email,'@',1), u.email
FROM auth.users u
WHERE u.email LIKE '%@alheib.test'
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 1 — Assign workflow roles to the test accounts
-- ---------------------------------------------------------------------
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, r.role::public.app_role
FROM auth.users u
JOIN (VALUES
  ('storekeeper@alheib.test', 'storekeeper'),
  ('manager@alheib.test',     'direct_manager'),
  ('director@alheib.test',    'center_director'),
  ('office@alheib.test',      'office_manager'),
  ('accountant@alheib.test',  'accountant'),
  ('gateman@alheib.test',     'gateman'),
  ('teacher@alheib.test',     'teacher')
) AS r(email, role) ON r.email = u.email
ON CONFLICT (user_id, role) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 2 — Inventory categories + items + stock levels
-- ---------------------------------------------------------------------
INSERT INTO public.inventory_categories (name, description) VALUES
  ('Stationery',  'Pens, paper, exercise books'),
  ('Cleaning',    'Soap, detergents, brooms'),
  ('Kitchen',     'Foodstuff and consumables'),
  ('Electronics', 'Computers and accessories')
ON CONFLICT DO NOTHING;

WITH cat AS (
  SELECT name, id FROM public.inventory_categories
)
INSERT INTO public.inventory_items (name, unit, category_id, min_stock_level, supplier_name, storage_location)
SELECT v.name, v.unit, c.id, v.min_stock, v.supplier, v.location
FROM (VALUES
  ('A4 Ream Paper',     'ream', 'Stationery', 20, 'Kampala Stationers', 'Main Store'),
  ('Blue Ballpens',     'box',  'Stationery', 10, 'Kampala Stationers', 'Main Store'),
  ('Exercise Books 96p','dozen','Stationery', 50, 'UPPC',               'Main Store'),
  ('Liquid Soap 5L',    'jerry','Cleaning',   5,  'Mukwano',            'Cleaning Store'),
  ('Posho 50kg',        'sack', 'Kitchen',    10, 'Maganjo Millers',    'Kitchen Store'),
  ('Beans 50kg',        'sack', 'Kitchen',    10, 'Local Supplier',     'Kitchen Store'),
  ('Cooking Oil 20L',   'jerry','Kitchen',    4,  'Mukwano',            'Kitchen Store'),
  ('HP Toner 85A',      'pcs',  'Electronics',2,  'Computer Point',     'Office')
) AS v(name, unit, cat_name, min_stock, supplier, location)
JOIN cat c ON c.name = v.cat_name
ON CONFLICT DO NOTHING;

INSERT INTO public.inventory_stock (item_id, quantity)
SELECT id,
  CASE name
    WHEN 'A4 Ream Paper' THEN 80
    WHEN 'Blue Ballpens' THEN 40
    WHEN 'Exercise Books 96p' THEN 200
    WHEN 'Liquid Soap 5L' THEN 25
    WHEN 'Posho 50kg' THEN 35
    WHEN 'Beans 50kg' THEN 28
    WHEN 'Cooking Oil 20L' THEN 12
    WHEN 'HP Toner 85A' THEN 6
  END
FROM public.inventory_items
WHERE name IN ('A4 Ream Paper','Blue Ballpens','Exercise Books 96p','Liquid Soap 5L',
               'Posho 50kg','Beans 50kg','Cooking Oil 20L','HP Toner 85A')
ON CONFLICT (item_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- ---------------------------------------------------------------------
-- STEP 3 — Employees (link to auth profiles where possible)
-- ---------------------------------------------------------------------
INSERT INTO public.employees (full_name, email, role, base_salary, currency, phone, is_active, profile_id)
SELECT v.full_name, v.email, v.role, v.salary, 'UGX', v.phone, true, u.id
FROM (VALUES
  ('Aisha Nakato',    'teacher@alheib.test',     'teacher',        850000, '+256700111001'),
  ('Yusuf Mukasa',    'storekeeper@alheib.test', 'storekeeper',    700000, '+256700111002'),
  ('Ibrahim Ssali',   'manager@alheib.test',     'direct_manager', 1200000,'+256700111003'),
  ('Khadija Namuli',  'accountant@alheib.test',  'accountant',     1100000,'+256700111004'),
  ('Omar Kasozi',     'gateman@alheib.test',     'gateman',        500000, '+256700111005')
) AS v(full_name, email, role, salary, phone)
LEFT JOIN auth.users u ON u.email = v.email
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 4 — Sample stock-issuance transactions (one per stage)
-- ---------------------------------------------------------------------
WITH item AS (SELECT id FROM public.inventory_items WHERE name = 'A4 Ream Paper' LIMIT 1),
     teacher_p AS (SELECT id FROM auth.users WHERE email='teacher@alheib.test' LIMIT 1),
     store_p   AS (SELECT id FROM auth.users WHERE email='storekeeper@alheib.test' LIMIT 1)
INSERT INTO public.inventory_transactions
  (item_id, type, quantity, status, notes, issued_by, staff_id, tracking_number, qr_verification_code)
VALUES
  ((SELECT id FROM item), 'issuance', 5, 'pending',
   'SAMPLE — awaiting manager signature',
   (SELECT id FROM store_p), (SELECT id FROM teacher_p),
   'SR-SAMPLE-001', 'QR-SAMPLE-001'),
  ((SELECT id FROM item), 'issuance', 3, 'dispatched',
   'SAMPLE — fully approved, ready for gate dispatch',
   (SELECT id FROM store_p), (SELECT id FROM teacher_p),
   'SR-SAMPLE-002', 'QR-SAMPLE-002')
ON CONFLICT (tracking_number) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 5 — Sample custody / advance request
-- ---------------------------------------------------------------------
INSERT INTO public.employee_advances
  (employee_id, amount, currency, outstanding_balance, repayment_schedule, notes)
SELECT e.id, 500000, 'UGX', 500000, 'installment',
       'SAMPLE — staff custody advance for field activity'
FROM public.employees e
WHERE e.email = 'teacher@alheib.test'
LIMIT 1;

-- =====================================================================
-- DONE. Verify with:
--   SELECT name, (SELECT quantity FROM inventory_stock s WHERE s.item_id=i.id)
--     FROM inventory_items i ORDER BY name;
--   SELECT tracking_number, status, notes FROM inventory_transactions
--     WHERE tracking_number LIKE 'SR-SAMPLE-%';
--   SELECT u.email, r.role FROM user_roles r
--     JOIN auth.users u ON u.id=r.user_id
--     WHERE u.email LIKE '%@alheib.test' ORDER BY u.email;
-- =====================================================================
