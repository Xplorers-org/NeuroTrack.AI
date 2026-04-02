import { NextRequest, NextResponse } from "next/server";
import { createSession, getPatientByPid } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { patient_id, test_time } = await req.json();

  if (!patient_id || !test_time) {
    return NextResponse.json({ error: "patient_id and test_time are required." }, { status: 400 });
  }

  const patient = await getPatientByPid(patient_id);
  if (!patient) {
    return NextResponse.json({ error: `Patient '${patient_id}' not found.` }, { status: 404 });
  }

  try {
    const session = await createSession(patient.id, test_time);
    return NextResponse.json({ patient, session_id: session.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Database error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}