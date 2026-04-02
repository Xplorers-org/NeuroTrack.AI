"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnalysisSidebar } from "@/components/analysis/analysis-sidebar";
import { StepIndicator } from "@/components/analysis/step-indicator";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const drawingSteps = [
  { id: 1, title: "Upload", subtitle: "Spiral and wave drawings" },
  { id: 2, title: "Preview", subtitle: "Review your drawing" },
  { id: 3, title: "Submit", subtitle: "Confirm and analyze" },
];

export default function DrawingAnalysisPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [spiralFile, setSpiralFile] = useState<File | null>(null);
  const [waveFile, setWaveFile] = useState<File | null>(null);
  const spiralInputRef = useRef<HTMLInputElement>(null);
  const waveInputRef = useRef<HTMLInputElement>(null);
  const [completedSteps] = useState<string[]>(["patient-info", "voice", "gait"]);

  const handleSpiralFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSpiralFile(file);
    }
  };

  const handleWaveFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setWaveFile(file);
    }
  };

  const hasUploads = Boolean(spiralFile && waveFile);

  const getProgress = () => {
    return { current: completedSteps.length, total: 3 };
  };

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0a0e17]">
      <AnalysisSidebar
        currentStep="drawing"
        completedSteps={completedSteps}
        progress={getProgress()}
      />

      <main className="flex-1 ml-60">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
              Drawing Analysis
            </h1>
            <p className="text-muted-foreground dark:text-gray-400 mt-2">
              Upload spiral and wave drawings for fine motor control assessment.
            </p>
          </div>

          <StepIndicator steps={drawingSteps} currentStep={step} />

          {step === 1 && (
            <div className="w-full">
              <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-8">
                <h3 className="text-xl font-semibold text-foreground dark:text-white mb-1">
                  Upload Files
                </h3>
                <p className="text-sm text-muted-foreground dark:text-gray-400 mb-8">
                  Spiral and wave drawings
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div
                    className={cn(
                      "rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200",
                      spiralFile
                        ? "border-primary bg-primary/5"
                        : "border-border dark:border-white/20 hover:border-primary/50"
                    )}
                  >
                    <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-secondary dark:bg-white/5 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-muted-foreground dark:text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-foreground dark:text-white mb-2">
                      Upload Spiral
                    </h4>
                    <p className="text-sm text-muted-foreground dark:text-gray-400 mb-5">
                      Support: PNG, JPG, JPEG
                    </p>
                    <input
                      type="file"
                      ref={spiralInputRef}
                      accept="image/*"
                      onChange={handleSpiralFileSelect}
                      className="hidden"
                    />
                    <Button
                      onClick={() => spiralInputRef.current?.click()}
                      className="bg-primary hover:bg-primary/90 px-6"
                    >
                      Choose Spiral File
                    </Button>
                    {spiralFile && (
                      <p className="text-sm text-primary mt-4 truncate px-4">
                        {spiralFile.name}
                      </p>
                    )}
                  </div>

                  <div
                    className={cn(
                      "rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200",
                      waveFile
                        ? "border-primary bg-primary/5"
                        : "border-border dark:border-white/20 hover:border-primary/50"
                    )}
                  >
                    <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-secondary dark:bg-white/5 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-muted-foreground dark:text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-foreground dark:text-white mb-2">
                      Upload Wave
                    </h4>
                    <p className="text-sm text-muted-foreground dark:text-gray-400 mb-5">
                      Support: PNG, JPG, JPEG
                    </p>
                    <input
                      type="file"
                      ref={waveInputRef}
                      accept="image/*"
                      onChange={handleWaveFileSelect}
                      className="hidden"
                    />
                    <Button
                      onClick={() => waveInputRef.current?.click()}
                      className="bg-primary hover:bg-primary/90 px-6"
                    >
                      Choose Wave File
                    </Button>
                    {waveFile && (
                      <p className="text-sm text-primary mt-4 truncate px-4">
                        {waveFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-amber-500/10 dark:bg-amber-900/20 border border-amber-500/30 dark:border-amber-500/20 rounded-xl px-5 py-4">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <span className="font-semibold">Note:</span> Upload one spiral and one wave drawing for best analysis results.
                </p>
              </div>

              <div className="flex items-center justify-between mt-8">
                <Button
                  variant="secondary"
                  onClick={() => router.push("/analysis/gait")}
                  className="bg-secondary dark:bg-[#1a1f2e] hover:bg-secondary/80 dark:hover:bg-[#252b3b] border-0 text-foreground dark:text-white px-6"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!hasUploads}
                  className={cn(
                    "px-8",
                    hasUploads
                      ? "bg-primary hover:bg-primary/90"
                      : "bg-muted dark:bg-white/10 text-muted-foreground dark:text-gray-500 cursor-not-allowed"
                  )}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-8">
              <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">
                Preview
              </h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400 mb-6">
                Review your drawing
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-secondary dark:bg-[#0f1219] rounded-xl p-4">
                  <p className="mb-3 text-sm font-medium text-foreground dark:text-white">Spiral Drawing</p>
                  {spiralFile ? (
                    <img
                      src={URL.createObjectURL(spiralFile)}
                      alt="Uploaded spiral drawing"
                      className="max-w-full max-h-80 rounded-lg mx-auto"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground dark:text-gray-400">No spiral file uploaded</p>
                  )}
                </div>

                <div className="bg-secondary dark:bg-[#0f1219] rounded-xl p-4">
                  <p className="mb-3 text-sm font-medium text-foreground dark:text-white">Wave Drawing</p>
                  {waveFile ? (
                    <img
                      src={URL.createObjectURL(waveFile)}
                      alt="Uploaded wave drawing"
                      className="max-w-full max-h-80 rounded-lg mx-auto"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground dark:text-gray-400">No wave file uploaded</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  variant="secondary"
                  onClick={() => setStep(1)}
                  className="bg-secondary dark:bg-[#1a1f2e] hover:bg-secondary/80 dark:hover:bg-[#252b3b] border-0 text-foreground dark:text-white px-6"
                >
                  Edit Uploads
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="bg-primary hover:bg-primary/90 px-8"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-8">
              <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">
                Submit
              </h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400 mb-6">
                Confirm and analyze
              </p>

              <div className="bg-secondary dark:bg-[#0f1219] rounded-xl p-6 mb-6">
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground dark:text-gray-400">Drawing Status</span>
                  <span className="font-medium text-primary">{hasUploads ? "Ready for analysis" : "Pending uploads"}</span>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  variant="secondary"
                  onClick={() => setStep(2)}
                  className="bg-secondary dark:bg-[#1a1f2e] hover:bg-secondary/80 dark:hover:bg-[#252b3b] border-0 text-foreground dark:text-white px-6"
                >
                  Back
                </Button>
                <Button
                  onClick={() => router.push("/analysis/dashboard")}
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
