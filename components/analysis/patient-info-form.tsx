"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  UserPlus,
  Search,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PatientData {
  fullName: string;
  patientId: string;
  gender: string;
  age: string;
}

interface PatientInfoFormProps {
  onNext: (data: PatientData, mode: "register" | "find") => void;
  onPrevious?: () => void;
}

export function PatientInfoForm({ onNext, onPrevious }: PatientInfoFormProps) {
  const [mode, setMode] = useState<"register" | "find">("register");
  const [formData, setFormData] = useState<PatientData>({
    fullName: "",
    patientId: "",
    gender: "",
    age: "",
  });
  const [errors, setErrors] = useState<Partial<PatientData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Partial<PatientData> = {};

    if (mode === "register") {
      if (!formData.fullName.trim())
        newErrors.fullName = "Full name is required";
      if (!formData.patientId.trim())
        newErrors.patientId = "Patient ID is required";
      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.age.trim()) newErrors.age = "Age is required";
    } else {
      if (!formData.patientId.trim())
        newErrors.patientId = "Patient ID is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onNext(formData, mode);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-card dark:bg-[#161b26] rounded-2xl border border-border dark:border-white/10 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4">
          <h2 className="text-xl font-semibold text-foreground dark:text-white">
            Information
          </h2>
          <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
            Patient details
          </p>

          {/* Toggle Buttons */}
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setMode("register")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                mode === "register"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary dark:bg-white/5 text-muted-foreground dark:text-gray-400 hover:bg-secondary/80 dark:hover:bg-white/10",
              )}
            >
              <UserPlus className="w-4 h-4" />
              Register New Patient
            </button>
            <button
              onClick={() => setMode("find")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                mode === "find"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary dark:bg-white/5 text-muted-foreground dark:text-gray-400 hover:bg-secondary/80 dark:hover:bg-white/10 border border-border dark:border-white/10",
              )}
            >
              <Search className="w-4 h-4" />
              Find Existing Patient
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-6 pb-6">
          <div className="bg-secondary/50 dark:bg-white/5 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-cyan-500/20 flex items-center justify-center shrink-0">
                {mode === "register" ? (
                  <UserPlus className="w-4 h-4 text-primary dark:text-cyan-400" />
                ) : (
                  <Search className="w-4 h-4 text-primary dark:text-cyan-400" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground dark:text-white">
                  {mode === "register"
                    ? "Register New Patient"
                    : "Find Patient"}
                </h3>
                <p className="text-sm text-muted-foreground dark:text-gray-400 mt-0.5">
                  {mode === "register"
                    ? "Please provide basic details for the analysis"
                    : "Search for an existing patient using their ID"}
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          {mode === "register" ? (
            <div className="space-y-5">
              <div>
                <Label className="text-sm font-medium text-foreground dark:text-gray-300">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className={cn(
                    "mt-2 bg-background dark:bg-[#0f1219] border-border dark:border-white/10",
                    errors.fullName && "border-destructive",
                  )}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-foreground dark:text-gray-300">
                  Patient ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g., PAT-2024-001"
                  value={formData.patientId}
                  onChange={(e) =>
                    setFormData({ ...formData, patientId: e.target.value })
                  }
                  className={cn(
                    "mt-2 bg-background dark:bg-[#0f1219] border-border dark:border-white/10",
                    errors.patientId && "border-destructive",
                  )}
                />
                {errors.patientId && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.patientId}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-foreground dark:text-gray-300">
                    Gender <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gender: value })
                    }
                  >
                    <SelectTrigger
                      className={cn(
                        "mt-2 bg-background dark:bg-[#0f1219] border-border dark:border-white/10",
                        errors.gender && "border-destructive",
                      )}
                    >
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.gender}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground dark:text-gray-300">
                    Age <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="45"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                    className={cn(
                      "mt-2 bg-background dark:bg-[#0f1219] border-border dark:border-white/10",
                      errors.age && "border-destructive",
                    )}
                  />
                  {errors.age && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.age}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <Label className="text-sm font-medium text-foreground dark:text-gray-300">
                  Patient ID <span className="text-destructive">*</span>
                </Label>
                <div className="mt-2 flex items-center gap-3">
                  <Input
                    placeholder="Enter patient ID"
                    value={formData.patientId}
                    onChange={(e) =>
                      setFormData({ ...formData, patientId: e.target.value })
                    }
                    className={cn(
                      "bg-background dark:bg-[#0f1219] border-border dark:border-white/10",
                      errors.patientId && "border-destructive",
                    )}
                  />
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Search
                  </Button>
                </div>
                {errors.patientId && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.patientId}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border dark:border-white/10 bg-secondary/30 dark:bg-white/2">
          <Button
            variant="ghost"
            onClick={onPrevious}
            className="text-muted-foreground"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
