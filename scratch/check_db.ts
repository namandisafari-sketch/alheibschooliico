
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAttendanceTables() {
  const { data: staffAtt, error: attError } = await supabase.from('staff_attendance').select('*').limit(1);
  console.log('staff_attendance:', staffAtt, attError?.message);
}

checkAttendanceTables();
