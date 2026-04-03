"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnalysisSidebar } from "@/components/analysis/analysis-sidebar";
import { AnalysisCompleteDialog } from "@/components/analysis/analysis-complete-dialog";
import { StepIndicator } from "@/components/analysis/step-indicator";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const drawingSteps = [
  { id: 1, title: "Upload", subtitle: "Spiral and wave drawings" },
  { id: 2, title: "Preview", subtitle: "Review your drawing" },
  { id: 3, title: "Submit", subtitle: "Confirm and analyze" },
  { id: 4, title: "Results", subtitle: "View summary" },
];

type PatientSessionData = {
  fullName?: string;
  patientId?: string;
  gender?: string;
  age?: string | number;
};

type DrawingAnalysisResult = {
  drawing_type: string;
  motor_impairment_score: number;
  severity_level: string;
  description: string;
  raw_logit?: number;
  sigmoid_probability?: number;
  is_parkinson?: boolean;
  saved?: boolean;
};

type StoredDrawingResult = {
  spiral?: DrawingAnalysisResult;
  wave?: DrawingAnalysisResult;
};

export default function DrawingAnalysisPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [resultActionsOpen, setResultActionsOpen] = useState(false);
  const [patientData, setPatientData] = useState<PatientSessionData | null>(
    null,
  );
  const [spiralFile, setSpiralFile] = useState<File | null>(null);
  const [waveFile, setWaveFile] = useState<File | null>(null);
  const spiralInputRef = useRef<HTMLInputElement>(null);
  const waveInputRef = useRef<HTMLInputElement>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([
    "patient-info",
    "voice",
  ]);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drawingResult, setDrawingResult] =
    useState<StoredDrawingResult | null>(null);

  useEffect(() => {
    const storedSession = sessionStorage.getItem("sessionId");
    if (storedSession) setSessionId(storedSession);

    const storedPatient = sessionStorage.getItem("patientData");
    if (storedPatient) setPatientData(JSON.parse(storedPatient));

    const storedDrawingResult = sessionStorage.getItem("drawingResult");
    if (storedDrawingResult) setDrawingResult(JSON.parse(storedDrawingResult));
  }, []);

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
  const previewLabel = spiralFile
    ? "Spiral Drawing"
    : waveFile
      ? "Wave Drawing"
      : "Drawing Preview";
  const previewType = spiralFile ? "spiral" : waveFile ? "wave" : "";

  const hasUploads = Boolean(spiralFile || waveFile);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const closeDialogAndNavigate = (path: string) => {
    setResultActionsOpen(false);
    router.push(path);
  };

  const getSeverityFromScore = (score: number) => {
    if (score < 38) return "Normal Pattern";
    if (score < 55) return "Mild";
    if (score < 70) return "Moderate";
    if (score < 85) return "High";
    return "Severe";
  };

  const getSeverityDescription = (severity: string) => {
    if (severity === "Normal Pattern")
      return "No motor impairment.";
    if (severity === "Mild")
      return "Slight motor irregularities observed.";
    if (severity === "Moderate")
      return "Noticeable motor impairment.";
    if (severity === "High")
      return "Significant motor impairment.";
    return "Strong Parkinsonian motor patterns observed.";
  };

  const getSeverityColor = (score: number) => {
    if (score < 38) return "green";
    if (score < 55) return "yellow";
    if (score < 70) return "orange";
    if (score < 85) return "orange-red";
    return "red";
  };

  const getSeverityBgColor = (score: number) => {
    const color = getSeverityColor(score);
    if (color === "green") return "bg-green-100 dark:bg-green-500/30";
    if (color === "yellow") return "bg-yellow-100 dark:bg-yellow-500/30";
    if (color === "orange") return "bg-orange-100 dark:bg-orange-500/30";
    if (color === "orange-red") return "bg-orange-200 dark:bg-orange-600/40";
    return "bg-red-100 dark:bg-red-500/30";
  };

  const getSeverityTextColor = (score: number) => {
    const color = getSeverityColor(score);
    if (color === "green") return "text-green-600 dark:text-green-400";
    if (color === "yellow") return "text-yellow-600 dark:text-yellow-400";
    if (color === "orange") return "text-orange-500 dark:text-orange-400";
    if (color === "orange-red") return "text-orange-600 dark:text-orange-500";
    return "text-red-600 dark:text-red-500";
  };

  const getProgress = () => {
    return { current: completedSteps.length, total: 3 };
  };

  const submitAnalysis = async () => {
    if (!previewFile || !sessionId) {
      toast.error("Missing drawing file or session data.");
      return;
    }

    const drawingType = previewType;
    if (!drawingType) {
      toast.error("Please upload a spiral or wave drawing first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("session_id", sessionId);
      formData.append("drawing_type", drawingType);
      formData.append("file", previewFile);

      const res = await fetch("/api/analyze/drawing", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let message = "Failed to analyze drawing";
        try {
          const errData = await res.json();
          message = errData.error || message;
        } catch {
          const errorText = await res.text();
          if (errorText) message = errorText;
        }
        throw new Error(message);
      }

      const result: DrawingAnalysisResult = await res.json();
      setDrawingResult({ [drawingType]: result });
      sessionStorage.setItem(
        "drawingResult",
        JSON.stringify({ [drawingType]: result }),
      );

      toast.success("Drawing analysis complete.");

      setCompletedSteps([...completedSteps, "drawing"]);
      setStep(4);
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeResult = drawingResult?.spiral ?? drawingResult?.wave;
  const activeScore = activeResult?.motor_impairment_score;
  const activeSeverity =
    typeof activeScore === "number"
      ? getSeverityFromScore(activeScore)
      : "Pending";
  const activeSeverityDescription = getSeverityDescription(activeSeverity);
  const activeScoreText =
    typeof activeScore === "number" ? activeScore.toFixed(1) : "N/A";
  const activeProgressWidth =
    typeof activeScore === "number"
      ? `${Math.max(0, Math.min(activeScore, 100)).toFixed(2)}%`
      : "0%";

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
                        : "border-border dark:border-white/20 hover:border-primary/50",
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
                        : "border-border dark:border-white/20 hover:border-primary/50",
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
                  <span className="font-semibold">Note:</span> Upload one
                  drawing only spiral or wave. Remove the current file before
                  choosing another one.
                </p>
              </div>

              <div className="flex items-center justify-between mt-8">
                <Button
                  variant="secondary"
                  onClick={() => router.push("/analysis/voice")}
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
                      : "bg-muted dark:bg-white/10 text-muted-foreground dark:text-gray-500 cursor-not-allowed",
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
                <p className="mb-3 text-sm font-medium text-foreground dark:text-white">
                  {previewLabel}
                </p>
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
                  <p className="text-sm text-muted-foreground dark:text-gray-400">
                    No drawing uploaded
                  </p>
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
            <div className="space-y-6">
              <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-10 text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="w-18 h-18 rounded-full bg-primary/15 flex items-center justify-center">
                    <Upload className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-foreground dark:text-white">
                    Ready for Drawing Analysis
                  </h3>
                </div>
                <p className="text-md text-muted-foreground dark:text-gray-300 max-w-3xl mx-auto">
                  Your selected drawing will be analyzed to assess fine motor
                  control, tremor patterns, and movement stability related to
                  Parkinson&apos;s disease.
                </p>
              </div>

              <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-6">
                <h4 className="text-2xl font-semibold text-foreground dark:text-white mb-5">
                  Submission Summary
                </h4>
                <div className="grid sm:grid-cols-2 gap-4 text-base">
                  <p className="text-muted-foreground dark:text-gray-400">
                    Patient:
                  </p>
                  <p className="text-foreground dark:text-white font-semibold">
                    {patientData?.fullName || "N/A"}
                  </p>

                  <p className="text-muted-foreground dark:text-gray-400">
                    Age:
                  </p>
                  <p className="text-foreground dark:text-white font-semibold">
                    {patientData?.age || "N/A"}
                  </p>

                  <p className="text-muted-foreground dark:text-gray-400">
                    Gender:
                  </p>
                  <p className="text-foreground dark:text-white font-semibold capitalize">
                    {patientData?.gender || "N/A"}
                  </p>

                  <p className="text-muted-foreground dark:text-gray-400">
                    Drawing:
                  </p>
                  <p className="text-foreground dark:text-white font-semibold break-all">
                    {previewFile
                      ? `${previewLabel} (${formatFileSize(previewFile.size)})`
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-6">
                <h4 className="text-2xl font-semibold text-foreground dark:text-white mb-4">
                  About Drawing Analysis
                </h4>
                <ul className="space-y-2 text-muted-foreground dark:text-gray-300 list-disc list-inside">
                  <li>Drawing scores range from 0 to 100.</li>
                  <li>
                    Lower scores indicate steadier, more controlled drawing
                    motion.
                  </li>
                  <li>
                    Spiral drawings help assess tremor and fine motor symmetry.
                  </li>
                  <li>
                    Wave drawings help assess rhythm and movement consistency.
                  </li>
                </ul>
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  variant="secondary"
                  onClick={() => setStep(2)}
                  disabled={isSubmitting}
                  className="bg-secondary dark:bg-[#1a1f2e] hover:bg-secondary/80 dark:hover:bg-[#252b3b] border-0 text-foreground dark:text-white px-6"
                >
                  Back
                </Button>
                <Button
                  onClick={submitAnalysis}
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 px-8 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Submit for Analysis"
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-10">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
                      Analysis Results
                    </h3>
                    <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2">
                      Detailed results of your drawing analysis for
                      Parkinson&apos;s disease screening.
                    </p>
                  </div>
                  <Upload className="w-6 h-6 text-amber-500 shrink-0" />
                </div>

                <div className="mt-6 rounded-xl border border-primary/40 dark:border-primary/30 border-l-4 p-5 bg-primary/5 dark:bg-primary/10">
                  <h4 className="text-xl font-semibold text-primary mb-3">
                    Analysis Complete
                  </h4>
                  <p className="text-sm text-foreground dark:text-white">
                    Patient : <span className="font-semibold text-primary">{patientData?.fullName || "N/A"}</span>
                  </p>
                  <p className="text-sm text-foreground dark:text-white">
                    Patient Id : <span className="font-semibold text-primary">{patientData?.patientId || "N/A"}</span>
                  </p>
                  <p className="text-sm text-foreground dark:text-white">
                    Drawing Type : <span className="font-semibold text-primary">{activeResult?.drawing_type || previewLabel}</span>
                  </p>
                </div>

                <div className="border dark:bg-[#0f1219] rounded-xl p-10 mt-8">
                  <div className="text-center">
                    <p className="tracking-[0.2em] text-lg text-muted-foreground dark:text-gray-400 mb-2">
                      MOTOR IMPAIRMENT SCORE
                    </p>
                    <p className="text-sm text-muted-foreground dark:text-gray-400 mb-4">
                      for {patientData?.fullName || "Patient"}
                    </p>
                    <p className="text-7xl font-bold leading-none">
                      <span className={getSeverityTextColor(activeScore || 0)}>
                        {activeScoreText}
                      </span>
                      <span className="text-4xl text-muted-foreground">/100</span>
                    </p>
                    <p className="mt-4 text-3xl font-bold text-foreground dark:text-white uppercase">
                      {activeSeverity}
                    </p>
                    <p className="text-sm text-muted-foreground dark:text-gray-400 mt-3">
                      {activeSeverityDescription}
                    </p>
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between text-xs md:text-sm text-foreground dark:text-white mb-2">
                      <span>Normal (0-38)</span>
                      <span>Mild (38-55)</span>
                      <span>Moderate (55-70)</span>
                      <span>High (70-85)</span>
                      <span>Severe (85-100)</span>
                    </div>
                    <div className="h-3 rounded-full bg-blue-200 dark:bg-blue-900/30 overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: activeProgressWidth }}
                      />
                    </div>
                  </div>

                  <div className={`mt-6 ${getSeverityBgColor(activeScore || 0)} rounded-lg p-4`}>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      Severity Level:
                    </p>
                    <p className={`text-xl font-semibold ${getSeverityTextColor(activeScore || 0)}`}>
                      {activeSeverity}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-4">
                    Important: This is a screening tool based on drawing
                    analysis only. Please consult a healthcare professional for
                    proper diagnosis and treatment.
                  </p>
                

                <div className="mt-8 pt-8 border-t border-border dark:border-white/10">
                  <h4 className="text-2xl font-bold text-foreground dark:text-white mb-1">
                    Understanding Your Drawing Analysis
                  </h4>
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mb-6">
                    Motor Impairment Assessment (Spiral & Wave Pattern Analysis)
                  </p>

                  <h5 className="text-lg font-semibold text-foreground dark:text-white mb-4">
                    What is Drawing Analysis?
                  </h5>
                  <p className="text-sm text-muted-foreground dark:text-gray-300 mb-6">
                    Drawing analysis helps screen fine motor control by measuring tremor, pressure irregularity, and movement smoothness in spiral or wave patterns.
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground dark:text-white">
                          0-38: Normal Pattern - No motor impairment
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground dark:text-white">
                          38-55: Mild - Slight motor irregularities
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-3 h-3 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground dark:text-white">
                          55-70: Moderate - Noticeable motor impairment
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-3 h-3 rounded-full bg-orange-600 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground dark:text-white">
                          70-85: High - Significant motor impairment
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground dark:text-white">
                          85-100: Severe - Strong Parkinsonian motor patterns
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
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
          {
            label: "Continue to Voice Analysis",
            onClick: () => closeDialogAndNavigate("/analysis/voice"),
          },
          {
            label: "Continue to Gait Analysis",
            onClick: () => closeDialogAndNavigate("/analysis/gait"),
          },
        ]}
        onViewCurrentResult={() => {
          setResultActionsOpen(false);
          router.push("/analysis/results");
        }}
        onViewDashboard={() => closeDialogAndNavigate("/analysis/dashboard")}
      />
    </div>
  );
}
