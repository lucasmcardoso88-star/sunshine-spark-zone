import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { COMPANY_OPTIONS, type AccountingBasis, type CompanyId } from "@/data/mock";

export type Quarter = 1 | 2 | 3 | 4 | "all";

export type PaymentStatusFilter = "all" | "paid" | "open";

export type FiltersState = {
  year: number;
  quarter: Quarter;
  month: number | "all"; // 1-12 or all
  basis: AccountingBasis;
  company: CompanyId;
  customStart: string;
  customEnd: string;
  costCenter: string;
  category: string;
  payment: PaymentStatusFilter;
};

type Ctx = FiltersState & {
  setYear: (y: number) => void;
  setQuarter: (q: Quarter) => void;
  setMonth: (m: number | "all") => void;
  setBasis: (b: AccountingBasis) => void;
  setCompany: (c: CompanyId) => void;
  setCustomStart: (date: string) => void;
  setCustomEnd: (date: string) => void;
  setCostCenter: (costCenter: string) => void;
  setCategory: (category: string) => void;
  setPayment: (p: PaymentStatusFilter) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  companyLabel: string;
};

const FiltersContext = createContext<Ctx | null>(null);

export const DEFAULT_FILTERS: FiltersState = {
  year: 2023,
  quarter: "all",
  month: "all",
  basis: "accrual",
  company: "all",
  customStart: "",
  customEnd: "",
  costCenter: "all",
  category: "all",
  payment: "all",
};

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [year, setYear] = useState<number>(DEFAULT_FILTERS.year);
  const [quarter, setQuarter] = useState<Quarter>(DEFAULT_FILTERS.quarter);
  const [month, setMonth] = useState<number | "all">(DEFAULT_FILTERS.month);
  const [basis, setBasis] = useState<AccountingBasis>(DEFAULT_FILTERS.basis);
  const [company, setCompany] = useState<CompanyId>(DEFAULT_FILTERS.company);
  const [customStart, setCustomStart] = useState(DEFAULT_FILTERS.customStart);
  const [customEnd, setCustomEnd] = useState(DEFAULT_FILTERS.customEnd);
  const [costCenter, setCostCenter] = useState(DEFAULT_FILTERS.costCenter);
  const [category, setCategory] = useState(DEFAULT_FILTERS.category);
  const [payment, setPayment] = useState<PaymentStatusFilter>(DEFAULT_FILTERS.payment);

  const resetFilters = () => {
    setYear(DEFAULT_FILTERS.year);
    setQuarter(DEFAULT_FILTERS.quarter);
    setMonth(DEFAULT_FILTERS.month);
    setBasis(DEFAULT_FILTERS.basis);
    setCompany(DEFAULT_FILTERS.company);
    setCustomStart(DEFAULT_FILTERS.customStart);
    setCustomEnd(DEFAULT_FILTERS.customEnd);
    setCostCenter(DEFAULT_FILTERS.costCenter);
    setCategory(DEFAULT_FILTERS.category);
    setPayment(DEFAULT_FILTERS.payment);
  };

  const activeFilterCount = [
    year !== DEFAULT_FILTERS.year,
    quarter !== DEFAULT_FILTERS.quarter,
    month !== DEFAULT_FILTERS.month,
    basis !== DEFAULT_FILTERS.basis,
    company !== DEFAULT_FILTERS.company,
    Boolean(customStart),
    Boolean(customEnd),
    costCenter !== DEFAULT_FILTERS.costCenter,
    category !== DEFAULT_FILTERS.category,
    payment !== DEFAULT_FILTERS.payment,
  ].filter(Boolean).length;

  const value = useMemo<Ctx>(
    () => ({
      year,
      quarter,
      month,
      basis,
      company,
      customStart,
      customEnd,
      costCenter,
      category,
      payment,
      setYear,
      setQuarter,
      setMonth,
      setBasis,
      setCompany,
      setCustomStart,
      setCustomEnd,
      setCostCenter,
      setCategory,
      setPayment,
      resetFilters,
      activeFilterCount,
      companyLabel: COMPANY_OPTIONS.find((c) => c.id === company)?.name ?? "Todas",
    }),
    [
      year,
      quarter,
      month,
      basis,
      company,
      customStart,
      customEnd,
      costCenter,
      category,
      payment,
      activeFilterCount,
    ],
  );

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used inside FiltersProvider");
  return ctx;
}

export function monthsForFilters(f: Pick<FiltersState, "quarter" | "month">): number[] {
  if (f.month !== "all") return [f.month - 1];
  if (f.quarter === "all") return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const start = (f.quarter - 1) * 3;
  return [start, start + 1, start + 2];
}
