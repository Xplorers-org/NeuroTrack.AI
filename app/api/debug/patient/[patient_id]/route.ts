import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ patient_id: string }> }
) {
  const { patient_id } = await params;

  try {
    // Get patient
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("patient_id", patient_id)
      .maybeSingle();

    if (patientError) throw patientError;

    const debug: Record<string, any> = {
      patient: patient ? { id: patient.id, patient_id: patient.patient_id } : null,
    };

    if (patient) {
      // Get sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("test_sessions")
        .select("*")
        .eq("patient_id", patient.patient_id);

      if (sessionsError) throw sessionsError;
      debug.sessions = sessions;

      // Get all voice results for this patient's sessions
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map((s) => s.id);
        const { data: voiceResults, error: voiceError } = await supabase
          .from("voice_results")
          .select("*")
          .in("session_id", sessionIds);

        if (voiceError) throw voiceError;
        debug.voice_results = voiceResults;

        const { data: gaitResults, error: gaitError } = await supabase
          .from("gait_results")
          .select("*")
          .in("session_id", sessionIds);

        if (gaitError) throw gaitError;
        debug.gait_results = gaitResults;

        const { data: drawingResults, error: drawingError } = await supabase
          .from("drawing_results")
          .select("*")
          .in("session_id", sessionIds);

        if (drawingError) throw drawingError;
        debug.drawing_results = drawingResults;
      }
    }

    return NextResponse.json(debug);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Debug error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
