import { NextRequest, NextResponse } from "next/server";
import { createPatient, createSession, getPatientByPid } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { patient_id, full_name, gender, age, test_time } = body;

  if (!patient_id || !full_name || !gender || !age || !test_time) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // Check for duplicate patient_id
  const existing = await getPatientByPid(patient_id);
  if (existing) {
    return NextResponse.json(
      { error: `Patient '${patient_id}' already exists. Use /api/patients/session instead.` },
      { status: 409 }
    );
  }

  try {
    const patient = await createPatient({ patient_id, full_name, gender, age });
    const session = await createSession(patient.id, test_time);

    return NextResponse.json({ patient, session_id: session.id }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Database error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}