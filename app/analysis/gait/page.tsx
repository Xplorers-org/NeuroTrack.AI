"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnalysisSidebar } from "@/components/analysis/analysis-sidebar";
import { AnalysisCompleteDialog } from "@/components/analysis/analysis-complete-dialog";
import { StepIndicator } from "@/components/analysis/step-indicator";
import { Button } from "@/components/ui/button";
import { CircleCheck, Upload, Video, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "sonner";

const gaitSteps = [
  { id: 1, title: "Upload/Record", subtitle: "Gait video" },
  { id: 2, title: "Preview", subtitle: "Review your video" },
  { id: 3, title: "Submit", subtitle: "Confirm and analyze" },
  { id: 4, title: "Results", subtitle: "View result summary" },
];

type PatientSessionData = {
  fullName?: string;
  patientId?: string;
  gender?: string;
  age?: string | number;
};

type GaitAnalysisResult = {
  gait_score: number;
  video_source?: "url" | "embedded_base64" | "none";
  video_error?: string | null;
  processing_time_ms?: number;
  stride_variability?: number;
  cadence?: number;
  gait_symmetry?: number;
  overall_arm_swing?: number;
  arm_swing_asymmetry?: number;
  saved?: boolean;
};

export default function GaitAnalysisPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [resultActionsOpen, setResultActionsOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const [completedSteps, setCompletedSteps] = useState<string[]>([
    "patient-info",
    "voice",
    "drawing",
  ]);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<PatientSessionData | null>(
    null,
  );
  const [gaitResult, setGaitResult] = useState<GaitAnalysisResult | null>(null);
  const [analysisVideoFailed, setAnalysisVideoFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedSession = sessionStorage.getItem("sessionId");
    if (storedSession) setSessionId(storedSession);

    const storedPatient = sessionStorage.getItem("patientData");
    if (storedPatient) setPatientData(JSON.parse(storedPatient));

    const storedGaitResult = sessionStorage.getItem("gaitResult");
    if (storedGaitResult) {
      setGaitResult(JSON.parse(storedGaitResult));
    }

    return () => {
      stopStream();
    };
  }, []);

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoUrl(null);
    }
  }, [videoFile, recordedBlob]);

  useEffect(() => {
    setAnalysisVideoFailed(false);
  }, [gaitResult]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8",
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setRecordedBlob(blob);
        setVideoFile(null); // Clear selected file if we just recorded
        chunksRef.current = [];
        stopStream();
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      toast.info("Recording started. Please walk in front of the camera.");
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isRecording || recordedBlob) {
      return;
    }

    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setRecordedBlob(null);
    }
  };

  const clearUploadedVideo = () => {
    setVideoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearRecordedVideo = () => {
    if (isRecording) {
      stopRecording();
    }
    setRecordedBlob(null);
  };

  const hasVideo = videoFile || recordedBlob;

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
    if (score >= 86) return "Normal gait (Stable)";
    if (score >= 71) return "Mild impairment";
    if (score >= 56) return "Moderate impairment";
    return "Severe gait instability";
  };

  const getSeverityDescription = (severity: string) => {
    if (severity === "Normal gait (Stable)")
      return "Stable and healthy walking pattern.";
    if (severity === "Mild impairment")
      return "Slight changes in gait pattern observed.";
    if (severity === "Moderate impairment")
      return "Noticeable gait irregularities present.";
    return "Significant gait disturbance may be present.";
  };

  const getSeverityColor = (score: number) => {
    if (score >= 86) return "green";
    if (score >= 71) return "yellow";
    if (score >= 56) return "orange";
    return "red";
  };

  const getSeverityBgColor = (score: number) => {
    const color = getSeverityColor(score);
    if (color === "green") return "bg-green-100 dark:bg-green-500/30";
    if (color === "yellow") return "bg-yellow-100 dark:bg-yellow-500/30";
    if (color === "orange") return "bg-orange-100 dark:bg-orange-500/30";
    return "bg-red-100 dark:bg-red-500/30";
  };

  const getSeverityTextColor = (score: number) => {
    const color = getSeverityColor(score);
    if (color === "green") return "text-green-600 dark:text-green-400";
    if (color === "yellow") return "text-yellow-600 dark:text-yellow-400";
    if (color === "orange") return "text-orange-600 dark:text-orange-500";
    return "text-red-600 dark:text-red-500";
  };

  const submitAnalysis = async () => {
    let videoToSubmit: File | Blob | null = videoFile || recordedBlob;
    if (!videoToSubmit || !sessionId || !patientData) {
      toast.error("Missing video, session, or patient data.");
      return;
    }

    // Convert blob to file for standard FormData handling
    if (recordedBlob && !videoFile) {
      videoToSubmit = new File([recordedBlob], "recorded_gait.webm", {
        type: "video/webm",
      });
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("session_id", sessionId);
      formData.append("gender", patientData.gender || "male");
      formData.append("patient_id", patientData.patientId || "");
      formData.append(
        "video",
        videoToSubmit,
        videoFile ? videoFile.name : "recorded_gait.webm",
      );

      const res = await fetch("/api/analyze/gait", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let message = "Failed to analyze gait";
        try {
          const errorData = await res.json();
          message = errorData.error || message;
        } catch {
          const errorText = await res.text();
          if (errorText) message = errorText;
        }
        throw new Error(message);
      }

      const result: GaitAnalysisResult = await res.json();
      setGaitResult(result);
      setAnalysisVideoFailed(false);
      sessionStorage.setItem("gaitResult", JSON.stringify(result));

      const selectedVideo = videoFile ?? recordedBlob;
      if (selectedVideo) {
        const fileName = videoFile ? videoFile.name : "recorded-gait.webm";
        const fileSize = formatFileSize(selectedVideo.size);
        const existingHistory = sessionStorage.getItem("analysisHistory");
        const parsedHistory: Array<Record<string, string | number>> =
          existingHistory ? JSON.parse(existingHistory) : [];

        parsedHistory.push({
          id: `${Date.now()}-gait`,
          type: "gait",
          source: videoFile ? "upload" : "webcam-recording",
          fileName,
          fileSize,
          score: result.gait_score,
          severity: getSeverityFromScore(result.gait_score),
          submittedAt: new Date().toISOString(),
        });

        sessionStorage.setItem(
          "analysisHistory",
          JSON.stringify(parsedHistory),
        );
      }

      toast.success("Gait analysis complete.");

      setCompletedSteps([...completedSteps, "gait"]);
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

  const gaitScore = gaitResult?.gait_score;
  const gaitSeverity =
    typeof gaitScore === "number" ? getSeverityFromScore(gaitScore) : "Pending";
  const gaitSeverityDescription = getSeverityDescription(gaitSeverity);
  const gaitScoreText =
    typeof gaitScore === "number" ? gaitScore.toFixed(1) : "N/A";
  const gaitProgressWidth =
    typeof gaitScore === "number"
      ? `${Math.max(0, Math.min((gaitScore / 100) * 100, 100)).toFixed(2)}%`
      : "0%";
  const selectedVideo = videoFile ?? recordedBlob;
  const selectedVideoName = videoFile ? videoFile.name : "recorded-gait.webm";
  const selectedVideoSize = selectedVideo
    ? formatFileSize(selectedVideo.size)
    : "N/A";

  const getProgress = () => {
    return { current: completedSteps.length, total: 3 };
  };

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0a0e17]">
      <AnalysisSidebar
        currentStep="gait"
        completedSteps={completedSteps}
        progress={getProgress()}
      />

      <main className="flex-1 ml-60">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
              Gait Analysis
            </h1>
            <p className="text-muted-foreground dark:text-gray-400 mt-2">
              Upload or record a video of walking patterns for analysis.
            </p>
          </div>

          <StepIndicator steps={gaitSteps} currentStep={step} />

          {step === 1 && (
            <div className="w-full">
              <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-8">
                <h3 className="text-xl font-semibold text-foreground dark:text-white mb-1">
                  Upload/Record
                </h3>
                <p className="text-sm text-muted-foreground dark:text-gray-400 mb-8">
                  Gait video
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div
                    className={cn(
                      "rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200",
                      videoFile
                        ? "border-primary bg-primary/5"
                        : "border-border dark:border-white/20 hover:border-primary/50",
                    )}
                  >
                    <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-secondary dark:bg-white/5 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-muted-foreground dark:text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-foreground dark:text-white mb-2">
                      Upload Video File
                    </h4>
                    <p className="text-sm text-muted-foreground dark:text-gray-400 mb-5">
                      Support: MP4, WebM, MOV
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isRecording || !!recordedBlob}
                      className="bg-primary hover:bg-primary/90 px-6 disabled:cursor-not-allowed disabled:bg-muted dark:disabled:bg-white/10 disabled:text-muted-foreground dark:disabled:text-gray-500"
                    >
                      Choose File
                    </Button>
                    {videoFile && (
                      <div className="mt-4 flex flex-col items-center gap-2">
                        <p className="inline-flex items-center gap-2 text-sm text-emerald-500 truncate max-w-full px-2">
                          <CircleCheck className="w-4 h-4 shrink-0" />
                          <span className="truncate">{videoFile.name}</span>
                        </p>
                        <button
                          type="button"
                          onClick={clearUploadedVideo}
                          className="text-sm text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div
                    className={cn(
                      "rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 overflow-hidden flex flex-col",
                      isRecording
                        ? "border-primary bg-black/40"
                        : recordedBlob
                          ? "border-green-500/50 bg-green-500/5"
                          : "border-border dark:border-white/20 hover:border-primary/50",
                    )}
                  >
                    {isRecording ? (
                      <div className="relative rounded-lg overflow-hidden mb-4 aspect-video bg-black">
                        <video
                          ref={videoPreviewRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 bg-black/60 rounded-md">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                            Recording
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-secondary dark:bg-white/5 flex items-center justify-center">
                        <Video
                          className={cn(
                            "w-7 h-7",
                            recordedBlob
                              ? "text-green-500"
                              : "text-muted-foreground dark:text-gray-400",
                          )}
                        />
                      </div>
                    )}

                    <h4 className="text-lg font-medium text-foreground dark:text-white mb-2">
                      {isRecording
                        ? "Capturing Gait..."
                        : recordedBlob
                          ? "Video Captured"
                          : "Record Video"}
                    </h4>

                    {!isRecording && (
                      <p className="text-sm text-muted-foreground dark:text-gray-400 mb-5">
                        {recordedBlob
                          ? "You can review it or record again"
                          : "Record walking video"}
                      </p>
                    )}
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={cn(
                        "mt-1.5 px-6 w-50 mx-auto",

                        isRecording
                          ? "bg-destructive hover:bg-destructive/90 transition-all duration-300 scale-105"
                          : "bg-primary hover:bg-primary/90",
                      )}
                    >
                      {isRecording ? (
                        "Stop Recording"
                      ) : (
                        recordedBlob ? "Record Again" : "Start Recording"
                      )}
                    </Button>
                    {recordedBlob && !isRecording && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-green-500 animate-bounce">
                          ✓ Video recorded successfully
                        </p>
                        <button
                          type="button"
                          onClick={clearRecordedVideo}
                          className="text-xs text-red-500 hover:text-red-600"
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
                  <span className="font-semibold">Note:</span> Please ensure the
                  full body is visible in the video for accurate gait analysis.
                </p>
              </div>

              <div className="flex items-center justify-between mt-8">
                <Button
                  variant="secondary"
                  onClick={() => router.push("/analysis/drawing")}
                  className="bg-secondary dark:bg-[#1a1f2e] hover:bg-secondary/80 dark:hover:bg-[#252b3b] border-0 text-foreground dark:text-white px-6"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!hasVideo || isRecording}
                  className={cn(
                    "px-8",
                    hasVideo && !isRecording
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
                Review your video
              </p>

              {videoUrl && (
                <div className="bg-secondary dark:bg-[#0f1219] rounded-xl p-6 mb-6">
                  <video
                    controls
                    src={videoUrl}
                    className="w-full rounded-lg"
                  />
                </div>
              )}

              <div className="flex justify-between mt-8">
                <Button
                  variant="secondary"
                  onClick={() => setStep(1)}
                  className="bg-secondary dark:bg-[#1a1f2e] hover:bg-secondary/80 dark:hover:bg-[#252b3b] border-0 text-foreground dark:text-white px-6"
                >
                  Re-upload
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
                    <Video className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-foreground dark:text-white">
                    Ready for Gait Analysis
                  </h3>
                </div>
                <p className="text-md text-muted-foreground dark:text-gray-300 max-w-3xl mx-auto">
                  Your gait video will be analyzed to estimate walking
                  stability, balance changes, and movement irregularities
                  related to Parkinson&apos;s disease.
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
                    {patientData?.gender
                      ? (sessionStorage.getItem("patientData") &&
                          JSON.parse(
                            sessionStorage.getItem("patientData") || "{}",
                          ).fullName) ||
                        "N/A"
                      : "N/A"}
                  </p>

                  <p className="text-muted-foreground dark:text-gray-400">
                    Gender:
                  </p>
                  <p className="text-foreground dark:text-white font-semibold capitalize">
                    {patientData?.gender || "N/A"}
                  </p>

                  <p className="text-muted-foreground dark:text-gray-400">
                    Video:
                  </p>
                  <p className="text-foreground dark:text-white font-semibold break-all">
                    {selectedVideo
                      ? `${selectedVideoName} (${selectedVideoSize})`
                      : "N/A"}
                  </p>

                  <p className="text-muted-foreground dark:text-gray-400">
                    Analysis Type:
                  </p>
                  <p className="text-foreground dark:text-white font-semibold">
                    Gait stability screening
                  </p>
                </div>
              </div>

              <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-6">
                <h4 className="text-2xl font-semibold text-foreground dark:text-white mb-4">
                  About Gait Analysis
                </h4>
                <ul className="space-y-2 text-muted-foreground dark:text-gray-300 list-disc list-inside">
                  <li>Gait scores range from 0 to 100.</li>
                  <li>
                    Lower scores indicate smoother, more stable walking
                    patterns.
                  </li>
                  <li>
                    The analysis focuses on step rhythm, balance, and movement
                    symmetry.
                  </li>
                  <li>Results are intended for screening purposes only.</li>
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
              <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-8">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
                      Analysis Results
                    </h3>
                    <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2">
                      Detailed results of your gait analysis for
                      Parkinson&apos;s disease screening.
                    </p>
                  </div>
                  <Video className="w-6 h-6 text-amber-500 shrink-0" />
                </div>

                <div className="mt-6 rounded-xl border border-primary/40 dark:border-primary/30 border-l-4 p-5 bg-primary/5 dark:bg-primary/10">
                  <h4 className="text-xl font-semibold text-primary mb-3">
                    Analysis Complete
                  </h4>
                  <p className="text-sm text-foreground dark:text-white">
                    Patient : <span className="font-semibold text-primary">
                      {sessionStorage.getItem("patientData")
                        ? JSON.parse(
                            sessionStorage.getItem("patientData") || "{}",
                          ).fullName || "N/A"
                        : "N/A"}
                    </span>
                  </p>
                  <p className="text-sm text-foreground dark:text-white mt-2">
                    Patient ID : <span className="font-semibold text-primary">
                      {sessionStorage.getItem("patientData")
                        ? JSON.parse(
                            sessionStorage.getItem("patientData") || "{}",
                          ).patientId || "N/A"
                        : "N/A"}
                    </span>
                  </p>
                </div>

                <div className="bg-secondary dark:bg-[#0f1219] rounded-xl p-8 mt-8">
                  <div className="text-center">
                    <p className="tracking-[0.2em] text-xs text-muted-foreground dark:text-gray-400 mb-2">
                      GAIT STABILITY SCORE
                    </p>
                    <p className="text-sm text-muted-foreground dark:text-gray-400 mb-4">
                      for{" "}
                      {sessionStorage.getItem("patientData")
                        ? JSON.parse(
                            sessionStorage.getItem("patientData") || "{}",
                          ).fullName || "Patient"
                        : "Patient"}
                    </p>
                    <p className="text-7xl font-bold leading-none">
                      <span className={getSeverityTextColor(gaitScore || 0)}>
                        {gaitScoreText}
                      </span>
                      <span className="text-4xl text-muted-foreground">/100</span>
                    </p>
                    <p className="mt-4 text-3xl font-bold text-foreground dark:text-white uppercase">
                      {gaitSeverity}
                    </p>
                    <p className="text-sm text-muted-foreground dark:text-gray-400 mt-3">
                      {gaitSeverityDescription}
                    </p>
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between text-xs md:text-sm text-foreground dark:text-white mb-2">
                      <span>Severe (0-55)</span>
                      <span>Moderate (56-70)</span>
                      <span>Mild (71-85)</span>
                      <span>Normal (86-100)</span>
                    </div>
                    <div className="h-3 rounded-full bg-blue-200 dark:bg-blue-900/30 overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: gaitProgressWidth }}
                      />
                    </div>
                  </div>

                  <div className={`mt-6 ${getSeverityBgColor(gaitScore || 0)} rounded-lg p-4`}>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      Severity Level:
                    </p>
                    <p className={`text-xl font-semibold ${getSeverityTextColor(gaitScore || 0)}`}>
                      {gaitSeverity}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-4">
                    <span className="font-semibold">Note:</span> Higher gait score indicates better gait stability.
                    Important: This is a screening tool based on gait video
                    analysis only. Please consult a healthcare professional for
                    proper diagnosis and treatment.
                  </p>
                </div>

                <div className="mt-8 pt-8 border-t border-border dark:border-white/10">
                  <h4 className="text-2xl font-bold text-foreground dark:text-white mb-1">
                    Detailed Gait Analysis
                  </h4>
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mb-6">
                    Comprehensive gait metrics and biomechanical analysis
                  </p>

                  <h5 className="text-lg font-semibold text-foreground dark:text-white mb-4">
                    Gait Parameters
                  </h5>
                  <ul className="space-y-3 text-sm text-muted-foreground dark:text-gray-300">
                    <li className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-foreground dark:text-white">Stride Time Variability:</span>
                        <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Measures the consistency of walking rhythm</p>
                      </div>
                      <span className="font-semibold text-foreground dark:text-white ml-4">
                        {gaitResult?.stride_variability !== undefined ? `${gaitResult.stride_variability.toFixed(2)}%` : "N/A"}
                      </span>
                    </li>
                    <li className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-foreground dark:text-white">Cadence:</span>
                        <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Number of steps per minute</p>
                      </div>
                      <span className="font-semibold text-foreground dark:text-white ml-4">
                        {gaitResult?.cadence !== undefined ? `${gaitResult.cadence.toFixed(2)} steps/min` : "N/A"}
                      </span>
                    </li>
                    <li className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-foreground dark:text-white">Gait Symmetry:</span>
                        <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Balance and uniformity of movement between left and right</p>
                      </div>
                      <span className="font-semibold text-foreground dark:text-white ml-4">
                        {gaitResult?.gait_symmetry !== undefined ? `${(gaitResult.gait_symmetry * 100).toFixed(2)}%` : "N/A"}
                      </span>
                    </li>
                    <li className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-foreground dark:text-white">Overall Arm Swing:</span>
                        <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Amplitude and consistency of arm movement during walking</p>
                      </div>
                      <span className="font-semibold text-foreground dark:text-white ml-4">
                        {gaitResult?.overall_arm_swing !== undefined ? `${gaitResult.overall_arm_swing.toFixed(2)}` : "N/A"}
                      </span>
                    </li>
                    <li className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-foreground dark:text-white">Arm Swing Asymmetry:</span>
                        <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Differences in arm movement between sides</p>
                      </div>
                      <span className="font-semibold text-foreground dark:text-white ml-4">
                        {gaitResult?.arm_swing_asymmetry !== undefined ? `${gaitResult.arm_swing_asymmetry.toFixed(2)}%` : "N/A"}
                      </span>
                    </li>
                  </ul>

                  <div className="mt-6 pt-6 border-t border-border dark:border-white/10">
                    <h5 className="text-lg font-semibold text-foreground dark:text-white mb-4">
                      Understanding Gait Scores
                    </h5>
                    <div className="space-y-3">
                      <div className="flex items-start gap-4">
                        <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground dark:text-white">
                            86-100: Normal gait (Stable) - Stable and healthy walking pattern
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground dark:text-white">
                            71-85: Mild impairment - Slight changes in gait pattern observed
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-3 h-3 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground dark:text-white">
                            56-70: Moderate impairment - Noticeable gait irregularities present
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground dark:text-white">
                            0-55: Severe gait instability - Significant gait disturbance may be present
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
        completedAnalysisLabel="gait"
        primaryActions={[
          {
            label: "Continue to Voice Analysis",
            onClick: () => closeDialogAndNavigate("/analysis/voice"),
          },
          {
            label: "Continue to Drawing Analysis",
            onClick: () => closeDialogAndNavigate("/analysis/drawing"),
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
