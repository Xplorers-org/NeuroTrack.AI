"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisSidebar } from "@/components/analysis/analysis-sidebar";
import { StepIndicator } from "@/components/analysis/step-indicator";
import { Button } from "@/components/ui/button";
import { Download, Eye, FileText } from "lucide-react";
import { Download, Share2, Printer, CheckCircle2, Activity, Brain, TrendingUp, Loader2, Play } from "lucide-react";
import { PatientData } from "@/components/analysis/patient-info-form";
import { toast } from "sonner";

type AnalysisHistoryItem = {
  id: string;
  type: "voice" | "gait" | "drawing";
  source: string;
  fileName: string;
  fileSize: string;
  score: number;
  severity: string;
  submittedAt: string;
};

const resultSteps = [
  { id: 1, title: "Upload/Record", subtitle: "Voice sample" },
  { id: 2, title: "Preview", subtitle: "Review your recording" },
  { id: 3, title: "Submit", subtitle: "Confirm and analyze" },
  { id: 4, title: "Results", subtitle: "Combined summary" },
];

export default function ResultsPage() {
  const router = useRouter();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [voiceResult, setVoiceResult] = useState<any>(null);
  const [gaitResult, setGaitResult] = useState<any>(null);
  const [drawingResult, setDrawingResult] = useState<any>(null);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const completedSteps = ["patient-info", "voice", "drawing", "gait"];

    const storedData = sessionStorage.getItem("patientData");
    if (storedData) setPatientData(JSON.parse(storedData));

    const vResult = sessionStorage.getItem("voiceResult");
    if (vResult) setVoiceResult(JSON.parse(vResult));

    const gResult = sessionStorage.getItem("gaitResult");
    if (gResult) setGaitResult(JSON.parse(gResult));

    const dResult = sessionStorage.getItem("drawingResult");
    if (dResult) setDrawingResult(JSON.parse(dResult));

    return () => {
      if (localVideoUrl) URL.revokeObjectURL(localVideoUrl);
    };
  }, [localVideoUrl]);

  const handleDownloadVideo = async () => {
    if (!gaitResult?.annotated_video_url) return;
    
    setIsDownloading(true);
    try {
      const response = await fetch(gaitResult.annotated_video_url);
      if (!response.ok) throw new Error("Could not download video");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setLocalVideoUrl(url);
      toast.success("Video ready for playback");
    } catch (error) {
      console.error("Video download failed:", error);
      toast.error("Failed to load video preview");
    } finally {
      setIsDownloading(false);
    }
  };

  const getProgress = () => {
    return { current: 4, total: 4 };
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
const hasVideo = videoFile || recordedBlob;
const previewVideo = videoFile ?? recordedBlob;
const showRecordingPreview = isRecording || !!recordedBlob;

// Utility: format file size
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// 🔥 MAIN FUNCTION (merged + correct)
const submitAnalysis = async () => {
  let videoToSubmit = videoFile || recordedBlob;

  // Validation
  if (!videoToSubmit) {
    toast.error("Please upload or record a video.");
    return;
  }

  if (!sessionId || !patientData) {
    toast.error("Missing session or patient data.");
    return;
  }

  // Convert Blob → File (important for FormData)
  if (recordedBlob && !videoFile) {
    videoToSubmit = new File([recordedBlob], "recorded_gait.webm", {
      type: "video/webm",
    });
  }

  setIsSubmitting(true);

  try {
    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("gender", patientData.gender);
    formData.append("video", videoToSubmit, "gait_video.mp4");

    const res = await fetch("/api/analyze/gait", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      let errorMessage = "Failed to analyze gait";

      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // ignore JSON parse error
      }

      throw new Error(errorMessage);
    }

    const result = await res.json();

    // Save result
    sessionStorage.setItem("gaitResult", JSON.stringify(result));

    // Save history
    const existingHistory = sessionStorage.getItem("analysisHistory");
    const parsedHistory = existingHistory ? JSON.parse(existingHistory) : [];

    parsedHistory.push({
      id: `${Date.now()}-gait`,
      type: "gait",
      source: videoFile ? "upload" : "webcam-recording",
      fileName: videoToSubmit.name,
      fileSize: formatFileSize(videoToSubmit.size),
      submittedAt: new Date().toISOString(),
    });

    sessionStorage.setItem("analysisHistory", JSON.stringify(parsedHistory));

    // UI feedback
    toast.success("Gait analysis complete.");

    setCompletedSteps((prev) => [...prev, "gait"]);

    // Navigate to results
    router.push("/analysis/results");

  } catch (err) {
    if (err instanceof Error) {
      toast.error(err.message);
    } else {
      toast.error("Unexpected error occurred.");
    }
  } finally {
    setIsSubmitting(false);
  }
};
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
                sessionStorage.removeItem("analysisHistory");
                sessionStorage.removeItem("voiceAnalysisSubmission");
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
