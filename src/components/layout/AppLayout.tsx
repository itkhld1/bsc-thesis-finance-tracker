import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background">
      <Sidebar />
      <main className="min-h-screen ml-[280px] transition-all duration-500 ease-in-out bg-slate-50/30">
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
