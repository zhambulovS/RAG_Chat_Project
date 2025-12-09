import { createClient } from '@supabase/supabase-js';

// Пытаемся получить ключи из переменных окружения.
// В реальном проекте используйте .env файл.
// Здесь мы проверяем наличие ключей, чтобы не сломать приложение, если их нет.

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// Helper function to check connectivity
export const isSupabaseConfigured = () => {
  return !!supabase;
};