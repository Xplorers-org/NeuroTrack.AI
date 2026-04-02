import { NextRequest, NextResponse } from "next/server";
import { saveGaitResult } from "@/lib/db";

const GAIT_API_URL = process.env.GAIT_API_URL!;

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const session_id = formData.get("session_id") as string;
  const file       = formData.get("video") as File;
  const gender     = formData.get("gender") as string; // From UI (patientData.gender)

  if (!session_id || !file || !gender) {
    return NextResponse.json(
      { error: "session_id, gender, and video are required." },
      { status: 400 }
    );
  }

  // ── 1. Forward to Gait API ─────────────────────────────────────────────────
  const upstream = new FormData();
  upstream.append("video", file);
  upstream.append("gender", gender);

  let apiResult: any;
  const t0 = Date.now();
  try {
    const response = await fetch(`${GAIT_API_URL}/analyze_files`, {
      method: "POST",
      body: upstream,
    });
    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ error: `Gait API: ${detail}` }, { status: response.status });
    }
    apiResult = await response.json(); 
  } catch (err) {
    console.error("Gait API Error:", err);
    return NextResponse.json({ error: "Could not reach Gait API." }, { status: 502 });
  }
  const processing_time_ms = Date.now() - t0;

  // Extract necessary fields
  const gait_score = apiResult.gait_stability_score;
  const annotatedPath = apiResult.download_urls?.annotated_video;
  const annotated_video_url = annotatedPath ? `${GAIT_API_URL}${annotatedPath}` : null;

  if (typeof gait_score === 'undefined') {
    return NextResponse.json({ error: "Gait API did not return gait_stability_score." }, { status: 500 });
  }

  // ── 2. Save only the score to Supabase ────────────────────────────────────
  let saved = false;
  try {
    await saveGaitResult(session_id, {
      gait_score: gait_score,
      processing_time_ms,
    });
    saved = true;
  } catch (err) {
    console.error("[gait] Supabase save failed:", err);
  }

  return NextResponse.json({ 
    gait_score: gait_score, 
    annotated_video_url, 
    processing_time_ms, 
    saved 
  });
}