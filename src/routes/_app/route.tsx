import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useLiveData } from "@/data/live-sync";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppShell,
  errorComponent: FilterErrorFallback,
});

function FilterErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  console.error("[app] render error", error);
  return (
    <div className="mx-auto max-w-md p-10 text-center">
      <h2 className="text-lg font-semibold">Não foi possível montar esta visão</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Um dos filtros gerou um resultado inesperado. Tente novamente ou ajuste os filtros.
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Tentar novamente
      </button>
    </div>
  );
}


function AppShell() {
  const version = useLiveData();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) {
        navigate({ to: "/login" });
      } else {
        setReady(true);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate({ to: "/login" });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  if (!ready) return <LoadingState />;

  return (
    <AppLayout>
      <div key={version} className="contents">
        <Outlet />
      </div>
    </AppLayout>
  );
}
