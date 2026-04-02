"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisSidebar } from "@/components/analysis/analysis-sidebar";
import { PatientInfoForm, PatientData } from "@/components/analysis/patient-info-form";

export default function AnalysisPage() {
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const handlePatientInfoNext = (data: PatientData) => {
    sessionStorage.setItem("patientData", JSON.stringify(data));
    setCompletedSteps([...completedSteps, "patient-info"]);
    router.push("/analysis/voice");
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
          <PatientInfoForm onNext={handlePatientInfoNext} onPrevious={() => router.push("/")} />
        </div>
      </main>
    </div>
  );
}