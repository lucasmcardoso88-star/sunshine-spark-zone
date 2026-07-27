import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  RefreshCw,
  Settings,
  User,
} from "lucide-react";
import somusLogo from "@/assets/somus-logo.png.asset.json";
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
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useFilters } from "@/context/FiltersContext";
import { COMPANY_OPTIONS, type CompanyId } from "@/data/mock";
import { toast } from "sonner";

export function Header() {
  const { company, setCompany } = useFilters();
  const lastUpdate = "22/jun/2026 13:00";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-6 py-4 lg:flex">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-black px-3">
            <img src={somusLogo.url} alt="SOMUS" className="h-6 w-auto object-contain" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-lg font-bold tracking-tight text-foreground">BPO Controladoria</p>
            <p className="text-xs text-muted-foreground font-medium">Enterprise Intelligence</p>
          </div>
        </div>

        <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-4 lg:col-span-1 lg:ml-12 lg:flex-nowrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Unidade</span>
            <Select value={company} onValueChange={(v) => setCompany(v as CompanyId)}>
              <SelectTrigger className="h-7 w-auto min-w-[140px] border-none bg-transparent p-0 text-sm font-normal text-foreground shadow-none focus:ring-0 normal-case">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                {COMPANY_OPTIONS.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-foreground focus:bg-accent focus:text-accent-foreground">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden items-center gap-3 xl:flex">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-emerald-500 uppercase">Live Sync</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 lg:ml-auto">
          <div className="hidden text-right xl:block">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Última Sincronização</p>
            <p className="text-xs font-bold text-foreground/80">{lastUpdate}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10 rounded-xl border-border bg-card px-4 text-xs font-bold text-foreground transition-all hover:bg-accent"
            onClick={() => toast.success("Sincronização iniciada...")}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Now
          </Button>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:bg-accent"
              >
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">
                    GA
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-card border-border text-foreground p-2">
              <DropdownMenuLabel className="px-3 py-4">
                <div className="leading-tight">
                  <p className="font-bold text-lg">Gestor Financeiro</p>
                  <p className="text-xs font-medium text-muted-foreground">gestor@agencia.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem className="rounded-lg py-3 focus:bg-accent cursor-pointer">
                <User className="mr-3 h-5 w-5 text-muted-foreground" /> Perfil Executivo
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg py-3 focus:bg-accent cursor-pointer">
                <Settings className="mr-3 h-5 w-5 text-muted-foreground" /> Preferências
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                className="rounded-lg py-3 focus:bg-accent text-rose-500 cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  handleSignOut();
                }}
              >
                <LogOut className="mr-3 h-5 w-5" /> Sair do Sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
