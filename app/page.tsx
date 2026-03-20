import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, AudioWaveform, Brain } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">VoiceUPDRS</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-balance">
            Predict Motor UPDRS from Voice Samples
          </h1>
          <p className="mt-6 text-lg text-muted-foreground text-pretty">
            An AI-powered tool that analyzes voice recordings to predict motor
            UPDRS scores for Parkinson&apos;s disease patients. Fast,
            non-invasive, and accurate.
          </p>

          <div className="mt-10">
            <Button asChild size="lg" className="text-base px-8">
              <Link href="/predict">Start Prediction</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid gap-6 sm:grid-cols-3 max-w-4xl w-full">
          <Card>
            <CardContent className="pt-6">
              <AudioWaveform className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg">Voice Analysis</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload voice samples for instant biomarker extraction and
                analysis.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Brain className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg">ML Prediction</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Machine learning model trained on clinical data for accurate
                predictions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Activity className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg">UPDRS Score</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get predicted motor UPDRS values to help monitor disease
                progression.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
        <p>
          For research purposes only. Not a substitute for clinical diagnosis.
        </p>
      </footer>
    </div>
  );
}
