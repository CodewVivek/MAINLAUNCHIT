// src/supabaseClient.js
// Client-side Supabase client for Next.js App Router
// MUST use createBrowserClient to store sessions in cookies (server-readable)
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// createBrowserClient stores sessions in COOKIES (not localStorage)
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
