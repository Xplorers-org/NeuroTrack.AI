"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisSidebar } from "@/components/analysis/analysis-sidebar";
import { Button } from "@/components/ui/button";
import { Database, Eye } from "lucide-react";

type AnalysisHistoryItem = {
  id: string;
  type: "voice" | "gait" | "drawing";
  source: string;
  fileName: string;
  fileSize: string;
  score?: number;
  severity?: string;
  submittedAt: string;
};

type PatientSummary = {
  fullName?: string;
  patientId?: string;
  age?: string | number;
  gender?: string;
};

type DbHistoryRow = Record<string, unknown>;

const SUMMARY_CARDS: Array<{
  label: string;
  key: AnalysisHistoryItem["type"];
  color: string;
  route: string;
}> = [
  {
    label: "Voice Analysis",
    key: "voice",
    color: "text-cyan-500",
    route: "/analysis/voice",
  },
  {
    label: "Drawing Analysis",
    key: "drawing",
    color: "text-emerald-500",
    route: "/analysis/drawing",
  },
  {
    label: "Gait Analysis",
    key: "gait",
    color: "text-amber-500",
    route: "/analysis/gait",
  },
];

const getStringValue = (value: unknown, fallback = "") => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
};

const getNumberValue = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const getDateValue = (row: DbHistoryRow) => {
  const candidate =
    getStringValue(row.submittedAt) ||
    getStringValue(row.submitted_at) ||
    getStringValue(row.created_at) ||
    getStringValue(row.test_time) ||
    new Date().toISOString();

  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime())
    ? new Date(0).toISOString()
    : parsed.toISOString();
};

const inferAnalysisType = (
  row: DbHistoryRow,
): AnalysisHistoryItem["type"] | null => {
  const explicitType = getStringValue(
    row.type || row.analysis_type,
  ).toLowerCase();
  if (
    explicitType === "voice" ||
    explicitType === "gait" ||
    explicitType === "drawing"
  ) {
    return explicitType;
  }

  if (
    row.voice_prediction !== undefined ||
    row.prediction !== undefined ||
    row.test_count !== undefined
  ) {
    return "voice";
  }

  if (row.gait_score !== undefined || row.gait_stability_score !== undefined) {
    return "gait";
  }

  if (
    row.motor_impairment_score !== undefined ||
    row.drawing_type !== undefined
  ) {
    return "drawing";
  }

  return null;
};

const toHistoryItem = (row: DbHistoryRow): AnalysisHistoryItem | null => {
  const type = inferAnalysisType(row);
  if (!type) {
    return null;
  }

  const score =
    getNumberValue(row.score) ??
    getNumberValue(row.voice_prediction) ??
    getNumberValue(row.prediction) ??
    getNumberValue(row.gait_score) ??
    getNumberValue(row.gait_stability_score) ??
    getNumberValue(row.motor_impairment_score);

  const severity =
    getStringValue(row.severity) ||
    getStringValue(row.severity_level) ||
    getStringValue(row.label) ||
    getStringValue(row.interpretation) ||
    getStringValue(row.analysis_summary);

  const source =
    getStringValue(row.source) ||
    getStringValue(row.analysis_source) ||
    getStringValue(row.drawing_type) ||
    (type === "voice" ? "recording" : type === "gait" ? "video" : "drawing");

  const fileName =
    getStringValue(row.fileName) ||
    getStringValue(row.file_name) ||
    getStringValue(row.audio_file_name) ||
    getStringValue(row.video_file_name) ||
    getStringValue(row.drawing_file_name) ||
    getStringValue(row.filename) ||
    `${type}-analysis`;

  const fileSize =
    getStringValue(row.fileSize) ||
    getStringValue(row.file_size) ||
    getStringValue(row.audio_file_size) ||
    getStringValue(row.video_file_size) ||
    getStringValue(row.drawing_file_size) ||
    "N/A";

  return {
    id: getStringValue(row.id, `${type}-${getDateValue(row)}`),
    type,
    source,
    fileName,
    fileSize,
    score,
    severity,
    submittedAt: getDateValue(row),
  };
};

export default function ResultsPage() {
  const router = useRouter();
  const [patientData, setPatientData] = useState<PatientSummary | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sortedHistory = useMemo(
    () =>
      [...history].sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      ),
    [history],
  );

  const latestSummary = useMemo(() => {
    const latestByType: Partial<
      Record<AnalysisHistoryItem["type"], AnalysisHistoryItem>
    > = {};

    for (const item of sortedHistory) {
      if (!latestByType[item.type]) {
        latestByType[item.type] = item;
      }
    }

    return latestByType;
  }, [sortedHistory]);

  const latestSubmittedAt = useMemo(() => {
    if (sortedHistory.length === 0) {
      return null;
    }

    return new Date(sortedHistory[0].submittedAt).toLocaleString();
  }, [sortedHistory]);

  const loadHistory = async () => {
    const storedData =
      typeof window === "undefined"
        ? null
        : sessionStorage.getItem("patientData");
    const parsedPatient = storedData
      ? (JSON.parse(storedData) as PatientSummary)
      : null;
    setPatientData(parsedPatient);

    if (!parsedPatient?.patientId) {
      setError("Patient ID is missing. Register or load a patient first.");
      setHistory([]);
      setIsLoading(false);
      return;
    }

    setError(null);

    try {
      const res = await fetch(
        `/api/patients/${encodeURIComponent(parsedPatient.patientId)}/history`,
      );

      if (res.status === 404) {
        setHistory([]);
        return;
      }

      if (!res.ok) {
        let message = "Failed to load database history.";
        try {
          const data = await res.json();
          message = typeof data?.error === "string" ? data.error : message;
        } catch {
          const text = await res.text();
          if (text) message = text;
        }
        throw new Error(message);
      }

      const rows: DbHistoryRow[] = await res.json();
      const normalized = rows
        .map((row) => toHistoryItem(row))
        .filter((item): item is AnalysisHistoryItem => Boolean(item));

      setHistory(normalized);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load results.",
      );
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const getProgress = () => ({ current: 4, total: 4 });

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0a0e17]">
      <AnalysisSidebar
        currentStep="results"
        completedSteps={["patient-info", "voice", "gait", "drawing"]}
        progress={getProgress()}
      />

      <main className="flex-1 ml-60">
        <div className="max-w-5xl mx-auto px-8 py-12">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
                Results
              </h1>
              <p className="text-muted-foreground dark:text-gray-400 mt-2">
                Combined summary for all 3 analyses.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-gray-400">
              <Database className="w-4 h-4 text-primary" />
              <span>Synced from database</span>
              {latestSubmittedAt && (
                <span className="hidden md:inline">
                  • Latest update {latestSubmittedAt}
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-amber-500/10 dark:bg-amber-900/20 border border-amber-500/30 dark:border-amber-500/20 rounded-xl px-5 py-4 mb-6">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {error}
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-6">
              <div className="h-36 rounded-2xl border border-border dark:border-white/10 bg-card dark:bg-[#161b26] animate-pulse" />
              <div className="grid md:grid-cols-3 gap-4">
                <div className="h-56 rounded-xl border border-border dark:border-white/10 bg-card dark:bg-[#161b26] animate-pulse" />
                <div className="h-56 rounded-xl border border-border dark:border-white/10 bg-card dark:bg-[#161b26] animate-pulse" />
                <div className="h-56 rounded-xl border border-border dark:border-white/10 bg-card dark:bg-[#161b26] animate-pulse" />
              </div>
            </div>
          ) : (
            <>
              <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-6 mb-6">
                <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
                  Patient Summary
                </h3>
                <div className="grid md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-secondary dark:bg-[#0f1219] rounded-lg p-4">
                    <p className="text-muted-foreground dark:text-gray-400">
                      Name
                    </p>
                    <p className="font-semibold text-foreground dark:text-white">
                      {patientData?.fullName || "N/A"}
                    </p>
                  </div>
                  <div className="bg-secondary dark:bg-[#0f1219] rounded-lg p-4">
                    <p className="text-muted-foreground dark:text-gray-400">
                      Patient ID
                    </p>
                    <p className="font-semibold text-foreground dark:text-white">
                      {patientData?.patientId || "N/A"}
                    </p>
                  </div>
                  <div className="bg-secondary dark:bg-[#0f1219] rounded-lg p-4">
                    <p className="text-muted-foreground dark:text-gray-400">
                      Age
                    </p>
                    <p className="font-semibold text-foreground dark:text-white">
                      {patientData?.age || "N/A"}
                    </p>
                  </div>
                  <div className="bg-secondary dark:bg-[#0f1219] rounded-lg p-4">
                    <p className="text-muted-foreground dark:text-gray-400">
                      Gender
                    </p>
                    <p className="font-semibold text-foreground dark:text-white capitalize">
                      {patientData?.gender || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
          <p className="text-xl font-semibold py-4 ml-2">Lateset test Results</p>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {SUMMARY_CARDS.map((card) => {
                  const result = latestSummary[card.key];
                  const hasScore = typeof result?.score === "number";

                  return (
                    <div
                      key={card.key}
                      className="bg-card dark:bg-[#161b26] rounded-xl border border-border dark:border-white/10 p-5"
                    >
                      <p className="text-sm text-muted-foreground dark:text-gray-400">
                        {card.label}
                      </p>
                      <p className={`text-3xl font-bold mt-2 ${card.color}`}>
                        {hasScore ? result.score!.toFixed(1) : "N/A"}
                      </p>
                      <p className="text-sm text-foreground dark:text-white mt-1">
                        {result?.severity || "Pending"}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400 mt-2">
                        {result
                          ? new Date(result.submittedAt).toLocaleString()
                          : "No submission yet"}
                      </p>
                      {/* <Button
                        variant="outline"
                        onClick={() => router.push(card.route)}
                        className="mt-4 w-full border-border dark:border-white/10"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button> */}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/analysis/progress")}
                  className="border-border dark:border-white/10"
                >
                  Open Progress
                </Button>
                <Button
                  onClick={() => {
                    sessionStorage.removeItem("patientData");
                    sessionStorage.removeItem("sessionId");
                    sessionStorage.removeItem("voiceResult");
                    sessionStorage.removeItem("gaitResult");
                    sessionStorage.removeItem("drawingResult");
                    sessionStorage.removeItem("voiceAnalysisSubmission");
                    router.push("/");
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  Start New Analysis
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
