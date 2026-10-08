import { ThemeToggle } from "@/components/theme-toggle";

export default function AnalysisLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background dark:bg-[#0a0d14]">
      <div className="fixed top-3.5 right-4 z-50 lg:top-4">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}