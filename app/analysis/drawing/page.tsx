"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnalysisCompleteDialog } from "@/components/analysis/analysis-complete-dialog";
import { AnalysisSidebar } from "@/components/analysis/analysis-sidebar";
import { StepIndicator } from "@/components/analysis/step-indicator";
import { Button } from "@/components/ui/button";
import { Upload, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const drawingSteps = [
  { id: 1, title: "Upload", subtitle: "Spiral and wave drawings" },
  { id: 2, title: "Preview", subtitle: "Review your drawing" },
  { id: 3, title: "Submit", subtitle: "Confirm and analyze" },
  { id: 4, title: "Results", subtitle: "View combined summary" },
];

export default function DrawingAnalysisPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [resultActionsOpen, setResultActionsOpen] = useState(false);
  const [spiralFile, setSpiralFile] = useState<File | null>(null);
  const [waveFile, setWaveFile] = useState<File | null>(null);
  const spiralInputRef = useRef<HTMLInputElement>(null);
  const waveInputRef = useRef<HTMLInputElement>(null);
  const [completedSteps] = useState<string[]>(["patient-info", "voice", "gait"]);

  const handleSpiralFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (waveFile) {
      return;
    }

    const file = e.target.files?.[0];
    if (file) {
      setSpiralFile(file);
    }
  };

  const handleWaveFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (spiralFile) {
      return;
    }

    const file = e.target.files?.[0];
    if (file) {
      setWaveFile(file);
    }
  };

  const removeSpiralFile = () => {
    setSpiralFile(null);
    if (spiralInputRef.current) {
      spiralInputRef.current.value = "";
    }
  };

  const removeWaveFile = () => {
    setWaveFile(null);
    if (waveInputRef.current) {
      waveInputRef.current.value = "";
    }
  };

  const previewFile = spiralFile ?? waveFile;
  const previewLabel = spiralFile ? "Spiral Drawing" : waveFile ? "Wave Drawing" : "Drawing Preview";

  const hasUploads = Boolean(spiralFile || waveFile);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSubmitDrawing = () => {
    if (!previewFile) {
      return;
    }

    const existingHistory = sessionStorage.getItem("analysisHistory");
    const parsedHistory: Array<Record<string, string | number>> = existingHistory
      ? JSON.parse(existingHistory)
      : [];

    parsedHistory.push({
      id: `${Date.now()}-drawing`,
      type: "drawing",
      source: previewLabel,
      fileName: previewFile.name,
      fileSize: formatFileSize(previewFile.size),
      score: 82,
      severity: "Stable",
      submittedAt: new Date().toISOString(),
    });

    sessionStorage.setItem("analysisHistory", JSON.stringify(parsedHistory));
    setStep(4);
  };

  const closeDialogAndNavigate = (path: string) => {
    setResultActionsOpen(false);
    router.push(path);
  };

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
              Upload spiral or wave drawings for fine motor control assessment.
            </p>
          </div>

          <StepIndicator steps={drawingSteps} currentStep={step} />

          {step === 1 && (
            <div className="w-full">
              <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-8">
                <h3 className="text-xl font-semibold text-foreground dark:text-white mb-1">
                  Upload a File
                </h3>
                <p className="text-sm text-muted-foreground dark:text-gray-400 mb-8">
                  Spiral or Wave drawing for analysis
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
                      Upload Spiral Drawing
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
                      disabled={!!spiralFile || !!waveFile}
                      className="bg-primary hover:bg-primary/90 px-6 disabled:cursor-not-allowed disabled:bg-muted dark:disabled:bg-white/10 disabled:text-muted-foreground dark:disabled:text-gray-500"
                    >
                      Choose File
                    </Button>
                    {spiralFile && (
                      <div className="mt-4 flex flex-col items-center gap-2">
                        <p className="inline-flex items-center gap-2 text-sm text-emerald-500 truncate max-w-full px-2">
                          <CircleCheck className="w-4 h-4 shrink-0" />
                          <span className="truncate">{spiralFile.name}</span>
                        </p>
                        <button
                          type="button"
                          onClick={removeSpiralFile}
                          className="text-sm text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
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
                      Upload Wave Drawing
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
                      disabled={!!waveFile || !!spiralFile}
                      className="bg-primary hover:bg-primary/90 px-6 disabled:cursor-not-allowed disabled:bg-muted dark:disabled:bg-white/10 disabled:text-muted-foreground dark:disabled:text-gray-500"
                    >
                      Choose File
                    </Button>
                    {waveFile && (
                      <div className="mt-4 flex flex-col items-center gap-2">
                        <p className="inline-flex items-center gap-2 text-sm text-emerald-500 truncate max-w-full px-2">
                          <CircleCheck className="w-4 h-4 shrink-0" />
                          <span className="truncate">{waveFile.name}</span>
                        </p>
                        <button
                          type="button"
                          onClick={removeWaveFile}
                          className="text-sm text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-amber-500/10 dark:bg-amber-900/20 border border-amber-500/30 dark:border-amber-500/20 rounded-xl px-5 py-4">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <span className="font-semibold">Note:</span> Upload one drawing only spiral or wave. Remove the current file before choosing another one.
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
                Review the selected drawing
              </p>

              <div className="bg-secondary dark:bg-[#0f1219] rounded-xl p-4">
                <p className="mb-3 text-sm font-medium text-foreground dark:text-white">{previewLabel}</p>
                {previewFile ? (
                  <div className="space-y-4">
                    <Image
                      src={URL.createObjectURL(previewFile)}
                      alt={`Uploaded ${previewLabel.toLowerCase()}`}
                      width={600}
                      height={600}
                      unoptimized
                      className="max-w-full h-auto rounded-lg mx-auto"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <p className="inline-flex items-center gap-2 text-sm text-emerald-500 truncate max-w-full px-2">
                        <CircleCheck className="w-4 h-4 shrink-0" />
                        <span className="truncate">{previewFile.name}</span>
                      </p>
                    
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground dark:text-gray-400">No drawing uploaded</p>
                )}
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
                  onClick={handleSubmitDrawing}
                  className="bg-primary hover:bg-primary/90 px-8"
                >
                  Submit for Analysis
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-8">
              <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">
                Results
              </h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400 mb-6">
                Drawing analysis result summary
              </p>

              <div className="space-y-4">
                <div className="bg-secondary dark:bg-[#0f1219] rounded-xl p-5">
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Drawing Score</p>
                  <p className="text-4xl font-bold text-primary">82.0</p>
                  <p className="text-sm text-emerald-500 font-medium">Stable</p>
                </div>

                <div className="bg-secondary dark:bg-[#0f1219] rounded-xl p-5">
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Drawing Submitted</p>
                  <p className="text-sm text-foreground dark:text-white break-all">
                    {previewFile ? `${previewFile.name} (${formatFileSize(previewFile.size)})` : "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  variant="secondary"
                  onClick={() => setStep(3)}
                  className="bg-secondary dark:bg-[#1a1f2e] hover:bg-secondary/80 dark:hover:bg-[#252b3b] border-0 text-foreground dark:text-white px-6"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setResultActionsOpen(true)}
                  className="bg-primary hover:bg-primary/90 px-8"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <AnalysisCompleteDialog
        open={resultActionsOpen}
        onOpenChange={setResultActionsOpen}
        completedAnalysisLabel="drawing"
        primaryActions={[
          { label: "Continue to Voice Analysis", onClick: () => closeDialogAndNavigate("/analysis/voice") },
          { label: "Continue to Gait Analysis", onClick: () => closeDialogAndNavigate("/analysis/gait") },
        ]}
        onViewCurrentResult={() => {
          setResultActionsOpen(false);
          setStep(4);
        }}
        onViewDashboard={() => closeDialogAndNavigate("/analysis/dashboard")}
      />
    </div>
  );
}
