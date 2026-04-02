"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnalysisSidebar } from "@/components/analysis/analysis-sidebar";
import { StepIndicator } from "@/components/analysis/step-indicator";
import { Button } from "@/components/ui/button";
import { Upload, Video, VideoOff, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const gaitSteps = [
  { id: 1, title: "Upload/Record", subtitle: "Gait video" },
  { id: 2, title: "Preview", subtitle: "Review your video" },
  { id: 3, title: "Submit", subtitle: "Confirm and analyze" },
];

export default function GaitAnalysisPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [completedSteps] = useState<string[]>(["patient-info", "voice"]);

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

  const stopWebcam = () => {
    setWebcamStream((currentStream) => {
      currentStream?.getTracks().forEach((track) => track.stop());
      return null;
    });
  };

  const startRecording = async () => {
    if (videoFile || recordedBlob || isRecording) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setWebcamStream(stream);

      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setRecordedBlob(blob);
        setVideoFile(null);
        stopWebcam();
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setTimeout(() => {
        stopRecording();
      }, 30000);
    } catch (error) {
      console.error("Error accessing webcam:", error);
      stopWebcam();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
  };

  useEffect(() => {
    if (webcamVideoRef.current && webcamStream) {
      webcamVideoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      stopWebcam();
    };
  }, []);

  const hasVideo = videoFile || recordedBlob;
  const previewVideo = videoFile ?? recordedBlob;
  const showRecordingPreview = isRecording || !!recordedBlob;

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
                        : "border-border dark:border-white/20 hover:border-primary/50"
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
                      "rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200",
                      isRecording
                        ? "border-primary bg-primary/5"
                        : "border-border dark:border-white/20 hover:border-primary/50"
                    )}
                  >
                    <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-secondary dark:bg-white/5 flex items-center justify-center">
                      <Video className="w-7 h-7 text-muted-foreground dark:text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-foreground dark:text-white mb-2">
                      Record Video
                    </h4>
                    <p className="text-sm text-muted-foreground dark:text-gray-400 mb-5">
                      Record walking video using your webcam
                    </p>
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={!!videoFile || !!recordedBlob}
                      className={cn(
                        "px-6 disabled:cursor-not-allowed disabled:bg-muted dark:disabled:bg-white/10 disabled:text-muted-foreground dark:disabled:text-gray-500",
                        isRecording
                          ? "bg-destructive hover:bg-destructive/90"
                          : "bg-primary hover:bg-primary/90"
                      )}
                    >
                      {isRecording ? (
                        <>
                          <VideoOff className="w-4 h-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          Start Recording
                        </>
                      )}
                    </Button>
                    {showRecordingPreview && (
                      <div className="mt-5 w-full max-w-full rounded-lg overflow-hidden border border-border dark:border-white/10 bg-black/80 aspect-video flex items-center justify-center">
                        {isRecording ? (
                          webcamStream ? (
                            <video
                              ref={webcamVideoRef}
                              autoPlay
                              muted
                              playsInline
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <p className="text-sm text-gray-300 px-4">Starting webcam preview...</p>
                          )
                        ) : recordedBlob ? (
                          <video
                            controls
                            src={URL.createObjectURL(recordedBlob)}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                    )}
                    {recordedBlob && !isRecording && (
                      <div className="mt-4 flex flex-col items-center gap-2">
                        <p className="inline-flex items-center gap-2 text-sm text-emerald-500">
                          <CircleCheck className="w-4 h-4" />
                          Recording saved
                        </p>
                        <button
                          type="button"
                          onClick={clearRecordedVideo}
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
                  <span className="font-semibold">Note:</span> Please ensure the full body is visible in the video for accurate gait analysis.
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
                  disabled={!hasVideo}
                  className={cn(
                    "px-8",
                    hasVideo
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
                Review your video
              </p>
              
              {previewVideo && (
                <div className="bg-secondary dark:bg-[#0f1219] rounded-xl p-6 mb-6">
                  <video
                    controls
                    src={URL.createObjectURL(previewVideo)}
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
            <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-8">
              <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">
                Submit
              </h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400 mb-6">
                Confirm and analyze
              </p>

              <div className="bg-secondary dark:bg-[#0f1219] rounded-xl p-6 mb-6">
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground dark:text-gray-400">Video Status</span>
                  <span className="font-medium text-primary">Ready for analysis</span>
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
                  onClick={() => router.push("/analysis/drawing")}
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
