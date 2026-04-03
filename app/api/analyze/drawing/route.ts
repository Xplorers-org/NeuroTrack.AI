import { NextRequest, NextResponse } from "next/server";
import { saveDrawingResult } from "@/lib/db";

const MIS_API_URL = process.env.MIS_API_URL;

type MisResult = Record<string, unknown>;

const pickNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const pickString = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim().length > 0 ? value : fallback;

const normalizeDrawingResult = (drawingType: string, result: MisResult) => {
  const motorImpairmentScore = pickNumber(
    result.motor_impairment_score ?? result.score ?? result.prediction ?? result.mis_score,
    drawingType === "spiral" ? 82 : 78,
  );

  const severityLevel = pickString(
    result.severity_level ?? result.severity ?? result.label,
    motorImpairmentScore < 40
      ? "Stable"
      : motorImpairmentScore < 70
        ? "Mild irregularity"
        : "Marked irregularity",
  );

  const description = pickString(
    result.description ?? result.summary ?? result.message,
    drawingType === "spiral"
      ? "Spiral drawing reflects fine motor control and tremor stability."
      : "Wave drawing reflects rhythmic motor control and movement symmetry.",
  );

  const rawLogit = pickNumber(result.raw_logit ?? result.logit, 0);
  const sigmoidProbability = pickNumber(
    result.sigmoid_probability ?? result.probability ?? result.confidence,
    Math.min(Math.max(motorImpairmentScore / 100, 0), 1),
  );
  const isParkinson =
    typeof result.is_parkinson === "boolean"
      ? result.is_parkinson
      : motorImpairmentScore >= 60;

  return {
    drawing_type: drawingType,
    motor_impairment_score: motorImpairmentScore,
    severity_level: severityLevel,
    description,
    raw_logit: rawLogit,
    sigmoid_probability: sigmoidProbability,
    is_parkinson: isParkinson,
  };
};

export async function POST(req: NextRequest) {
  if (!MIS_API_URL) {
    return NextResponse.json(
      { error: "MIS_API_URL is not configured." },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const session_id = formData.get("session_id") as string;
  const drawing_type = formData.get("drawing_type") as string;   // "wave" | "spiral"
  const file = formData.get("file") as File;

  if (!session_id || !drawing_type || !file) {
    return NextResponse.json(
      { error: "session_id, drawing_type, and file are required." },
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

  // ── 1. Forward image to MIS API ───────────────────────────────────────────
  const upstream = new FormData();
  upstream.append("file", file);

  const endpoint = drawing_type === "spiral" ? "predict/spiral" : "predict/wave";

  let analysisResult: MisResult;
  const t0 = Date.now();
  try {
    const baseUrl = MIS_API_URL.replace(/\/+$/, "");
    const response = await fetch(`${baseUrl}/${endpoint}`, {
      method: "POST",
      body: upstream,
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        { error: `MIS API error: ${detail}` },
        { status: response.status }
      );
    }

    analysisResult = await response.json();
  } catch {
    return NextResponse.json({ error: "Could not reach MIS API." }, { status: 502 });
  }
  const processing_time_ms = Date.now() - t0;

  const normalizedResult = {
    ...normalizeDrawingResult(drawing_type, analysisResult),
    processing_time_ms,
  };

  // ── 2. Save result to Supabase ────────────────────────────────────────────
  try {
    await saveDrawingResult(session_id, normalizedResult);
  } catch (err: unknown) {
    // Log but don't block — return the result to frontend regardless
    console.error("[drawing] Supabase save failed:", err);
    return NextResponse.json({ ...normalizedResult, raw_result: analysisResult, saved: false });
  }

  return NextResponse.json({ ...normalizedResult, raw_result: analysisResult, saved: true });
}