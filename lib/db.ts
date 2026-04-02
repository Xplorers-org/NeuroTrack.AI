import { supabase } from "@/lib/supabase";
import { randomUUID } from "crypto";

type HistoryItem = {
  id: string;
  type: "voice" | "gait" | "drawing";
  source: string;
  fileName: string;
  fileSize: string;
  score?: number;
  severity?: string;
  submittedAt: string;
};

type DbRow = Record<string, unknown>;

const getStringValue = (value: unknown, fallback = "") => {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
};

const getNumberValue = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const getDateValue = (row: DbRow) => {
  const candidate =
    getStringValue(row.submittedAt) ||
    getStringValue(row.submitted_at) ||
    getStringValue(row.created_at) ||
    getStringValue(row.test_time) ||
    new Date().toISOString();

  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
};

const severityFromScore = (type: HistoryItem["type"], score?: number) => {
  if (typeof score !== "number") return undefined;

  if (type === "voice") {
    if (score <= 20) return "Mild";
    if (score <= 40) return "Moderate";
    if (score <= 60) return "Advanced";
    return "Severe";
  }

  if (type === "gait") {
    if (score < 40) return "Low irregularity";
    if (score < 70) return "Moderate irregularity";
    return "High irregularity";
  }

  if (score < 40) return "Stable";
  if (score < 70) return "Mild irregularity";
  return "Marked irregularity";
};

const toHistoryItem = (row: DbRow, typeHint?: HistoryItem["type"]): HistoryItem | null => {
  const explicitType = getStringValue(row.type || row.analysis_type).toLowerCase();
  const type =
    (explicitType === "voice" || explicitType === "gait" || explicitType === "drawing"
      ? explicitType
      : typeHint) ||
    (row.voice_prediction !== undefined || row.prediction !== undefined || row.test_count !== undefined
      ? "voice"
      : row.gait_score !== undefined || row.gait_stability_score !== undefined
        ? "gait"
        : "drawing");

  const score =
    getNumberValue(row.score) ??
    getNumberValue(row.voice_prediction) ??
    getNumberValue(row.prediction) ??
    getNumberValue(row.gait_score) ??
    getNumberValue(row.gait_stability_score) ??
    getNumberValue(row.motor_impairment_score);

  const source =
    getStringValue(row.source) ||
    getStringValue(row.analysis_source) ||
    getStringValue(row.drawing_type) ||
    getStringValue(row.file_source) ||
    (type === "voice" ? "recording" : type === "gait" ? "webcam-recording" : "drawing");

  const fileName =
    getStringValue(row.fileName) ||
    getStringValue(row.file_name) ||
    getStringValue(row.audio_file_name) ||
    getStringValue(row.video_file_name) ||
    getStringValue(row.drawing_file_name) ||
    getStringValue(row.filename) ||
    (type === "voice"
      ? `voice-test-${getStringValue(row.test_count, "latest")}`
      : type === "gait"
        ? "recorded-gait.webm"
        : `${getStringValue(row.drawing_type, "drawing")}.png`);

  const fileSize =
    getStringValue(row.fileSize) ||
    getStringValue(row.file_size) ||
    getStringValue(row.audio_file_size) ||
    getStringValue(row.video_file_size) ||
    getStringValue(row.drawing_file_size) ||
    "N/A";

  return {
    id: getStringValue(row.id, `${type}-${getDateValue(row)}`),
    type,
    source,
    fileName,
    fileSize,
    score,
    severity: getStringValue(row.severity) || getStringValue(row.severity_level) || severityFromScore(type, score),
    submittedAt: getDateValue(row),
  };
};

const mergeUniqueHistory = (items: HistoryItem[]) => {
  const seen = new Set<string>();
  const merged: HistoryItem[] = [];

  for (const item of items) {
    const key = `${item.type}|${item.submittedAt}|${item.score ?? ""}|${item.fileName}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }

  return merged.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
};

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
    .eq("patient_id", patient_id)  // Exact match only
    .single();  // Expect exactly one row
  
  if (error && error.code === 'PGRST116') {
    // PGRST116 = no rows found, return null instead of error
    return null;
  }
  
  if (error) throw error;
  return data;
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
  // First, resolve patient_id (string like "p001") to patient UUID
  console.log(`[getPatientHistory] Fetching history for patient_id='${patient_id}'`);

  const patient = await getPatientByPid(patient_id);
  if (!patient) {
    console.log(`[getPatientHistory] Patient not found: ${patient_id}`);
    return [];
  }

  console.log(`[getPatientHistory] Resolved patient_id '${patient_id}' to UUID '${patient.id}'`);

  // Get all test_sessions for this patient using the PATIENT UUID
  const { data: sessions, error: sessionError } = await supabase
    .from("test_sessions")
    .select("id")
    .eq("patient_id", patient.id);  // Match by patient UUID

  if (sessionError) {
    console.error(`[getPatientHistory] Session query error for ${patient_id} (UUID ${patient.id}):`, sessionError);
    throw sessionError;
  }

  console.log(`[getPatientHistory] Found ${sessions?.length ?? 0} sessions for patient ${patient_id}`);

  // If no sessions exist, return empty
  if (!sessions || sessions.length === 0) {
    return [];
  }

  const sessionIds = sessions.map((s) => (s as DbRow).id as string);
  console.log(`[getPatientHistory] Session IDs for ${patient_id}:`, sessionIds);

  // Query results filtered by this patient's session IDs ONLY
  const [voiceResult, gaitResult, drawingResult] = await Promise.all([
    supabase.from("voice_results").select("*").in("session_id", sessionIds),
    supabase.from("gait_results").select("*").in("session_id", sessionIds),
    supabase.from("drawing_results").select("*").in("session_id", sessionIds),
  ]);

  if (voiceResult.error) throw voiceResult.error;
  if (gaitResult.error) throw gaitResult.error;
  if (drawingResult.error) throw drawingResult.error;

  console.log(`[getPatientHistory] Results: voice=${voiceResult.data?.length ?? 0}, gait=${gaitResult.data?.length ?? 0}, drawing=${drawingResult.data?.length ?? 0}`);

  const items: HistoryItem[] = [];

  const appendRows = (rows: DbRow[] | null, type: HistoryItem["type"]) => {
    if (!Array.isArray(rows)) return;
    for (const row of rows) {
      const item = toHistoryItem(
        {
          ...row,
          submittedAt: row.created_at || row.updated_at || row.test_time,
        },
        type,
      );
      if (item) items.push(item);
    }
  };

  appendRows(voiceResult.data ?? null, "voice");
  appendRows(gaitResult.data ?? null, "gait");
  appendRows(drawingResult.data ?? null, "drawing");

  return mergeUniqueHistory(items);
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