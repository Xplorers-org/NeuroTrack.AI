import { NextRequest, NextResponse } from "next/server";
import { getPatientHistory } from "@/lib/db";

const formatDbError = (err: unknown) => {
  if (err && typeof err === "object") {
    const code = "code" in err ? String((err as { code?: unknown }).code ?? "") : "";
    const message = "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
    const details = "details" in err ? String((err as { details?: unknown }).details ?? "") : "";
    const hint = "hint" in err ? String((err as { hint?: unknown }).hint ?? "") : "";

    const parts = [code, message, details, hint].filter((part) => part.length > 0);
    if (parts.length > 0) {
      return parts.join(" | ");
    }
  }

  return err instanceof Error ? err.message : "Database error.";
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { patient_id: string } }
) {
  const { patient_id } = params;

  try {
    const sessions = await getPatientHistory(patient_id);
    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ error: "No sessions found." }, { status: 404 });
    }
    return NextResponse.json(sessions);
  } catch (err: unknown) {
    const message = formatDbError(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}