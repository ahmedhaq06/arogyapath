import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://arogya-path-project.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('User').select('count', { count: 'exact', head: true });
    if (error) {
      console.warn('Supabase client note:', error.message);
      return false;
    }
    console.log('✅ Supabase connected successfully!');
    return true;
  } catch (err: any) {
    console.warn('Supabase connection warning:', err.message);
    return false;
  }
}
