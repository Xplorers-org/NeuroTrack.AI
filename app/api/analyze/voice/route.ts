import { NextRequest, NextResponse } from "next/server";
import { saveVoiceResult, countPreviousVoiceTests, getPatientByPid } from "@/lib/db";

const VOICE_API_URL = process.env.VOICE_API_URL;

export async function POST(req: NextRequest) {
  if (!VOICE_API_URL) {
    return NextResponse.json(
      { error: "VOICE_API_URL is not configured." },
      { status: 500 }
    );
  }

  const formData = await req.formData();

  const session_id = formData.get("session_id") as string;
  const patient_id = formData.get("patient_id") as string;  // human-readable, e.g. PAT-2024-001
  const age        = formData.get("age") as string;
  const sex        = formData.get("sex") as string;
  const file       = formData.get("audio_file") as File;

  if (!session_id || !patient_id || !age || !sex || !file) {
    return NextResponse.json(
      { error: "session_id, patient_id, age, sex, and audio_file are required." },
      { status: 400 }
    );
  }

  // Validate session_id is a valid UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(session_id)) {
    return NextResponse.json(
      { error: "Invalid session_id format." },
      { status: 400 }
    );
  }

  // ── 1. Resolve patient UUID and auto-calculate test_count ─────────────────
  // test_count = how many voice tests this patient has had before + 1.
  // This is passed as 'test_time' to the Voice API.
  // The frontend never supplies this — we always compute it server-side.

  let test_count: number;
  try {
    const patient = await getPatientByPid(patient_id);
    if (!patient) {
      return NextResponse.json({ error: `Patient '${patient_id}' not found.` }, { status: 404 });
    }

    const previous = await countPreviousVoiceTests(patient.id);
    test_count = previous + 1;
  } catch (err) {
    console.error("[voice] Failed to compute test_count:", err);
    return NextResponse.json({ error: "Could not compute test count." }, { status: 500 });
  }

  // ── 2. Forward to Voice API with the computed test_count ──────────────────
  const upstream = new FormData();
  upstream.append("age",        age);
  upstream.append("sex",        sex);
  upstream.append("test_time",  String(test_count));   // Voice API calls it test_time
  upstream.append("audio_file", file);

  let apiResult: { prediction: number };
  const t0 = Date.now();
  try {
    const baseUrl = VOICE_API_URL.replace(/\/+$/, "");
    const response = await fetch(`${baseUrl}/analyze/voice`, {
      method: "POST",
      body: upstream,
    });
    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ error: `Voice API: ${detail}` }, { status: response.status });
    }
    apiResult = await response.json();  // { "prediction": 15.842... }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    return NextResponse.json(
      { error: `Could not reach Voice API. ${message}` },
      { status: 502 }
    );
  }
  const processing_time_ms = Date.now() - t0;

  // ── 3. Save to Supabase ────────────────────────────────────────────────────
  let saved = false;
  try {
    console.log("[voice] Saving result with session_id:", session_id);
    await saveVoiceResult(session_id, {
      age:               parseInt(age),
      sex,
      test_count,                         // stored as test_count in DB
      prediction:        apiResult.prediction,
      processing_time_ms,
    });
    saved = true;
    console.log("[voice] Result saved successfully");
  } catch (err) {
    console.error("[voice] Supabase save failed:", err);
  }

  return NextResponse.json({
    prediction:        apiResult.prediction,
    test_count,                            // useful for frontend to display "Test #3"
    processing_time_ms,
    saved,
  });
}