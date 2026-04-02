"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Brain } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-8 py-2 rounded-full bg-card/80 border border-border backdrop-blur-xl shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-sidebar-foreground">
            NeroTrack
          </span>
          <span className="text-xl font-bold text-cyan-500">AI</span>
        </Link>

        {/* <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
          <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
        </div> */}

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/analysis"
            className="px-5 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-all duration-300 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </motion.header>
  );
}