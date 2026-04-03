import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("query");

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query parameter required" },
        { status: 400 }
      );
    }

    const searchTerm = query.trim().toLowerCase();
    console.log("[search] Query:", searchTerm, "| Length:", searchTerm.length, "| Type:", typeof searchTerm);

    // First try to search by patient_id (exact match, case-insensitive)
    console.log("[search] 🔍 Trying exact match by patient_id...");
    const { data: patientById, error: idError } = await supabase
      .from("patients")
      .select("patient_id, full_name, id")
      .eq("patient_id", searchTerm)  // Use eq with lowercase searchTerm
      .limit(1);

    console.log("[search] By ID result:", patientById, "| Error:", idError);
    if (patientById && patientById.length > 0) {
      console.log("[search] ✅ Found by ID:", patientById[0].patient_id, "| Full name:", patientById[0].full_name);
      return NextResponse.json({ patient_id: patientById[0].patient_id });
    }

    // If not found by patient_id, try case-insensitive search by full_name
    console.log("[search] 🔍 Trying fuzzy match by full_name...");
    const { data: patientByName, error: nameError } = await supabase
      .from("patients")
      .select("patient_id, full_name, id")
      .ilike("full_name", `%${searchTerm}%`)
      .order("patient_id", { ascending: false })  // Descending: lowercase comes first (higher ASCII value)
      .limit(1);

    console.log("[search] By name result:", patientByName, "| Error:", nameError);
    if (patientByName && patientByName.length > 0) {
      console.log("[search] ✅ Found by name:", patientByName[0].patient_id, "| Full name:", patientByName[0].full_name);
      return NextResponse.json({ patient_id: patientByName[0].patient_id });
    }

    // Also try UUID search
    if (isUuid(searchTerm)) {
      console.log("[search] 🔍 Trying UUID match...");
      const { data: patientByUuid, error: uuidError } = await supabase
        .from("patients")
        .select("patient_id, full_name, id")
        .eq("id", searchTerm)
        .limit(1);

      console.log("[search] By UUID result:", patientByUuid, "| Error:", uuidError);
      if (patientByUuid && patientByUuid.length > 0) {
        console.log("[search] ✅ Found by UUID:", patientByUuid[0].patient_id, "| Full name:", patientByUuid[0].full_name);
        return NextResponse.json({ patient_id: patientByUuid[0].patient_id });
      }
    }

    // Not found
    console.log("[search] ❌ Patient not found for query:", searchTerm, "| Tried: ID, name, UUID");
    return NextResponse.json(
      { error: "Patient not found" },
      { status: 404 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Search error";
    console.error("[search] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
