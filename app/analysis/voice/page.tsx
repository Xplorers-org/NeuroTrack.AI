"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnalysisSidebar } from "@/components/analysis/analysis-sidebar";
import { StepIndicator } from "@/components/analysis/step-indicator";
import { VoiceAnalysis } from "@/components/analysis/voice-analysis";
import { PatientData } from "@/components/analysis/patient-info-form";
import { Button } from "@/components/ui/button";

const voiceSteps = [
  { id: 1, title: "Upload/Record", subtitle: "Voice sample" },
  { id: 2, title: "Preview", subtitle: "Review your recording" },
  { id: 3, title: "Submit", subtitle: "Confirm and analyze" },
];

export default function VoiceAnalysisPage() {
  const router = useRouter();
  const [voiceStep, setVoiceStep] = useState(1);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [audioData, setAudioData] = useState<File | Blob | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>(["patient-info"]);

  useEffect(() => {
    // Get patient data from sessionStorage
    const storedData = sessionStorage.getItem("patientData");
    if (storedData) {
      setPatientData(JSON.parse(storedData));
    }
  }, []);

  const handleVoiceNext = (file: File | Blob) => {
    setAudioData(file);
    setVoiceStep(2);
  };

  const handleVoicePrevious = () => {
    if (voiceStep > 1) {
      setVoiceStep(voiceStep - 1);
    } else {
      router.push("/analysis");
    }
  };

  const getProgress = () => {
    return { current: completedSteps.length, total: 3 };
  };

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0a0e17]">
      {/* Sidebar */}
      <AnalysisSidebar
        currentStep="voice"
        completedSteps={completedSteps}
        progress={getProgress()}
      />

      {/* Main Content */}
      <main className="flex-1 ml-60">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
              Voice Analysis
            </h1>
            <p className="text-muted-foreground dark:text-gray-400 mt-2">
              Record or upload your voice sample for Parkinson&apos;s disease
              prediction analysis.
            </p>
          </div>

          {/* Step Indicator */}
          <StepIndicator steps={voiceSteps} currentStep={voiceStep} />

          {/* Voice Analysis Content */}
          {voiceStep === 1 && (
            <VoiceAnalysis
              onNext={handleVoiceNext}
              onPrevious={handleVoicePrevious}
            />
          )}

          {voiceStep === 2 && (
            <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-8">
              <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">
                Preview
              </h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400 mb-6">
                Review your recording
              </p>
              
              {audioData && (
                <div className="bg-secondary dark:bg-[#0f1219] rounded-xl p-6 mb-6">
                  <audio
                    controls
                    src={URL.createObjectURL(audioData)}
                    className="w-full"
                  />
                </div>
              )}

              <div className="flex justify-between mt-8">
                <Button
                  variant="secondary"
                  onClick={() => setVoiceStep(1)}
                  className="bg-secondary dark:bg-[#1a1f2e] hover:bg-secondary/80 dark:hover:bg-[#252b3b] border-0 text-foreground dark:text-white px-6"
                >
                  Re-record
                </Button>
                <Button
                  onClick={() => setVoiceStep(3)}
                  className="bg-primary hover:bg-primary/90 px-8"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {voiceStep === 3 && (
            <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-8">
              <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">
                Submit
              </h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400 mb-6">
                Confirm and analyze
              </p>

              <div className="bg-secondary dark:bg-[#0f1219] rounded-xl p-6 mb-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border dark:border-white/10">
                  <span className="text-muted-foreground dark:text-gray-400">Patient Name</span>
                  <span className="font-medium text-foreground dark:text-white">
                    {patientData?.fullName || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border dark:border-white/10">
                  <span className="text-muted-foreground dark:text-gray-400">Patient ID</span>
                  <span className="font-medium text-foreground dark:text-white">
                    {patientData?.patientId || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border dark:border-white/10">
                  <span className="text-muted-foreground dark:text-gray-400">Gender</span>
                  <span className="font-medium text-foreground dark:text-white capitalize">
                    {patientData?.gender || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border dark:border-white/10">
                  <span className="text-muted-foreground dark:text-gray-400">Age</span>
                  <span className="font-medium text-foreground dark:text-white">
                    {patientData?.age || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground dark:text-gray-400">Audio Status</span>
                  <span className="font-medium text-primary">Ready for analysis</span>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  variant="secondary"
                  onClick={() => setVoiceStep(2)}
                  className="bg-secondary dark:bg-[#1a1f2e] hover:bg-secondary/80 dark:hover:bg-[#252b3b] border-0 text-foreground dark:text-white px-6"
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    setCompletedSteps([...completedSteps, "voice"]);
                    router.push("/analysis/gait");
                  }}
                  className="bg-primary hover:bg-primary/90 px-8"
                >
                  Submit for Analysis
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
