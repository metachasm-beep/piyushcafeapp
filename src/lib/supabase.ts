import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

// Only initialize Supabase if environment variables are provided
const supabaseUrl = env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
