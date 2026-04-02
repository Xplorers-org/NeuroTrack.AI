"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";

type DialogAction = {
  label: string;
  onClick: () => void;
};

interface AnalysisCompleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completedAnalysisLabel: string;
  primaryActions: [DialogAction, DialogAction];
  onViewCurrentResult: () => void;
  onViewDashboard: () => void;
}

export function AnalysisCompleteDialog({
  open,
  onOpenChange,
  completedAnalysisLabel,
  primaryActions,
  onViewCurrentResult,
  onViewDashboard,
}: AnalysisCompleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl overflow-hidden border border-white/70 bg-transparent p-0 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.45)] backdrop-blur-sm dark:border-white/10">
        <div className="bg-white/85 backdrop-blur-xl dark:bg-[#0b1220]/92">
          <div className="relative border-b border-slate-200/70 bg-linear-to-br from-sky-50 via-blue-50 to-indigo-100 px-6 py-8 text-center text-slate-900 dark:border-white/10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/15">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                Analysis Complete!
              </DialogTitle>
              <DialogDescription className="mt-3 text-base text-slate-700 dark:text-slate-300">
                You have completed the {completedAnalysisLabel} analysis. Choose what you want to do next.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-3 bg-white/70 p-6 sm:grid-cols-2 dark:bg-[#111827]/85">
            <Button
              onClick={primaryActions[0].onClick}
              className="h-14 w-full justify-center border-0 bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 hover:from-blue-500 hover:to-indigo-500"
            >
              {primaryActions[0].label}
            </Button>

            <Button
              onClick={primaryActions[1].onClick}
              className="h-14 w-full justify-center border-0 bg-linear-to-r from-cyan-700 to-cyan-600 text-white shadow-lg shadow-violet-600/25 hover:from-cyan-500 hover:to-blue-400"
            >
              {primaryActions[1].label}
            </Button>

            <Button
              onClick={onViewCurrentResult}
              variant="secondary"
              className="h-14 w-full justify-center border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/95 dark:text-white dark:hover:bg-slate-700"
            >
              View Current Result
            </Button>

            <Button
              onClick={onViewDashboard}
              className="h-14 w-full justify-center border-0 bg-slate-800 text-white shadow-lg shadow-slate-800/20 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              View Dashboard
            </Button>
          </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}
