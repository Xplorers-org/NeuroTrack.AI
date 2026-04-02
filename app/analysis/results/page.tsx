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
  const [voiceResult, setVoiceResult] = useState<any>(null);
  const [gaitResult, setGaitResult] = useState<any>(null);
  const [drawingResult, setDrawingResult] = useState<any>(null);
  
  const completedSteps = ["patient-info", "voice", "drawing", "gait"];

  useEffect(() => {
    const storedData = sessionStorage.getItem("patientData");
    if (storedData) setPatientData(JSON.parse(storedData));

    const vResult = sessionStorage.getItem("voiceResult");
    if (vResult) setVoiceResult(JSON.parse(vResult));

    const gResult = sessionStorage.getItem("gaitResult");
    if (gResult) setGaitResult(JSON.parse(gResult));

    const dResult = sessionStorage.getItem("drawingResult");
    if (dResult) setDrawingResult(JSON.parse(dResult));
  }, []);

  const getProgress = () => {
    return { current: 4, total: 4 }; // Results should be 4 out of 4 or 3 out of 3? Wait, completedSteps is 4 items.
  };

  // Safe formatting functions
  const formatVoiceScore = () => {
    if (!voiceResult) return "N/A";
    return Number(voiceResult.prediction)?.toFixed(2) || "N/A";
  };

  const formatGaitScore = () => {
    if (!gaitResult) return "N/A";
    return Number(gaitResult.gait_score)?.toFixed(2) || "N/A";
  };

  const formatDrawingScore = () => {
    if (!drawingResult) return "N/A";
    // Average spiral and wave probability (0-1) to percentage
    const spiral = Number(drawingResult.spiral?.sigmoid_probability || 0);
    const wave = Number(drawingResult.wave?.sigmoid_probability || 0);
    return (((spiral + wave) / 2) * 100).toFixed(1) + "%";
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
            <p className="text-muted-foreground dark:text-gray-400 mb-2">Overall Assessment Status</p>
            <div className="text-4xl font-bold text-primary mb-2">Analysis Complete</div>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Review individual component scores below
            </p>
          </div>

          {/* Individual Results */}
          <div className="space-y-4 mb-8">
            <div className="bg-card dark:bg-[#161b26] rounded-xl border border-border dark:border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground dark:text-white">Voice Analysis (UPDRS)</h3>
                <span className="text-2xl font-bold text-green-500">{formatVoiceScore()}</span>
              </div>
              <p className="text-sm text-muted-foreground dark:text-gray-400 mt-3">
                Predicted UPDRS score based on voice features.
              </p>
            </div>

            <div className="bg-card dark:bg-[#161b26] rounded-xl border border-border dark:border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground dark:text-white">Gait Analysis</h3>
                <span className="text-2xl font-bold text-yellow-500">{formatGaitScore()}</span>
              </div>
              <p className="text-sm text-muted-foreground dark:text-gray-400 mt-3 mb-4">
                Severity score based on pose estimation variance.
              </p>
              
              {gaitResult?.annotated_video_url && (
                <div className="mt-4 border-t border-border dark:border-white/10 pt-4">
                  <h4 className="text-sm font-medium text-foreground dark:text-white mb-2">Pose Estimation (Annotated)</h4>
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    crossOrigin="anonymous"
                    src={gaitResult.annotated_video_url}
                    className="w-full max-w-md rounded-lg overflow-hidden border border-border dark:border-white/10 shadow-sm"
                  />
                </div>
              )}
            </div>

            <div className="bg-card dark:bg-[#161b26] rounded-xl border border-border dark:border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground dark:text-white">Drawing Analysis</h3>
                <span className="text-2xl font-bold text-red-500">{formatDrawingScore()}</span>
              </div>
              <p className="text-sm text-muted-foreground dark:text-gray-400 mt-3">
                Parkinson's probability based on micro-tremors in spiral and wave drawings.
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
              onClick={() => router.push("/analysis")}
              className="border-border dark:border-white/10"
            >
              Start New Analysis
            </Button>
            <Button
              onClick={() => {
                sessionStorage.clear();
                router.push("/");
              }}
              className="bg-primary hover:bg-primary/90"
            >
              Finish & Return Home
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
