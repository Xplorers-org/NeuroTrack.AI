"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

type DialogAction = {
  label: string;
  onClick: () => void;
};

type AnalysisCompleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completedAnalysisLabel: string;
  primaryActions: DialogAction[];
  onViewCurrentResult: () => void;
  onViewDashboard: () => void;
};

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <DialogTitle className="mt-2 text-2xl">
            {completedAnalysisLabel.charAt(0).toUpperCase() +
              completedAnalysisLabel.slice(1)}{" "}
            analysis complete
          </DialogTitle>
          <DialogDescription>
            Choose what you would like to do next.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          {primaryActions.map((action) => (
            <Button
              key={action.label}
              onClick={action.onClick}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {action.label}
            </Button>
          ))}

          <Button
            variant="outline"
            onClick={onViewCurrentResult}
            className="w-full"
          >
            View Current Result
          </Button>
          <Button variant="ghost" onClick={onViewDashboard} className="w-full">
            Go to Dashboard
          </Button>
        </div>

        <DialogFooter className="sr-only">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
