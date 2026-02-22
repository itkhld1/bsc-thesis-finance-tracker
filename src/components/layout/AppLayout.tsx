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
          "min-h-screen transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
