"use client";

import { motion } from "framer-motion";
import { Speech, SquarePen, Video, Brain, Shield, Zap } from "lucide-react";

const features = [
  { icon: Speech, title: "Voice Analysis", description: "Upload voice samples for instant biomarker extraction and analysis of speech patterns.", gradient: "from-primary to-accent" },
  { icon: SquarePen, title: "Drawing Analysis", description: "Upload spiral or wave drawings to assess fine motor control and tremor severity.", gradient: "from-accent to-teal-500" },
  { icon: Video, title: "Walking Analysis", description: "Upload gait video to analyze walking patterns and movement disorders.", gradient: "from-teal-500 to-emerald-500" },
];

const benefits = [
  { icon: Brain, title: "AI-Powered Insights", description: "Advanced machine learning models trained on clinical data." },
  { icon: Shield, title: "Privacy First", description: "Your data is processed securely and never stored." },
  { icon: Zap, title: "Instant Results", description: "Get comprehensive analysis in seconds, not days." },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 bg-background">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[30rem] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-2 text-xs font-medium tracking-wide text-primary uppercase bg-primary/10 border border-primary/20 rounded-full mb-4">
            Analysis Modes
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Multi-Modal Assessment</h2>
          <p className="max-w-2xl mx-auto text-muted-foreground text-lg">
            Our platform analyzes multiple biomarkers to provide comprehensive neurological insights.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6 shadow-lg`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.02] dark:group-hover:opacity-[0.05] transition-opacity duration-500 -z-10`} />
            </motion.div>
          ))}
        </div>

        {/* <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="grid gap-8 md:grid-cols-3"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-start gap-4"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary border border-border">
                <benefit.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-foreground font-medium mb-1">{benefit.title}</h4>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div> */}
      </div>
    </section>
  );
}