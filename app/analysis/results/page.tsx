"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisSidebar } from "@/components/analysis/analysis-sidebar";
import { StepIndicator } from "@/components/analysis/step-indicator";
import { Button } from "@/components/ui/button";
import { Download, Eye, FileText } from "lucide-react";
import { PatientData } from "@/components/analysis/patient-info-form";

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
  const [patientData] = useState<PatientData | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedData = sessionStorage.getItem("patientData");
    return storedData ? JSON.parse(storedData) : null;
  });
  const completedSteps = ["patient-info", "voice", "gait", "drawing"];

  const [history] = useState<AnalysisHistoryItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const storedHistory = sessionStorage.getItem("analysisHistory");
    return storedHistory ? JSON.parse(storedHistory) : [];
  });

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
    [history],
  );

  const latestSummary = useMemo(() => {
    const latestByType: Partial<Record<AnalysisHistoryItem["type"], AnalysisHistoryItem>> = {};

    for (const item of sortedHistory) {
      if (!latestByType[item.type]) {
        latestByType[item.type] = item;
      }
    }

    return latestByType;
  }, [sortedHistory]);

  const summaryCards = [
    {
      label: "Voice Analysis",
      key: "voice" as const,
      color: "text-cyan-500",
      route: "/analysis/voice",
    },
    {
      label: "Gait Analysis",
      key: "gait" as const,
      color: "text-amber-500",
      route: "/analysis/gait",
    },
    {
      label: "Drawing Analysis",
      key: "drawing" as const,
      color: "text-emerald-500",
      route: "/analysis/drawing",
    },
  ];

  const getProgress = () => {
    return { current: 4, total: 4 };
  };

  const downloadFile = (fileName: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(objectUrl);
  };

  const handleDownloadJson = () => {
    const payload = {
      patient: patientData,
      generatedAt: new Date().toISOString(),
      summary: latestSummary,
      history: sortedHistory,
    };

    downloadFile("analysis-history-summary.json", JSON.stringify(payload, null, 2), "application/json");
  };

  const handleDownloadCsv = () => {
    const headers = ["Type", "Source", "File Name", "File Size", "Score", "Severity", "Submitted At"];
    const rows = sortedHistory.map((item) => [
      item.type,
      item.source,
      item.fileName,
      item.fileSize,
      String(item.score),
      item.severity,
      new Date(item.submittedAt).toLocaleString(),
    ]);

    const csvData = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replaceAll("\"", "\"\"")}"`).join(","))
      .join("\n");

    downloadFile("analysis-history-summary.csv", csvData, "text/csv;charset=utf-8;");
  };

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0a0e17]">
      <AnalysisSidebar
        currentStep="results"
        completedSteps={completedSteps}
        progress={getProgress()}
      />

      <main className="flex-1 ml-60">
        <div className="max-w-5xl mx-auto px-8 py-12">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
              Results
            </h1>
            <p className="text-muted-foreground dark:text-gray-400 mt-2">
              Combined summary and history for all 3 analyses.
            </p>
          </div>

          <StepIndicator steps={resultSteps} currentStep={4} />

          <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-6 mb-6">
            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">Patient Summary</h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div className="bg-secondary dark:bg-[#0f1219] rounded-lg p-4">
                <p className="text-muted-foreground dark:text-gray-400">Name</p>
                <p className="font-semibold text-foreground dark:text-white">{patientData?.fullName || "N/A"}</p>
              </div>
              <div className="bg-secondary dark:bg-[#0f1219] rounded-lg p-4">
                <p className="text-muted-foreground dark:text-gray-400">Patient ID</p>
                <p className="font-semibold text-foreground dark:text-white">{patientData?.patientId || "N/A"}</p>
              </div>
              <div className="bg-secondary dark:bg-[#0f1219] rounded-lg p-4">
                <p className="text-muted-foreground dark:text-gray-400">Age</p>
                <p className="font-semibold text-foreground dark:text-white">{patientData?.age || "N/A"}</p>
              </div>
              <div className="bg-secondary dark:bg-[#0f1219] rounded-lg p-4">
                <p className="text-muted-foreground dark:text-gray-400">Gender</p>
                <p className="font-semibold text-foreground dark:text-white capitalize">{patientData?.gender || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {summaryCards.map((card) => {
              const result = latestSummary[card.key];

              return (
                <div key={card.key} className="bg-card dark:bg-[#161b26] rounded-xl border border-border dark:border-white/10 p-5">
                  <p className="text-sm text-muted-foreground dark:text-gray-400">{card.label}</p>
                  <p className={`text-3xl font-bold mt-2 ${card.color}`}>
                    {result ? result.score.toFixed(1) : "N/A"}
                  </p>
                  <p className="text-sm text-foreground dark:text-white mt-1">{result ? result.severity : "Pending"}</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-2">
                    {result ? new Date(result.submittedAt).toLocaleString() : "No submission yet"}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push(card.route)}
                    className="mt-4 w-full border-border dark:border-white/10"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground dark:text-white">Analysis History</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownloadCsv} className="border-border dark:border-white/10">
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>
                <Button onClick={handleDownloadJson} className="bg-primary hover:bg-primary/90">
                  <FileText className="w-4 h-4 mr-2" />
                  Download JSON
                </Button>
              </div>
            </div>

            {sortedHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground dark:text-gray-400">No analysis history available yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border dark:border-white/10">
                      <th className="py-3 pr-4">Type</th>
                      <th className="py-3 pr-4">Source</th>
                      <th className="py-3 pr-4">File</th>
                      <th className="py-3 pr-4">Score</th>
                      <th className="py-3 pr-4">Severity</th>
                      <th className="py-3 pr-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHistory.map((item) => (
                      <tr key={item.id} className="border-b border-border/60 dark:border-white/10">
                        <td className="py-3 pr-4 capitalize text-foreground dark:text-white">{item.type}</td>
                        <td className="py-3 pr-4 text-muted-foreground dark:text-gray-400">{item.source}</td>
                        <td className="py-3 pr-4 text-muted-foreground dark:text-gray-400">{item.fileName}</td>
                        <td className="py-3 pr-4 text-foreground dark:text-white">{item.score.toFixed(1)}</td>
                        <td className="py-3 pr-4 text-foreground dark:text-white">{item.severity}</td>
                        <td className="py-3 pr-4 text-muted-foreground dark:text-gray-400">
                          {new Date(item.submittedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/analysis/dashboard")}
              className="border-border dark:border-white/10"
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={() => {
                sessionStorage.removeItem("analysisHistory");
                sessionStorage.removeItem("voiceAnalysisSubmission");
                router.push("/");
              }}
              className="bg-primary hover:bg-primary/90"
            >
              Start New Analysis
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
