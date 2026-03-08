import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        className={cn(
          "min-h-screen transition-all duration-500 ease-in-out bg-slate-50/30",
          collapsed ? "ml-[80px]" : "ml-[280px]"
        )}
      >
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
