"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisSidebar } from "@/components/analysis/analysis-sidebar";
import { Button } from "@/components/ui/button";
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

type PatientData = {
  fullName?: string;
  patientId?: string;
  gender?: string;
  age?: string;
};

type HistoryItem = {
  id: string;
  type: "voice" | "gait" | "drawing";
  score?: number;
  submittedAt: string;
};

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

export default function DashboardPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const storedData = sessionStorage.getItem("patientData");
      const parsed = storedData ? (JSON.parse(storedData) as PatientData) : null;

      if (!parsed?.patientId) {
        setError("Patient ID is missing. Start a patient session first.");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/patients/${encodeURIComponent(parsed.patientId)}/history`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(typeof data?.error === "string" ? data.error : "Failed to load dashboard data.");
        }

        const rows: HistoryItem[] = await res.json();
        setHistory(rows.filter((row) => typeof row.score === "number"));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const progression = useMemo(() => {
    const sorted = [...history]
      .filter((row) => typeof row.score === "number")
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

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
        label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        voice,
        gait,
        drawing,
        submittedAt: item.submittedAt,
      });
    }

    return points;
  }, [history]);

  const getProgress = () => ({ current: 3, total: 3 });

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0a0e17]">
      <AnalysisSidebar currentStep="dashboard" completedSteps={["patient-info", "voice", "gait", "drawing"]} progress={getProgress()} />

      <main className="flex-1 ml-60">
        <div className="max-w-[1300px] mx-auto px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground dark:text-white">Progression Over Time</h1>
            <p className="text-muted-foreground dark:text-gray-400 mt-3 text-3">
              Longitudinal tracking of severity scores across all modalities.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-500">
              {error}
            </div>
          )}

          <div className="bg-card dark:bg-[#0b1220] rounded-4xl border border-border dark:border-white/10 p-6 md:p-10">
            {isLoading ? (
              <div className="h-[420px] animate-pulse rounded-2xl bg-secondary dark:bg-[#111827]" />
            ) : progression.length === 0 ? (
              <div className="h-[420px] flex items-center justify-center rounded-2xl border border-dashed border-border dark:border-white/10 text-muted-foreground dark:text-gray-400">
                No chart data available yet.
              </div>
            ) : (
              <div className="h-[420px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progression} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
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

                    <Line type="monotone" dataKey="voice" name="Voice" stroke={chartColors.voice} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                    <Line type="monotone" dataKey="gait" name="Gait" stroke={chartColors.gait} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                    <Line type="monotone" dataKey="drawing" name="Drawing" stroke={chartColors.drawing} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-4">
            <Button variant="outline" onClick={() => router.push("/analysis/results")} className="border-border dark:border-white/10">
              Open Results
            </Button>
            <Button onClick={() => router.push("/analysis")} className="bg-primary hover:bg-primary/90">
              New Session
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
