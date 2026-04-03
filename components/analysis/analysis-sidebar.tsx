"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Brain,
  Home,
  UserRound,
  Speech,
  Footprints,
  SquarePen,
  LayoutDashboard,
  FileText,
  ChartLine,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  completed?: boolean;
}

interface AnalysisSidebarProps {
  currentStep: string;
  completedSteps: string[];
  progress: { current: number; total: number };
}

export function AnalysisSidebar({
  currentStep,
  completedSteps,
  progress,
}: AnalysisSidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { id: "home", label: "Home", icon: Home, href: "/" },
    {
      id: "patient-info",
      label: "Patient Info",
      icon: UserRound,
      href: "/analysis",
      completed: completedSteps.includes("patient-info"),
    },
    {
      id: "voice",
      label: "Voice Analysis",
      icon: Speech,
      href: "/analysis/voice",
      completed: completedSteps.includes("voice"),
    },
    {
      id: "drawing",
      label: "Drawing Analysis",
      icon: SquarePen,
      href: "/analysis/drawing",
      completed: completedSteps.includes("drawing"),
    },
    {
      id: "gait",
      label: "Gait Analysis",
      icon: Footprints,
      href: "/analysis/gait",
      completed: completedSteps.includes("gait"),
    },
    {
      id: "results",
      label: "Results",
      icon: FileText,
      href: "/analysis/results",
    },
    {
      id: "progress",
      label: "Progress",
      icon: ChartLine,
      href: "/analysis/progress",
    },
  ];

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-br from-cyan-600 to-blue-600">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-semibold text-sidebar-foreground">
            NeuroTrack
          </span>
          <span className="text-xl font-bold text-cyan-500">AI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || currentStep === item.id;
            const Icon = item.icon;

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                    isActive
                      ? "border-l-2 border-cyan-500 bg-linear-to-r from-cyan-500/20 to-blue-600/10 text-sidebar-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>


    </aside>
  );
}
