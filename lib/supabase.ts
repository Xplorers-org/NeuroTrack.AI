import { createClient } from "@supabase/supabase-js";

// Uses the service role key — server-side only, never expose to browser.
// Set these in .env and Vercel/hosting env vars (production).
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
	throw new Error(
		"Supabase URL is missing. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in environment variables.",
	);
}

if (!supabaseKey) {
	throw new Error(
		"Supabase service role key is missing. Set SUPABASE_SERVICE_ROLE_KEY in environment variables.",
	);
}

export const supabase = createClient(supabaseUrl, supabaseKey);