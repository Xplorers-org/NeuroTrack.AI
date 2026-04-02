"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Activity } from "lucide-react";

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function HeroSection() {
  return (
    <section className="relative flex items-center justify-center min-h-screen pt-5 overflow-hidden bg-background">
      {/* Background blobs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-120 h-120 bg-accent/8 dark:bg-accent/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-160 h-160 bg-primary/5 rounded-full blur-[100px]" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,var(--grid-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-color)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 max-w-5xl px-6 mx-auto text-center">
        {/* <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUpVariants}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-secondary border border-border mb-8 backdrop-blur-md"
        >
          <span className="flex w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            NeuroTrack - Clinical AI
          </span>

        </motion.div> */}
 {/* NeuroTrack&apos;s - Clinical AI */}

        <motion.h1 custom={1} initial="hidden" animate="visible" variants={fadeUpVariants}
          className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]"
        >
          Predict Parkinson&apos;s Severity  with{" "}
          <span className="bg-linear-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            AI Precision
          </span>
        </motion.h1>

        <motion.p custom={2} initial="hidden" animate="visible" variants={fadeUpVariants}
          className="max-w-2xl mx-auto mb-10 text-md font-light leading-relaxed text-muted-foreground md:text-xl"
        >
          AI-powered multimodal analysis of voice, gait, and handwriting, delivering precise insights into {" "}
          <span className="font-semibold text-primary">neurological health</span>{" "}
          and disease progression.
        </motion.p>

        <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUpVariants}
          className="flex flex-col items-center justify-center gap-6 sm:flex-row"
        >
          <Link
            href="/analysis"
            className="group relative flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-medium transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
          >
            <Activity className="w-5 h-5" />
            <span>Start Analysis</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/#features"
            className="w-full px-8 py-3 font-medium text-foreground transition-all duration-300 border rounded-full sm:w-auto bg-secondary hover:bg-secondary/80 border-border backdrop-blur-md"
          >
            Explore Features
          </Link>
        </motion.div>

        <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUpVariants}
          className="mt-8 text-sm text-muted-foreground"
        >
          {/* <p>No signup required. Start analyzing in seconds.</p> */}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute flex flex-col items-center pt-3 -translate-x-1/2 bottom-10 left-1/2 gap-1"
      >
        <span className="text-xs tracking-widest text-muted-foreground uppercase">Scroll to explore</span>
        <div className="w-px h-8 bg-linear-to-b from-muted-foreground to-transparent" />
      </motion.div>
    </section>
  );
}