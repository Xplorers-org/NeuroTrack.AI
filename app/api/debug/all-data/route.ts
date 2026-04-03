import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: patients } = await supabase.from("patients").select("*");
    const { data: sessions } = await supabase.from("test_sessions").select("*");
    const { data: voiceResults } = await supabase
      .from("voice_results")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    const { data: gaitResults } = await supabase
      .from("gait_results")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    const { data: drawingResults } = await supabase
      .from("drawing_results")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      patients_count: patients?.length ?? 0,
      patients: patients?.map((p) => ({ id: p.id, patient_id: p.patient_id })) ?? [],
      sessions_count: sessions?.length ?? 0,
      sessions: sessions?.map((s) => ({ id: s.id, patient_id: s.patient_id })) ?? [],
      voice_results_sample: voiceResults?.map((v) => ({
        id: v.id,
        session_id: v.session_id,
        prediction: v.prediction,
        created_at: v.created_at,
      })) ?? [],
      gait_results_sample: gaitResults?.map((g) => ({
        id: g.id,
        session_id: g.session_id,
        gait_score: g.gait_score,
        created_at: g.created_at,
      })) ?? [],
      drawing_results_sample: drawingResults?.map((d) => ({
        id: d.id,
        session_id: d.session_id,
        motor_impairment_score: d.motor_impairment_score,
        created_at: d.created_at,
      })) ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
