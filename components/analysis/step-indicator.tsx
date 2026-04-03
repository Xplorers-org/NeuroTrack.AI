"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface Step {
  id: number;
  title: string;
  subtitle: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 py-8">
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isActive = step.id === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
                  isCompleted
                    ? "bg-cyan-500 text-white"
                    : isActive
                      ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                      : "bg-muted dark:bg-white/10 text-muted-foreground dark:text-gray-400"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>

              {/* Labels */}
              <div className="mt-3 text-center">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isActive || isCompleted
                      ? "text-foreground dark:text-white"
                      : "text-muted-foreground dark:text-gray-400"
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground dark:text-gray-500 mt-0.5">
                  {step.subtitle}
                </p>
              </div>
            </div>

            {/* Connector Line */}
            {!isLast && (
              <div
                className={cn(
                  "w-32 h-0.5 mx-4 mt-[-2rem]",
                  isCompleted
                    ? "bg-cyan-500"
                    : "bg-muted dark:bg-white/10"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
