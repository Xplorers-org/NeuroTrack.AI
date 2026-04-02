"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisSidebar } from "@/components/analysis/analysis-sidebar";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Activity, Brain, TrendingUp } from "lucide-react";
import { PatientData } from "@/components/analysis/patient-info-form";

export default function DashboardPage() {
  const router = useRouter();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const completedSteps = ["patient-info", "voice", "gait", "drawing"];

  useEffect(() => {
    const storedData = sessionStorage.getItem("patientData");
    if (storedData) {
      setPatientData(JSON.parse(storedData));
    }
  }, []);

  const getProgress = () => {
    return { current: 3, total: 3 };
  };

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0a0e17]">
      <AnalysisSidebar
        currentStep="dashboard"
        completedSteps={completedSteps}
        progress={getProgress()}
      />

      <main className="flex-1 ml-60">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
              Analysis Dashboard
            </h1>
            <p className="text-muted-foreground dark:text-gray-400 mt-2">
              Overview of all completed analyses
            </p>
          </div>

          {/* Success Message */}
          <div className="bg-green-500/10 dark:bg-green-900/20 border border-green-500/30 dark:border-green-500/20 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-400">
                  All Analyses Complete
                </h3>
                <p className="text-sm text-green-600 dark:text-green-500">
                  All three analyses have been submitted successfully. Results are being processed.
                </p>
              </div>
            </div>
          </div>

          {/* Patient Summary */}
          <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-6 mb-6">
            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
              Patient Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary dark:bg-[#0f1219] rounded-xl p-4">
                <p className="text-sm text-muted-foreground dark:text-gray-400">Name</p>
                <p className="font-medium text-foreground dark:text-white">
                  {patientData?.fullName || "N/A"}
                </p>
              </div>
              <div className="bg-secondary dark:bg-[#0f1219] rounded-xl p-4">
                <p className="text-sm text-muted-foreground dark:text-gray-400">Patient ID</p>
                <p className="font-medium text-foreground dark:text-white">
                  {patientData?.patientId || "N/A"}
                </p>
              </div>
              <div className="bg-secondary dark:bg-[#0f1219] rounded-xl p-4">
                <p className="text-sm text-muted-foreground dark:text-gray-400">Gender</p>
                <p className="font-medium text-foreground dark:text-white capitalize">
                  {patientData?.gender || "N/A"}
                </p>
              </div>
              <div className="bg-secondary dark:bg-[#0f1219] rounded-xl p-4">
                <p className="text-sm text-muted-foreground dark:text-gray-400">Age</p>
                <p className="font-medium text-foreground dark:text-white">
                  {patientData?.age || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Analysis Status Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card dark:bg-[#161b26] rounded-xl border border-border dark:border-white/10 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground dark:text-white">Voice Analysis</p>
                  <p className="text-xs text-green-500">Completed</p>
                </div>
              </div>
              <div className="h-1 bg-green-500 rounded-full" />
            </div>

            <div className="bg-card dark:bg-[#161b26] rounded-xl border border-border dark:border-white/10 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground dark:text-white">Gait Analysis</p>
                  <p className="text-xs text-green-500">Completed</p>
                </div>
              </div>
              <div className="h-1 bg-green-500 rounded-full" />
            </div>

            <div className="bg-card dark:bg-[#161b26] rounded-xl border border-border dark:border-white/10 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground dark:text-white">Drawing Analysis</p>
                  <p className="text-xs text-green-500">Completed</p>
                </div>
              </div>
              <div className="h-1 bg-green-500 rounded-full" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="border-border dark:border-white/10"
            >
              Back to Home
            </Button>
            <Button
              onClick={() => router.push("/analysis/results")}
              className="bg-primary hover:bg-primary/90"
            >
              View Results
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
