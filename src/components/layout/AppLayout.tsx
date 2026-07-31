import type { ReactNode } from "react";
import { Header } from "./Header";
import { SidebarFilters } from "./SidebarFilters";
import { DashboardTabs } from "./DashboardTabs";
import { FiltersProvider } from "@/context/FiltersContext";
import { Toaster } from "@/components/ui/sonner";
import { HudBackground } from "@/components/fx/HudBackground";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <FiltersProvider>
      <div className="relative min-h-screen bg-background text-foreground">
        <HudBackground />
        <div className="relative z-10">
          <Header />
          <div className="flex flex-col lg:flex-row">
            <SidebarFilters />
            <div className="flex-1 min-w-0">
              <DashboardTabs />
              <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6">{children}</main>
            </div>
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </div>
    </FiltersProvider>
  );
}
