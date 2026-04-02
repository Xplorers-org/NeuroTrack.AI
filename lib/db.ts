import { supabase } from "@/lib/supabase";
import { randomUUID } from "crypto";

// ── Patients ──────────────────────────────────────────────────────────────────

export async function createPatient(data: {
  patient_id: string;
  full_name: string;
  gender: string;
  age: number;
}) {
  const { data: row, error } = await supabase
    .from("patients")
    .insert({ id: randomUUID(), ...data })
    .select()
    .single();
  if (error) throw error;
  return row;
}

export async function getPatientByPid(patient_id: string) {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("patient_id", patient_id)
    .maybeSingle();
  if (error) throw error;
  return data;  // null if not found
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function createSession(patient_uuid: string, test_time: string) {
  const { data: row, error } = await supabase
    .from("test_sessions")
    .insert({
      id:         randomUUID(),
      patient_id: patient_uuid,
      test_time,
      status:     "in_progress",
    })
    .select()
    .single();
  if (error) throw error;
  return row;
}

export async function completeSession(session_id: string) {
  const { error } = await supabase
    .from("test_sessions")
    .update({ status: "complete" })
    .eq("id", session_id);
  if (error) throw error;
}

export async function getPatientHistory(patient_id: string) {
  const { data, error } = await supabase
    .from("session_summary")
    .select("*")
    .eq("patient_id", patient_id)
    .order("test_time", { ascending: false });
  if (error) throw error;
  return data;
}

// ── Drawing results ───────────────────────────────────────────────────────────

export async function saveDrawingResult(session_id: string, result: {
  drawing_type: string;
  motor_impairment_score: number;
  severity_level: string;
  description: string;
  raw_logit: number;
  sigmoid_probability: number;
  is_parkinson: boolean;
  processing_time_ms: number;
}) {
  const { data, error } = await supabase
    .from("drawing_results")
    .insert({ id: randomUUID(), session_id, ...result })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Voice results ─────────────────────────────────────────────────────────────

/**
 * Count how many voice tests this patient has had so far (across all sessions).
 * Used to compute the next test_count to pass to the Voice API.
 *
 * Logic: join voice_results → test_sessions → patients, filter by patient_id.
 */
export async function countPreviousVoiceTests(patient_uuid: string): Promise<number> {
  const { count, error } = await supabase
    .from("voice_results")
    .select("id, test_sessions!inner(patient_id)", { count: "exact", head: true })
    .eq("test_sessions.patient_id", patient_uuid);

  if (error) throw error;
  return count ?? 0;
}

export async function saveVoiceResult(session_id: string, data: {
  age: number;
  sex: string;
  test_count: number;       // auto-calculated by the API route, passed to Voice API as 'test_time'
  prediction: number;       // { "prediction": 15.842... }
  processing_time_ms?: number;
}) {
  const { data: row, error } = await supabase
    .from("voice_results")
    .insert({ id: randomUUID(), session_id, ...data })
    .select()
    .single();
  if (error) throw error;
  return row;
}

// ── Gait results ──────────────────────────────────────────────────────────────

export async function saveGaitResult(session_id: string, result: {
  gait_score: number;
  processing_time_ms?: number;
}) {
  const { data, error } = await supabase
    .from("gait_results")
    .insert({
      id: randomUUID(),
      session_id,
      gait_score:         result.gait_score,
      processing_time_ms: result.processing_time_ms ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}