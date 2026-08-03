import { Component, type ErrorInfo, type ReactNode } from "react";
import { useFilters } from "@/context/FiltersContext";

type Props = { children: ReactNode; resetKey: string };
type State = { error: Error | null };

class Boundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[content] render error", error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-md p-10 text-center">
          <h2 className="text-lg font-semibold">Não foi possível montar esta visão</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta combinação de filtros gerou um resultado inesperado. Ajuste os filtros ou tente
            novamente — o restante do sistema continua disponível.
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Isolates page content so a filter combination never takes the whole app down. */
export function ContentBoundary({ children }: { children: ReactNode }) {
  const f = useFilters();
  const resetKey = [
    f.year,
    f.quarter,
    f.month,
    f.basis,
    f.company,
    f.customStart,
    f.customEnd,
    f.costCenter,
    f.category,
    f.payment,
  ].join("|");

  return <Boundary resetKey={resetKey}>{children}</Boundary>;
}
