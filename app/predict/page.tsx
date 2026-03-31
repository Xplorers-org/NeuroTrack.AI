"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PatientInformation from "@/components/predict/patient-information";
import VoiceAnalysis from "@/components/predict/voice-analysis";
import DrawingAnalysis from "@/components/predict/drawing-analysis";
import WalkingAnalysis from "@/components/predict/walking-analysis";
import FinalResults from "@/components/predict/final-results";
import AnalysisSidebar from "@/components/predict/analysis-sidebar";
import PhaseIndicator from "@/components/predict/phase-indicator";
import Header from "@/components/landing/header";
import Footer from "@/components/landing/footer";

type AnalysisSection = "patient" | "voice" | "drawing" | "walking" | "results";

interface FormData {
  fullName: string;
  age: string;
  gender: string;
  testTime: string;
  patientId?: string;
  isNewPatient?: boolean;
  voiceFile?: File;
  voiceUrl?: string;
  drawingFile?: File;
  drawingUrl?: string;
  videoFile?: File;
  videoUrl?: string;
}

const SECTIONS = [
  { id: "patient", label: "Patient Info", icon: "User" },
  { id: "voice", label: "Voice Analysis", icon: "Mic" },
  { id: "drawing", label: "Drawing Analysis", icon: "Pen" },
  { id: "walking", label: "Walking Video", icon: "Video" },
];

const PHASE_STEPS = {
  patient: 1,
  voice: 2,
  drawing: 2,
  walking: 2,
};

export default function PredictPage() {
  const [currentSection, setCurrentSection] =
    useState<AnalysisSection>("patient");
  const [phaseInSection, setPhaseInSection] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    age: "",
    gender: "",
    testTime: "",
    patientId: "",
    isNewPatient: true,
  });

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    // Check if we can move to next phase in current section
    if (
      phaseInSection < PHASE_STEPS[currentSection as keyof typeof PHASE_STEPS]
    ) {
      setPhaseInSection(phaseInSection + 1);
    } else {
      // Move to next section
      const sectionOrder: AnalysisSection[] = [
        "patient",
        "voice",
        "drawing",
        "walking",
        "results",
      ];
      const currentIndex = sectionOrder.indexOf(currentSection);
      if (currentIndex < sectionOrder.length - 1) {
        setCurrentSection(sectionOrder[currentIndex + 1]);
        setPhaseInSection(1);
      }
    }
  };

  const handlePrevious = () => {
    if (phaseInSection > 1) {
      setPhaseInSection(phaseInSection - 1);
    } else {
      // Move to previous section
      const sectionOrder: AnalysisSection[] = [
        "patient",
        "voice",
        "drawing",
        "walking",
        "results",
      ];
      const currentIndex = sectionOrder.indexOf(currentSection);
      if (currentIndex > 0) {
        const prevSection = sectionOrder[currentIndex - 1];
        setCurrentSection(prevSection);
        setPhaseInSection(PHASE_STEPS[prevSection as keyof typeof PHASE_STEPS]);
      }
    }
  };

  const renderContent = () => {
    switch (currentSection) {
      case "patient":
        return (
          <PatientInformation
            formData={formData}
            onFormChange={handleFormChange}
          />
        );
      case "voice":
        return (
          <VoiceAnalysis
            phase={phaseInSection}
            formData={formData}
            onFormChange={handleFormChange}
          />
        );
      case "drawing":
        return (
          <DrawingAnalysis
            phase={phaseInSection}
            formData={formData}
            onFormChange={handleFormChange}
          />
        );
      case "walking":
        return (
          <WalkingAnalysis
            phase={phaseInSection}
            formData={formData}
            onFormChange={handleFormChange}
          />
        );
      case "results":
        return <FinalResults formData={formData} />;
      default:
        return null;
    }
  };

  const isFirstStep = currentSection === "patient" && phaseInSection === 1;
  const isLastStep = currentSection === "results";

  return (
    <>
    <Header />
      <div className="min-h-screen bg-background pt-10">
        <div className="flex gap-0 md:gap-6 md:px-6 md:py-8">
          {/* Left Sidebar - Hidden on mobile */}
          <div className="hidden md:block">
            <AnalysisSidebar
              sections={SECTIONS}
              currentSection={currentSection}
              onSelectSection={(section) => {
                setCurrentSection(section as AnalysisSection);
                setPhaseInSection(1);
              }}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
            {/* Page Title */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                UPDRS Prediction
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {currentSection === "patient" && "Enter patient information"}
                {currentSection === "voice" &&
                  "Voice analysis - Record or upload"}
                {currentSection === "drawing" &&
                  "Drawing analysis - Upload spiral/wave drawing"}
                {currentSection === "walking" &&
                  "Walking video analysis - Upload gait video"}
                {currentSection === "results" &&
                  "Your UPDRS prediction results"}
              </p>
            </div>

            {/* Phase Indicator */}
            {currentSection !== "results" && (
              <PhaseIndicator
                section={currentSection}
                currentPhase={phaseInSection}
                totalPhases={
                  PHASE_STEPS[currentSection as keyof typeof PHASE_STEPS]
                }
              />
            )}

            {/* Form Content */}
            <Card className="mt-6 sm:mt-8 border border-border">
              <div className="p-4 sm:p-6 lg:p-8">{renderContent()}</div>
            </Card>

            {/* Navigation Buttons */}
            {currentSection !== "results" && (
              <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 mt-6 sm:mt-8">
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={isFirstStep}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Back</span>
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={isLastStep}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <span className="hidden sm:inline">
                    {currentSection === "walking" ? "View Results" : "Next"}
                  </span>
                  <span className="sm:hidden">
                    {currentSection === "walking" ? "Results" : "Next"}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {currentSection === "results" && (
              <div className="flex gap-3 mt-8">
                <Button variant="outline" className="flex-1">
                  Download Report
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                  Start New Analysis
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>{" "}

    <Footer />
    </>
  );
}
