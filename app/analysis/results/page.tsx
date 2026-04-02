"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisSidebar } from "@/components/analysis/analysis-sidebar";
import { Button } from "@/components/ui/button";
import { Download, Share2, Printer } from "lucide-react";
import { PatientData } from "@/components/analysis/patient-info-form";

export default function ResultsPage() {
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
        currentStep="results"
        completedSteps={completedSteps}
        progress={getProgress()}
      />

      <main className="flex-1 ml-60">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
                Analysis Results
              </h1>
              <p className="text-muted-foreground dark:text-gray-400 mt-2">
                Comprehensive neurological assessment report
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="border-border dark:border-white/10">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="border-border dark:border-white/10">
                <Printer className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="border-border dark:border-white/10">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Overall Score */}
          <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-8 mb-6 text-center">
            <p className="text-muted-foreground dark:text-gray-400 mb-2">Overall Assessment Score</p>
            <div className="text-6xl font-bold text-primary mb-2">78</div>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Low risk indicators detected
            </p>
          </div>

          {/* Individual Results */}
          <div className="space-y-4 mb-8">
            <div className="bg-card dark:bg-[#161b26] rounded-xl border border-border dark:border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground dark:text-white">Voice Analysis</h3>
                <span className="text-2xl font-bold text-green-500">85</span>
              </div>
              <div className="h-2 bg-secondary dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: "85%" }} />
              </div>
              <p className="text-sm text-muted-foreground dark:text-gray-400 mt-3">
                Voice patterns show normal tremor levels and speech clarity.
              </p>
            </div>

            <div className="bg-card dark:bg-[#161b26] rounded-xl border border-border dark:border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground dark:text-white">Gait Analysis</h3>
                <span className="text-2xl font-bold text-yellow-500">72</span>
              </div>
              <div className="h-2 bg-secondary dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: "72%" }} />
              </div>
              <p className="text-sm text-muted-foreground dark:text-gray-400 mt-3">
                Minor gait irregularities detected. Recommend follow-up assessment.
              </p>
            </div>

            <div className="bg-card dark:bg-[#161b26] rounded-xl border border-border dark:border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground dark:text-white">Drawing Analysis</h3>
                <span className="text-2xl font-bold text-green-500">82</span>
              </div>
              <div className="h-2 bg-secondary dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: "82%" }} />
              </div>
              <p className="text-sm text-muted-foreground dark:text-gray-400 mt-3">
                Fine motor control within normal parameters.
              </p>
            </div>
          </div>

          {/* Patient Info */}
          <div className="bg-card dark:bg-[#161b26] rounded-xl border border-border dark:border-white/10 p-6 mb-8">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground dark:text-gray-400">Name:</span>{" "}
                <span className="text-foreground dark:text-white">{patientData?.fullName || "N/A"}</span>
              </div>
              <div>
                <span className="text-muted-foreground dark:text-gray-400">ID:</span>{" "}
                <span className="text-foreground dark:text-white">{patientData?.patientId || "N/A"}</span>
              </div>
              <div>
                <span className="text-muted-foreground dark:text-gray-400">Age:</span>{" "}
                <span className="text-foreground dark:text-white">{patientData?.age || "N/A"}</span>
              </div>
              <div>
                <span className="text-muted-foreground dark:text-gray-400">Gender:</span>{" "}
                <span className="text-foreground dark:text-white capitalize">{patientData?.gender || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/analysis/dashboard")}
              className="border-border dark:border-white/10"
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={() => {
                sessionStorage.clear();
                router.push("/");
              }}
              className="bg-primary hover:bg-primary/90"
            >
              Start New Analysis
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
