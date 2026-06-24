import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock3,
  RefreshCw,
  Settings,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useFilters } from "@/context/FiltersContext";
import { COMPANY_OPTIONS, type CompanyId } from "@/data/mock";
import { toast } from "sonner";

export function Header() {
  const { company, setCompany } = useFilters();
  const lastUpdate = "22/jun/2026 13:00";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90">
      <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 lg:flex lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-foreground">Controladoria Agência</p>
            <p className="text-[11px] text-muted-foreground">Dashboard financeiro</p>
          </div>
        </div>

        <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-3 lg:col-span-1 lg:ml-5 lg:flex-nowrap">
          <span className="text-xs font-medium text-muted-foreground">Empresa</span>
          <Select value={company} onValueChange={(v) => setCompany(v as CompanyId)}>
            <SelectTrigger className="h-9 w-full min-w-0 sm:w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_OPTIONS.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="hidden items-center gap-2 xl:flex">
            <StatusBadge tone="positive">
              <CheckCircle2 className="h-3 w-3" /> Conta Azul conectada
            </StatusBadge>
            <StatusBadge tone="info">
              <Clock3 className="h-3 w-3" /> Sync {lastUpdate}
            </StatusBadge>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 lg:ml-auto">
          <div className="hidden text-right text-xs md:block xl:hidden">
            <p className="text-muted-foreground">Última atualização</p>
            <p className="font-medium text-foreground">{lastUpdate}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="min-h-9 gap-2 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() =>
              toast.info("Integração real com Conta Azul ainda não disponível", {
                description: "Esta etapa traz apenas a fundação visual e estrutural.",
              })
            }
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Sincronizar</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Abrir menu do usuário"
                className="h-10 w-10 rounded-full"
              >
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="bg-accent text-xs font-semibold text-primary-deep">
                    GA
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="leading-tight">
                  <p>Gestor financeiro</p>
                  <p className="text-xs font-normal text-muted-foreground">gestor@agencia.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="h-4 w-4" /> Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuItem>
                Políticas de Uso <ChevronDown className="ml-auto h-4 w-4 rotate-[-90deg]" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
