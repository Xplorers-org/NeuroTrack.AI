"use client";

import Link from "next/link";
import { Brain } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative py-12 bg-background border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">NeuroTrack AI</span>
          </Link>

          {/* <div className="flex items-center gap-8">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link href="/analysis" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Analysis</Link>
          </div> */}

          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} NeuroTrack AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}