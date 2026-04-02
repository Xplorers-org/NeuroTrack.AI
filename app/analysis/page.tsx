"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisSidebar } from "@/components/analysis/analysis-sidebar";
import { PatientInfoForm, PatientData } from "@/components/analysis/patient-info-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AnalysisPage() {
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foundPatient, setFoundPatient] = useState<{ fullName: string; patientId: string; age: string; gender: string } | null>(null);

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
            test_time: new Date().toISOString(),
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

        setCompletedSteps((prev) => [...prev, "patient-info"]);
        router.push("/analysis/voice");
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
        
        const patientData = {
          fullName: result.patient.full_name,
          patientId: result.patient.patient_id,
          gender: result.patient.gender,
          age: result.patient.age.toString(),
        };

        sessionStorage.setItem("patientData", JSON.stringify(patientData));
        sessionStorage.setItem("sessionId", result.session_id);
        
        setFoundPatient(patientData);
      }
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

      {/* Patient Found Modal */}
      {foundPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card dark:bg-[#161b26] border border-border dark:border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">Patient Records Found</h3>
            <p className="text-sm text-muted-foreground dark:text-gray-400 mb-6">Verify the details below before proceeding.</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between border-b border-border dark:border-white/5 pb-3">
                <span className="text-muted-foreground">Full Name</span>
                <span className="font-medium text-foreground dark:text-white">{foundPatient.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-border dark:border-white/5 pb-3">
                <span className="text-muted-foreground">Patient ID</span>
                <span className="font-medium text-foreground dark:text-white">{foundPatient.patientId}</span>
              </div>
              <div className="flex justify-between border-b border-border dark:border-white/5 pb-3">
                <span className="text-muted-foreground">Age</span>
                <span className="font-medium text-foreground dark:text-white">{foundPatient.age} years</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-muted-foreground">Gender</span>
                <span className="font-medium text-foreground dark:text-white capitalize">{foundPatient.gender}</span>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button 
                variant="secondary"
                className="w-1/3 bg-secondary dark:bg-[#1a1f2e] hover:bg-secondary/80 dark:hover:bg-[#252b3b] border-0 text-foreground dark:text-white"
                onClick={() => setFoundPatient(null)}
              >
                Cancel
              </Button>
              <Button 
                className="w-2/3 bg-primary hover:bg-primary/90"
                onClick={() => {
                  setFoundPatient(null);
                  setCompletedSteps((prev) => [...prev, "patient-info"]);
                  router.push("/analysis/voice");
                }}
              >
                Proceed to Analysis
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}