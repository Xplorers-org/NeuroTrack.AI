"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisSidebar } from "@/components/analysis/analysis-sidebar";
import { PatientInfoForm, PatientData } from "@/components/analysis/patient-info-form";
import { toast } from "sonner";

export default function AnalysisPage() {
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePatientInfoNext = async (data: PatientData, mode: "register" | "find") => {
    setIsSubmitting(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/patients/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_id: data.patientId,
            full_name: data.fullName,
            gender: data.gender,
            age: parseInt(data.age, 10),
            test_time: new Date().toISOString(), // DB expects timestamptz
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to register patient");
        }

        const result = await res.json();
        
        sessionStorage.setItem("patientData", JSON.stringify({
          fullName: result.patient.full_name,
          patientId: result.patient.patient_id,
          gender: result.patient.gender,
          age: result.patient.age.toString(),
        }));
        sessionStorage.setItem("sessionId", result.session_id);

      } else {
        const res = await fetch("/api/patients/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_id: data.patientId,
            test_time: new Date().toISOString(),
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Patient not found or session failed");
        }

        const result = await res.json();
        
        sessionStorage.setItem("patientData", JSON.stringify({
          fullName: result.patient.full_name,
          patientId: result.patient.patient_id,
          gender: result.patient.gender,
          age: result.patient.age.toString(),
        }));
        sessionStorage.setItem("sessionId", result.session_id);
      }

      setCompletedSteps((prev) => [...prev, "patient-info"]);
      router.push("/analysis/voice");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0a0e17]">
      <AnalysisSidebar currentStep="patient-info" completedSteps={completedSteps} progress={{ current: completedSteps.length, total: 3 }} />
      <main className="flex-1 ml-60">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">Patient Information</h1>
            <p className="text-muted-foreground dark:text-gray-400 mt-2">Please provide patient details before starting the analysis.</p>
          </div>
          <div className={isSubmitting ? "opacity-50 pointer-events-none" : ""}>
            <PatientInfoForm onNext={handlePatientInfoNext} onPrevious={() => router.push("/")} />
          </div>
        </div>
      </main>
    </div>
  );
}