import { NextRequest, NextResponse } from "next/server";
import { saveDrawingResult } from "@/lib/db";

const MIS_API_URL = process.env.MIS_API_URL!;  // e.g. https://your-space.hf.space

export async function POST(req: NextRequest) {
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

  // ── 1. Forward image to MIS API ───────────────────────────────────────────
  const upstream = new FormData();
  upstream.append("file", file);

  const endpoint = drawing_type === "spiral" ? "predict/spiral" : "predict/wave";

  let analysisResult: Record<string, unknown>;
  try {
    const response = await fetch(`${MIS_API_URL}/${endpoint}`, {
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

  // ── 2. Save result to Supabase ────────────────────────────────────────────
  try {
    await saveDrawingResult(session_id, analysisResult as Parameters<typeof saveDrawingResult>[1]);
  } catch (err: unknown) {
    // Log but don't block — return the result to frontend regardless
    console.error("[drawing] Supabase save failed:", err);
    return NextResponse.json({ ...analysisResult, saved: false });
  }

  return NextResponse.json({ ...analysisResult, saved: true });
}