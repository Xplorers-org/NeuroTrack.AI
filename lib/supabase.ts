import { createClient } from "@supabase/supabase-js";

// Uses the service role key — server-side only, never expose to browser.
// Set these in .env and Vercel/hosting env vars (production).
const supabaseUrl  = process.env.SUPABASE_URL!;
const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);