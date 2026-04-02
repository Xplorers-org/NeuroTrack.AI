"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisSidebar } from "@/components/analysis/analysis-sidebar";
import { AnalysisCompleteDialog } from "@/components/analysis/analysis-complete-dialog";
import { StepIndicator } from "@/components/analysis/step-indicator";
import { VoiceAnalysis } from "@/components/analysis/voice-analysis";
import { PatientData } from "@/components/analysis/patient-info-form";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, CircleCheck } from "lucide-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const voiceSteps = [
  { id: 1, title: "Upload/Record", subtitle: "Voice sample" },
  { id: 2, title: "Preview", subtitle: "Review your recording" },
  { id: 3, title: "Submit", subtitle: "Confirm and analyze" },
  { id: 4, title: "Results", subtitle: "View summary" },
];

type VoiceAnalysisResult = {
  prediction: number;
  test_count?: number;
  processing_time_ms?: number;
  saved?: boolean;
};

export default function VoiceAnalysisPage() {
  const router = useRouter();
  const [voiceStep, setVoiceStep] = useState(1);
  const [resultActionsOpen, setResultActionsOpen] = useState(false);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<File | Blob | null>(null);
  const [voiceResult, setVoiceResult] = useState<VoiceAnalysisResult | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>(["patient-info"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedData = sessionStorage.getItem("patientData");
    if (storedData) setPatientData(JSON.parse(storedData));
    
    const storedSession = sessionStorage.getItem("sessionId");
    if (storedSession) setSessionId(storedSession);

    const storedVoiceResult = sessionStorage.getItem("voiceResult");
    if (storedVoiceResult) setVoiceResult(JSON.parse(storedVoiceResult));
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

  const submitAnalysis = async () => {
    if (!audioData || !patientData || !sessionId) {
      toast.error("Missing required data for analysis.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("session_id", sessionId);
      formData.append("patient_id", patientData.patientId);
      formData.append("age", patientData.age);
      formData.append("sex", patientData.gender);
      
      formData.append("audio_file", audioData, "voice_sample.webm");

      const res = await fetch("/api/analyze/voice", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let message = "Failed to analyze voice";
        try {
          const errorData = await res.json();
          message = errorData.error || message;
        } catch {
          const errorText = await res.text();
          if (errorText) message = errorText;
        }
        throw new Error(message);
      }

      const result: VoiceAnalysisResult = await res.json();
      setVoiceResult(result);
      sessionStorage.setItem("voiceResult", JSON.stringify(result));
      toast.success("Voice analysis complete.");

      const audioName = audioData instanceof File ? audioData.name : "recorded-sample.webm";
      const audioSize = formatFileSize(audioData.size);
      const existingHistory = sessionStorage.getItem("analysisHistory");
      const parsedHistory: Array<Record<string, string | number>> = existingHistory
        ? JSON.parse(existingHistory)
        : [];

      const severity = getSeverityFromPrediction(result.prediction);
      parsedHistory.push({
        id: `${Date.now()}-voice`,
        type: "voice",
        source: audioData instanceof File ? "upload" : "recording",
        fileName: audioName,
        fileSize: audioSize,
        score: Number(result.prediction.toFixed(1)),
        severity,
        submittedAt: new Date().toISOString(),
      });

      sessionStorage.setItem("analysisHistory", JSON.stringify(parsedHistory));
      setCompletedSteps([...completedSteps, "voice"]);
      setVoiceStep(4);
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

  const getProgress = () => {
    return { current: completedSteps.length, total: 3 };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleGoToCurrentVoiceResult = () => {
    setResultActionsOpen(false);
    router.push("/analysis/results");
  };

  const closeDialogAndNavigate = (path: string) => {
    setResultActionsOpen(false);
    router.push(path);
  };

  const getSeverityFromPrediction = (prediction: number) => {
    if (prediction <= 20) return "Mild";
    if (prediction <= 40) return "Moderate";
    if (prediction <= 60) return "Advanced";
    return "Severe";
  };

  const getSeverityDescription = (severity: string) => {
    if (severity === "Mild") return "Very light or early signs.";
    if (severity === "Moderate") return "Some tremor, speech changes, or slower movement possible.";
    if (severity === "Advanced") return "Noticeable speech or movement difficulties.";
    return "Significant motor impairment may be present.";
  };

  const updrsScore = voiceResult?.prediction;
  const formattedUpdrsScore =
    typeof updrsScore === "number" ? updrsScore.toFixed(1) : "N/A";
  const severityLabel =
    typeof updrsScore === "number" ? getSeverityFromPrediction(updrsScore) : "Pending";
  const severityDescription = getSeverityDescription(severityLabel);
  const progressWidth =
    typeof updrsScore === "number"
      ? `${Math.max(0, Math.min((updrsScore / 108) * 100, 100)).toFixed(2)}%`
      : "0%";

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
            <div className="space-y-6">
              <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-10 text-center">
            <div className="flex  items-center mb-2">
                  <div className="w-18 h-18 rounded-full bg-primary/15 flex items-center justify-center  mb-6">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-4xl font-bold text-foreground dark:text-white mb-4 mx-15">
                  Ready for UPDRS Analysis
                </h3>
            </div>
                <p className="text-md text-muted-foreground dark:text-gray-300 max-w-3xl mx-auto">
                  Your voice sample will be analyzed using our AI model to estimate UPDRS motor symptoms related to Parkinson&apos;s disease.
                </p>
              </div>

              <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-6">
                <h4 className="text-2xl font-semibold text-foreground dark:text-white mb-5">
                  Submission Summary
                </h4>
                <div className="grid sm:grid-cols-2 gap-4 text-base">
                  <p className="text-muted-foreground dark:text-gray-400">Patient:</p>
                  <p className="text-foreground dark:text-white font-semibold">{patientData?.fullName || "N/A"}</p>

                  <p className="text-muted-foreground dark:text-gray-400">Age:</p>
                  <p className="text-foreground dark:text-white font-semibold">{patientData?.age || "N/A"} years</p>

                  <p className="text-muted-foreground dark:text-gray-400">Gender:</p>
                  <p className="text-foreground dark:text-white font-semibold capitalize">{patientData?.gender || "N/A"}</p>

                  <p className="text-muted-foreground dark:text-gray-400">Audio:</p>
                  <p className="text-foreground dark:text-white font-semibold break-all">
                    {audioData ? `${audioData instanceof File ? audioData.name : "recorded-sample.webm"} (${formatFileSize(audioData.size)})` : "N/A"}
                  </p>
                </div>
              </div>

              <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-6">
                <h4 className="text-2xl font-semibold text-foreground dark:text-white mb-4">
                  About UPDRS Analysis
                </h4>
                <ul className="space-y-2 text-muted-foreground dark:text-gray-300 list-disc list-inside">
                  <li>UPDRS scores range from 0 to 108.</li>
                  <li>Lower scores indicate milder symptoms.</li>
                  <li>This analysis is based on voice patterns.</li>
                  <li>Results are for screening purposes only.</li>
                </ul>
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  variant="secondary"
                  onClick={() => setVoiceStep(2)}
                  className="bg-secondary dark:bg-[#1a1f2e] hover:bg-secondary/80 dark:hover:bg-[#252b3b] border-0 text-foreground dark:text-white px-6"
                >
                  Previous
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
                    "Submit Analysis"
                  )}
                </Button>
              </div>
            </div>
          )}

          {voiceStep === 4 && (
            <div className="space-y-6">
              <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-8">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
                      Analysis Results
                    </h3>
                    <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2">
                      Detailed results of your voice analysis for Parkinson&apos;s disease prediction.
                    </p>
                  </div>
                  <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                </div>

                <div className="mt-6 rounded-xl border border-primary/40 dark:border-primary/30 border-l-4 p-5 bg-primary/5 dark:bg-primary/10">
                  <h4 className="text-xl font-semibold text-primary mb-2">Analysis Complete</h4>
                  <p className="text-sm text-foreground dark:text-white">
                    Patient: <span className="font-semibold text-primary">{patientData?.fullName || "N/A"}</span>
                  </p>
                  <p className="text-lg font-semibold text-foreground dark:text-white mt-2">
                    UPDRS Prediction: <span className="text-amber-500">{formattedUpdrsScore}</span>
                    <span className="text-muted-foreground"> / 108</span>
                    <span className="ml-3 text-xs bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 px-2.5 py-1 rounded-full align-middle">
                      {severityLabel}
                    </span>
                  </p>
                </div>

                <div className="mt-6 bg-secondary dark:bg-[#0f1219] rounded-lg p-4 inline-block">
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Patient</p>
                  <p className="font-semibold text-foreground dark:text-white">{patientData?.fullName || "N/A"}</p>
                  <p className="text-sm text-primary mt-1">UPDRS Prediction: {formattedUpdrsScore}</p>
                </div>

                <div className="text-center mt-8">
                  <p className="tracking-[0.2em] text-xs text-muted-foreground dark:text-gray-400">UPDRS PREDICTION SCORE</p>
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mb-2">
                    for {patientData?.fullName || "Patient"}
                  </p>
                  <p className="text-7xl font-bold text-amber-500 leading-none">
                    {formattedUpdrsScore}<span className="text-4xl text-muted-foreground">/108</span>
                  </p>
                  <p className="mt-3 text-3xl font-bold text-foreground dark:text-white uppercase">
                    {severityLabel} Severity
                  </p>
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2">
                    {severityDescription}
                  </p>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between text-xs md:text-sm text-foreground dark:text-white mb-2">
                    <span>Mild (0-20)</span>
                    <span>Moderate (21-40)</span>
                    <span>Advanced (41-60)</span>
                    <span>Severe (61+)</span>
                  </div>
                  <div className="h-3 rounded-full bg-secondary dark:bg-[#0f1219] overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: progressWidth }} />
                  </div>
                </div>

                <div className="mt-6 bg-secondary dark:bg-[#0f1219] rounded-lg p-4">
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Severity Level:</p>
                  <p className="text-xl font-semibold text-amber-500">{severityLabel}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card dark:bg-[#161b26] rounded-xl border border-border dark:border-white/10 p-6">
                  <h4 className="text-2xl font-bold text-foreground dark:text-white mb-4">What is UPDRS?</h4>
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mb-4">
                    The UPDRS is a comprehensive rating scale used to evaluate the severity of Parkinson&apos;s disease symptoms. Our voice analysis estimates motor symptoms based on speech patterns.
                  </p>
                  <ul className="space-y-2 text-sm text-foreground dark:text-white">
                    <li><span className="font-semibold">0-20:</span> Mild/Early - Very light or early signs</li>
                    <li><span className="font-semibold">21-40:</span> Moderate - Some tremor, speech changes possible</li>
                    <li><span className="font-semibold">41-60:</span> Advanced - Noticeable speech/movement difficulties</li>
                    <li><span className="font-semibold">61+:</span> Severe - Significant motor impairment</li>
                  </ul>
                </div>

                <div className="bg-card dark:bg-[#161b26] rounded-xl border border-border dark:border-white/10 p-6">
                  <h4 className="text-2xl font-bold text-foreground dark:text-white mb-4">Your Result</h4>
                  <div className="bg-secondary dark:bg-[#0f1219] rounded-lg p-6 text-center mb-4">
                    <p className="text-5xl font-bold text-amber-500">{formattedUpdrsScore}</p>
                    <p className="text-2xl font-semibold text-foreground dark:text-white mt-2">{severityLabel} severity</p>
                    <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2">{severityDescription}</p>
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">
                    Important: This is a screening tool based on voice analysis only. Please consult a healthcare professional for proper diagnosis and treatment.
                  </p>
                </div>
              </div>

              <div className="bg-card dark:bg-[#161b26] rounded-xl border border-border dark:border-white/10 p-6">
                <h4 className="text-3xl font-bold text-foreground dark:text-white mb-1">Recommendations</h4>
                <p className="text-sm text-muted-foreground dark:text-gray-400 mb-4">Based on your analysis results</p>
                <div className="space-y-3">
                  {[
                    "Consult with a neurologist for proper evaluation",
                    "Regular exercise and physical activity are important",
                    "Consider speech exercises if speech changes are noted",
                    "Maintain a healthy diet and lifestyle",
                    "Keep a symptom diary for medical appointments",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-lg bg-secondary dark:bg-[#0f1219] p-3">
                      <CircleCheck className="w-4 h-4 text-primary shrink-0" />
                      <p className="text-sm text-foreground dark:text-white">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card dark:bg-[#161b26] rounded-xl border border-border dark:border-white/10 p-6">
                <h4 className="text-lg font-semibold text-foreground dark:text-white mb-3">Debug API Data (Temporary)</h4>
                <p className="text-xs text-muted-foreground dark:text-gray-400 mb-3">
                  Use this panel to verify the exact response returned by <span className="font-mono">/api/analyze/voice</span>.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground dark:text-gray-400">prediction</span>
                    <span className="text-foreground dark:text-white font-medium">{voiceResult?.prediction ?? "N/A"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground dark:text-gray-400">test_count</span>
                    <span className="text-foreground dark:text-white font-medium">{voiceResult?.test_count ?? "N/A"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground dark:text-gray-400">processing_time_ms</span>
                    <span className="text-foreground dark:text-white font-medium">{voiceResult?.processing_time_ms ?? "N/A"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground dark:text-gray-400">saved</span>
                    <span className="text-foreground dark:text-white font-medium">{String(voiceResult?.saved ?? "N/A")}</span>
                  </div>
                </div>
              </div>

              <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-6">
                <h4 className="text-2xl font-semibold text-foreground dark:text-white mb-4">
                  Submission Summary
                </h4>
                <div className="grid sm:grid-cols-2 gap-4 text-base">
                  <p className="text-muted-foreground dark:text-gray-400">Patient:</p>
                  <p className="text-foreground dark:text-white font-semibold">{patientData?.fullName || "N/A"}</p>

                  <p className="text-muted-foreground dark:text-gray-400">Age:</p>
                  <p className="text-foreground dark:text-white font-semibold">{patientData?.age || "N/A"} years</p>

                  <p className="text-muted-foreground dark:text-gray-400">Gender:</p>
                  <p className="text-foreground dark:text-white font-semibold capitalize">{patientData?.gender || "N/A"}</p>

                  <p className="text-muted-foreground dark:text-gray-400">Audio:</p>
                  <p className="text-foreground dark:text-white font-semibold break-all">
                    {audioData ? `${audioData instanceof File ? audioData.name : "recorded-sample.webm"} (${formatFileSize(audioData.size)})` : "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  variant="secondary"
                  onClick={() => setVoiceStep(2)}
                  disabled={isSubmitting}
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
        completedAnalysisLabel="voice"
        primaryActions={[
          { label: "Continue to Drawing Analysis", onClick: () => closeDialogAndNavigate("/analysis/drawing") },
          { label: "Continue to Gait Analysis", onClick: () => closeDialogAndNavigate("/analysis/gait") },
        ]}
        onViewCurrentResult={handleGoToCurrentVoiceResult}
        onViewDashboard={() => closeDialogAndNavigate("/analysis/dashboard")}
      />
    </div>
  );
}
