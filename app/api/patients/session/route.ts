import { NextRequest, NextResponse } from "next/server";
import { createSession, getPatientByPid } from "@/lib/db";

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
    const { patient_id, test_time } = await req.json();

    if (!patient_id || !test_time) {
      return NextResponse.json({ error: "patient_id and test_time are required." }, { status: 400 });
    }

    const patient = await getPatientByPid(patient_id);
    if (!patient) {
      return NextResponse.json({ error: `Patient '${patient_id}' not found.` }, { status: 404 });
    }

    const session = await createSession(patient.id, test_time);
    return NextResponse.json({ patient, session_id: session.id });
  } catch (err: unknown) {
    return NextResponse.json({ error: formatDbError(err) }, { status: 500 });
  }
}