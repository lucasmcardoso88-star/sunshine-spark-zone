import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useLiveData } from "@/data/live-sync";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

function AppShell() {
  const version = useLiveData();
  return (
    <AppLayout>
      <div key={version} className="contents">
        <Outlet />
      </div>
    </AppLayout>
  );
}
