"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisSidebar } from "@/components/analysis/analysis-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, RefreshCw, Search, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PatientSummary = {
  fullName?: string;
  patientId?: string;
  gender?: string;
  age?: string | number;
};

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

type DbHistoryRow = Record<string, unknown>;

type TrendPoint = {
  label: string;
  voice: number | null;
  gait: number | null;
  drawing: number | null;
  submittedAt: string;
};

const chartColors = {
  voice: "#22d3ee",
  gait: "#8b5cf6",
  drawing: "#10b981",
};

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

export default function ProgressPage() {
  const router = useRouter();
  const [patientId, setPatientId] = useState("");
  const [patientData, setPatientData] = useState<PatientSummary | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<AnalysisHistoryItem["type"]>>(
    new Set(["voice", "gait", "drawing"])
  );
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");

  const sortedHistory = useMemo(
    () =>
      [...history].sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      ),
    [history],
  );

  const filteredHistory = useMemo(
    () => {
      let result = sortedHistory.filter((item) => selectedTypes.has(item.type));

      if (dateFromFilter) {
        const fromDate = new Date(dateFromFilter).getTime();
        result = result.filter((item) => new Date(item.submittedAt).getTime() >= fromDate);
      }

      if (dateToFilter) {
        const toDate = new Date(dateToFilter);
        toDate.setHours(23, 59, 59, 999);
        const toTime = toDate.getTime();
        result = result.filter((item) => new Date(item.submittedAt).getTime() <= toTime);
      }

      return result;
    },
    [sortedHistory, selectedTypes, dateFromFilter, dateToFilter],
  );

  const progression = useMemo(() => {
    const sorted = [...history]
      .filter((row) => typeof row.score === "number")
      .sort(
        (a, b) =>
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
      );

    let voice: number | null = null;
    let gait: number | null = null;
    let drawing: number | null = null;

    const points: TrendPoint[] = [];

    for (const item of sorted) {
      if (item.type === "voice") voice = item.score ?? null;
      if (item.type === "gait") gait = item.score ?? null;
      if (item.type === "drawing") drawing = item.score ?? null;

      const date = new Date(item.submittedAt);
      points.push({
        label: date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        voice,
        gait,
        drawing,
        submittedAt: item.submittedAt,
      });
    }

    return points;
  }, [history]);

  const fetchHistoryByPatientId = async (
    searchQuery: string,
    fromRefresh = false,
  ) => {
    const query = searchQuery.trim();
    if (!query) {
      setError("Please enter a patient ID or name.");
      setHistory([]);
      return;
    }

    setError(null);
    if (fromRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // First, search for the patient by ID or name
      console.log("[progress] Searching for patient:", query);
      const searchRes = await fetch(
        `/api/patients/search?query=${encodeURIComponent(query)}`
      );

      if (!searchRes.ok) {
        setHistory([]);
        setError(
          `Patient not found. Check the ID or name and try again.`
        );
        setPatientData(null);
        return;
      }

      const searchData = await searchRes.json();
      console.log("[progress] Search result:", searchData);
      const { patient_id: foundPatientId } = searchData;

      if (!foundPatientId) {
        setHistory([]);
        setError("Search returned no patient ID.");
        setPatientData(null);
        return;
      }

      console.log("[progress] Found patient_id:", foundPatientId, "| Type:", typeof foundPatientId, "| Length:", foundPatientId?.length);

      // Now fetch history using the found patient_id
      const historyUrl = `/api/patients/${encodeURIComponent(foundPatientId)}/history`;
      console.log("[progress] 🔗 Calling history endpoint:", historyUrl);
      const historyRes = await fetch(historyUrl);

      console.log("[progress] History response status:", historyRes.status);

      if (historyRes.status === 404) {
        console.log("[progress] No history found (404) for patient_id:", foundPatientId);
        setHistory([]);
        setError("No analysis history found for this patient.");
        return;
      }

      if (!historyRes.ok) {
        let message = "Failed to load progress data.";
        try {
          const data = await historyRes.json();
          console.log("[progress] History error response:", data);
          message = typeof data?.error === "string" ? data.error : message;
        } catch {
          const text = await historyRes.text();
          if (text) message = text;
        }
        throw new Error(message);
      }

      const rows: DbHistoryRow[] = await historyRes.json();
      console.log("[progress] Fetched rows:", rows?.length || 0);
      const normalized = rows
        .map((row) => toHistoryItem(row))
        .filter((item): item is AnalysisHistoryItem => Boolean(item));

      console.log("[progress] Normalized items:", normalized?.length || 0);
      setHistory(normalized);

      // Fetch patient details
      try {
        const patientRes = await fetch(
          `/api/debug/patient/${encodeURIComponent(foundPatientId)}`
        );
        if (patientRes.ok) {
          const patientInfo = await patientRes.json();
          const pt = patientInfo?.patient;
          setPatientData({
            fullName: pt?.full_name || undefined,
            patientId: foundPatientId,
            gender: pt?.gender || undefined,
            age: pt?.age || undefined,
          });
        } else {
          setPatientData({
            patientId: foundPatientId,
          });
        }
      } catch (err) {
        console.error("Failed to fetch patient details:", err);
        setPatientData({
          patientId: foundPatientId,
        });
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load progress data.",
      );
      setHistory([]);
      setPatientData(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const storedData = sessionStorage.getItem("patientData");
    const parsed = storedData
      ? (JSON.parse(storedData) as PatientSummary)
      : null;

    if (parsed) {
      setPatientData(parsed);
      if (parsed.patientId) {
        setPatientId(parsed.patientId);
        void fetchHistoryByPatientId(parsed.patientId);
      }
    }
  }, []);

  const getProgress = () => ({ current: 4, total: 4 });

  const downloadFile = (
    fileName: string,
    content: string,
    mimeType: string,
  ) => {
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
      history: filteredHistory,
    };

    downloadFile(
      "analysis-progress-history.json",
      JSON.stringify(payload, null, 2),
      "application/json",
    );
  };

  const handleDownloadCsv = () => {
    const headers = [
      "Type",
      "Source",
      "File Name",
      "File Size",
      "Score",
      "Severity",
      "Submitted At",
    ];
    const rows = filteredHistory.map((item) => [
      item.type,
      item.source,
      item.fileName,
      item.fileSize,
      String(item.score ?? "N/A"),
      item.severity ?? "N/A",
      new Date(item.submittedAt).toLocaleString(),
    ]);

    const csvData = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");

    downloadFile(
      "analysis-progress-history.csv",
      csvData,
      "text/csv;charset=utf-8;",
    );
  };

  const toggleTypeFilter = (type: AnalysisHistoryItem["type"]) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0a0e17]">
      <AnalysisSidebar
        currentStep="progress"
        completedSteps={["patient-info", "voice", "gait", "drawing"]}
        progress={getProgress()}
      />

      <main className="flex-1 ml-60">
        <div className="max-w-[1300px] mx-auto px-8 py-12">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-foreground dark:text-white">
              Progression Over Time
            </h1>
            <p className="text-muted-foreground dark:text-gray-400 mt-3">
              Search by patient ID and track severity trends across all
              modalities.
            </p>
          </div>

          <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <Input
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Search by patient ID (p001) or name (e.g., John)"
                className="bg-background dark:bg-[#0f1219] border-border dark:border-white/10"
              />
              <Button
                onClick={() => void fetchHistoryByPatientId(patientId)}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                <Search className="w-4 h-4 mr-2" />
                Find Patient
              </Button>
              <Button
                variant="outline"
                onClick={() => void fetchHistoryByPatientId(patientId, true)}
                disabled={isLoading || isRefreshing}
                className="border-border dark:border-white/10"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          {patientData?.fullName || patientData?.patientId ? (
            <div className="bg-gradient-to-r from-primary/10 to-blue-600/10 dark:from-primary/20 dark:to-purple-500/20 rounded-2xl border border-primary/30 dark:border-primary/20 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
               <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground dark:text-gray-400 uppercase tracking-wide mb-2">
                    Patient ID
                  </span>
                  <span className="text-lg font-bold text-primary dark:text-cyan-400">
                    {patientData.patientId || "N/A"}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground dark:text-gray-400 uppercase tracking-wide mb-2">
                    Full Name
                  </span>
                  <span className="text-lg font-bold text-foreground dark:text-white">
                    {patientData.fullName || "N/A"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground dark:text-gray-400 uppercase tracking-wide mb-2">
                    Gender
                  </span>
                  <span className="text-lg font-bold text-foreground dark:text-white">
                    {patientData.gender ? patientData.gender.charAt(0).toUpperCase() + patientData.gender.slice(1) : "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground dark:text-gray-400 uppercase tracking-wide mb-2">
                    Age
                  </span>
                  <span className="text-lg font-bold text-foreground dark:text-white">
                    {patientData.age ? `${patientData.age} years` : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {error && (
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-500">
              {error}
            </div>
          )}

          <div className="bg-card dark:bg-[#0b1220] rounded-2xl border border-border dark:border-white/10 p-6 md:p-10 mb-6">
            {isLoading ? (
              <div className="h-[420px] animate-pulse rounded-2xl bg-secondary dark:bg-[#111827]" />
            ) : progression.length === 0 ? (
              <div className="h-[420px] flex items-center justify-center rounded-2xl border border-dashed border-border dark:border-white/10 text-muted-foreground dark:text-gray-400">
                No chart data available yet.
              </div>
            ) : (
              <div className="h-[420px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={progression}
                    margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 6" stroke="#1f2a44" />
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111827",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                        color: "#e2e8f0",
                      }}
                    />
                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="voice"
                      name="Voice"
                      stroke={chartColors.voice}
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="gait"
                      name="Gait"
                      stroke={chartColors.gait}
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="drawing"
                      name="Drawing"
                      stroke={chartColors.drawing}
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <h3 className="text-lg font-semibold text-foreground dark:text-white">
                Analysis History
              </h3>
              <div className="flex gap-2 flex-wrap">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border dark:border-white/10"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filter by Type
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 dark:bg-[#1f2a3e] dark:border-white/10">
                    <DropdownMenuLabel className="dark:text-gray-300">Analysis Type</DropdownMenuLabel>
                    <DropdownMenuSeparator className="dark:bg-white/10" />
                    <DropdownMenuCheckboxItem
                      checked={selectedTypes.has("voice")}
                      onCheckedChange={() => toggleTypeFilter("voice")}
                      className="dark:hover:bg-white/10"
                    >
                      <span className="w-3 h-3 rounded bg-cyan-500 mr-2" />
                      Voice
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={selectedTypes.has("gait")}
                      onCheckedChange={() => toggleTypeFilter("gait")}
                      className="dark:hover:bg-white/10"
                    >
                      <span className="w-3 h-3 rounded bg-purple-500 mr-2" />
                      Gait
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={selectedTypes.has("drawing")}
                      onCheckedChange={() => toggleTypeFilter("drawing")}
                      className="dark:hover:bg-white/10"
                    >
                      <span className="w-3 h-3 rounded bg-green-500 mr-2" />
                      Drawing
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  onClick={handleDownloadCsv}
                  className="border-border dark:border-white/10"
                  disabled={filteredHistory.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>
                <Button
                  onClick={handleDownloadJson}
                  className="bg-primary hover:bg-primary/90"
                  disabled={filteredHistory.length === 0}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download JSON
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground dark:text-gray-400 mb-1 block">
                  From Date
                </label>
                <Input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className="bg-background dark:bg-[#0f1219] border-border dark:border-white/10"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground dark:text-gray-400 mb-1 block">
                  To Date
                </label>
                <Input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className="bg-background dark:bg-[#0f1219] border-border dark:border-white/10"
                />
              </div>
              {(dateFromFilter || dateToFilter) && (
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateFromFilter("");
                      setDateToFilter("");
                    }}
                    className="text-xs dark:hover:bg-white/10"
                  >
                    Clear Dates
                  </Button>
                </div>
              )}
            </div>

            {filteredHistory.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border dark:border-white/10 bg-secondary/50 dark:bg-[#0f1219] p-6 text-sm text-muted-foreground dark:text-gray-400">
                No database analysis history available yet for this patient.
              </div>
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
                    {filteredHistory.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-border/60 dark:border-white/10"
                      >
                        <td className="py-3 pr-4 capitalize text-foreground dark:text-white">
                          {item.type}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground dark:text-gray-400">
                          {item.source}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground dark:text-gray-400">
                          {item.fileName}
                        </td>
                        <td className="py-3 pr-4 text-foreground dark:text-white">
                          {item.score !== undefined
                            ? item.score.toFixed(1)
                            : "N/A"}
                        </td>
                        <td className="py-3 pr-4 text-foreground dark:text-white">
                          {item.severity || "N/A"}
                        </td>
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

          <div className="mt-8 flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/analysis/results")}
              className="border-border dark:border-white/10"
            >
              Open Results
            </Button>
            <Button
              onClick={() => router.push("/analysis")}
              className="bg-primary hover:bg-primary/90"
            >
              New Session
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
