import { NextRequest, NextResponse } from "next/server";
import { saveGaitResult } from "@/lib/db";

const GAIT_API_URL = process.env.GAIT_API_URL;

export async function POST(req: NextRequest) {
  if (!GAIT_API_URL) {
    return NextResponse.json(
      { error: "GAIT_API_URL is not configured." },
      { status: 500 }
    );
  }

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

  // Validate session_id is a valid UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(session_id)) {
    return NextResponse.json(
      { error: "Invalid session_id format." },
      { status: 400 }
    );
  }

  // ── 1. Forward to Gait API ─────────────────────────────────────────────────
  const upstream = new FormData();
  upstream.append("video", file);
  upstream.append("gender", gender);

  let apiResult: Record<string, unknown>;
  const t0 = Date.now();
  try {
    const baseUrl = GAIT_API_URL.replace(/\/+$/, "");
    const response = await fetch(`${baseUrl}/analyze`, {
      method: "POST",
      body: upstream,
    });
    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ error: `Gait API: ${detail}` }, { status: response.status });
    }
    apiResult = await response.json();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    return NextResponse.json(
      { error: `Could not reach Gait API. ${message}` },
      { status: 502 }
    );
  }
  const processing_time_ms = Date.now() - t0;

  // Extract necessary fields
  const gait_score_candidate =
    (apiResult.gait_stability_score as number | undefined) ??
    (apiResult.gait_score as number | undefined) ??
    (apiResult.score as number | undefined);

  const gait_score = typeof gait_score_candidate === "number"
    ? gait_score_candidate
    : undefined;

  const downloadUrls = apiResult.download_urls as Record<string, unknown> | undefined;
  const annotatedPath =
    (downloadUrls?.annotated_video as string | undefined) ??
    (apiResult.annotated_video_url as string | undefined);

  const annotated_video_url = annotatedPath
    ? annotatedPath.startsWith("http")
      ? annotatedPath
      : `${GAIT_API_URL.replace(/\/+$/, "")}${annotatedPath}`
    : null;

  if (typeof gait_score === "undefined") {
    return NextResponse.json(
      { error: "Gait API did not return a gait score field." },
      { status: 500 }
    );
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