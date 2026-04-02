import { NextRequest, NextResponse } from "next/server";
import { getPatientHistory } from "@/lib/db";

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
    const message = err instanceof Error ? err.message : "Database error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}