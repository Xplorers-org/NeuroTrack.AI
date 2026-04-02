"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Upload, Mic, MicOff, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceAnalysisProps {
  onNext: (file: File | Blob) => void;
  onPrevious: () => void;
}

export function VoiceAnalysis({ onNext, onPrevious }: VoiceAnalysisProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearUploadedFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    setRecordedBlob(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isRecording || recordedBlob) {
      return;
    }

    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setRecordedBlob(null);
    }
  };

  const startRecording = async () => {
    if (uploadedFile) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        setUploadedFile(null);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleNext = () => {
    if (uploadedFile) {
      onNext(uploadedFile);
    } else if (recordedBlob) {
      onNext(recordedBlob);
    }
  };

  const hasAudio = uploadedFile || recordedBlob;

  return (
    <div className="w-full">
      {/* Upload/Record Card */}
      <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-8">
        <h3 className="text-xl font-semibold text-foreground dark:text-white mb-1">
          Upload/Record
        </h3>
        <p className="text-sm text-muted-foreground dark:text-gray-400 mb-8">
          Voice sample
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Option - Dashed Border */}
          <div
            className={cn(
              "rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200",
              uploadedFile
                ? "border-primary bg-primary/5"
                : "border-border dark:border-white/20 hover:border-primary/50 dark:hover:border-white/40"
            )}
          >
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-secondary dark:bg-white/5 flex items-center justify-center">
              <Upload className="w-7 h-7 text-muted-foreground dark:text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-foreground dark:text-white mb-2">
              Upload Audio File
            </h4>
            <p className="text-sm text-muted-foreground dark:text-gray-400 mb-5">
              Support: MP3, WAV, OGG, WebM
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRecording || !!recordedBlob}
              className="bg-primary hover:bg-primary/90 px-6"
            >
              Choose File
            </Button>
            {uploadedFile && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <p className="inline-flex items-center gap-2 text-sm text-emerald-500 truncate max-w-full px-2">
                  <CircleCheck className="w-4 h-4 shrink-0" />
                  <span className="truncate">{uploadedFile.name}</span>
                </p>
                <button
                  type="button"
                  onClick={clearUploadedFile}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Record Option - Dashed Border */}
          <div
            className={cn(
              "rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200",
              recordedBlob || isRecording
                ? "border-primary bg-primary/5"
                : "border-border dark:border-white/20 hover:border-primary/50 dark:hover:border-white/40"
            )}
          >
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-secondary dark:bg-white/5 flex items-center justify-center">
              <Mic className="w-7 h-7 text-muted-foreground dark:text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-foreground dark:text-white mb-2">
              Record Audio
            </h4>
            <p className="text-sm text-muted-foreground dark:text-gray-400 mb-5">
              Record up to 30 seconds
            </p>
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!!uploadedFile}
              className={cn(
                "px-6",
                isRecording
                  ? "bg-destructive hover:bg-destructive/90"
                  : uploadedFile
                    ? "bg-muted dark:bg-white/10 text-muted-foreground dark:text-gray-500 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90"
              )}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop ({30 - recordingTime}s)
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </>
              )}
            </Button>
            {recordedBlob && !isRecording && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <p className="inline-flex items-center gap-2 text-sm text-emerald-500">
                  <CircleCheck className="w-4 h-4" />
                  Recording saved
                </p>
                <button
                  type="button"
                  onClick={clearRecording}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note Banner */}
      <div className="mt-6 bg-amber-500/10 dark:bg-amber-900/20 border border-amber-500/30 dark:border-amber-500/20 rounded-xl px-5 py-4">
        <p className="text-sm text-amber-700 dark:text-amber-400">
          <span className="font-semibold">Note:</span> You can either upload an
          audio file OR record audio, not both. Choose the option that works
          best for you.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8">
        <Button
          variant="secondary"
          onClick={onPrevious}
          className="bg-secondary dark:bg-[#1a1f2e] hover:bg-secondary/80 dark:hover:bg-[#252b3b] border-0 text-foreground dark:text-white px-6"
        >
          Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={!hasAudio}
          className={cn(
            "px-8",
            hasAudio
              ? "bg-primary hover:bg-primary/90"
              : "bg-muted dark:bg-white/10 text-muted-foreground dark:text-gray-500 cursor-not-allowed"
          )}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
