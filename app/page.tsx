import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  AudioLines,
  AudioWaveform,
  Brain,
  FileVideoCamera,
  Speech,
  SquarePen,
} from "lucide-react";
import Header from "@/components/landing/header";
import Footer from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-balance">
            Predict Parkinson&apos;s Severity with AI
          </h1>
          <p className="mt-6 text-lg text-muted-foreground text-pretty">
            An AI-powered tool that analyzes voice recordings to predict motor
            UPDRS scores for Parkinson's disease patients. Fast, non-invasive,
            and accurate.
          </p>

          <div className="mt-10">
            <Button asChild size="lg" className="text-base px-8">
              <Link href="/predict">Start Analysis</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid gap-6 sm:grid-cols-3 max-w-4xl w-full">
          <Card>
            <CardContent className="pt-6">
              <Speech className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg">Voice Analysis</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload voice samples for instant biomarker extraction and
                analysis.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <SquarePen className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg">Drawing Analysis</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload spiral or wave drawings to assess fine motor control and
                tremor severity.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <FileVideoCamera className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg">Walking Analysis</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload gait video to analyze walking patterns and movement
                disorders.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
