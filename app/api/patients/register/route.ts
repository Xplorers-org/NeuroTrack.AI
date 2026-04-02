import { NextRequest, NextResponse } from "next/server";
import { createPatient, createSession, getPatientByPid } from "@/lib/db";

const formatDbError = (err: unknown) => {
  if (err && typeof err === "object") {
    const maybeCode = "code" in err ? (err as { code?: unknown }).code : undefined;
    const maybeMessage = "message" in err ? (err as { message?: unknown }).message : undefined;

    if (maybeCode === "PGRST205") {
      return "Supabase schema is missing required tables (e.g., public.patients). Please create your database schema first.";
    }

    if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
      return maybeMessage;
    }
  }

  return err instanceof Error ? err.message : "Database error.";
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patient_id, full_name, gender, age, test_time } = body;

    console.log("[register] Request body:", { patient_id, full_name, gender, age, test_time });

    if (!patient_id || !full_name || !gender || !age || !test_time) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Check for duplicate patient_id (exact match only)
    const existing = await getPatientByPid(patient_id);
    if (existing) {
      console.log("[register] Patient already exists:", patient_id);
      return NextResponse.json(
        { error: `Patient '${patient_id}' already exists. Use /api/patients/session instead.` },
        { status: 409 }
      );
    }

    console.log("[register] Creating patient:", patient_id);
    const patient = await createPatient({ patient_id, full_name, gender, age });
    console.log("[register] Patient created with id:", patient.id);

    console.log("[register] Creating session for patient:", patient.id);
    const session = await createSession(patient.id, test_time);
    console.log("[register] Session created:", session.id);

    return NextResponse.json({ patient, session_id: session.id }, { status: 201 });
  } catch (err: unknown) {
    console.error("[register] Error:", err);
    return NextResponse.json({ error: formatDbError(err) }, { status: 500 });
  }
}