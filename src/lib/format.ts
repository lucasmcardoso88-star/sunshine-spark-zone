export const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export const BRL2 = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const formatBRL = (n: number | null | undefined, decimals = false) =>
  n == null ? "—" : (decimals ? BRL2 : BRL).format(n);

export const formatPercent = (n: number | null | undefined, digits = 1) =>
  n == null ? "—" : `${(n * 100).toFixed(digits).replace(".", ",")}%`;

export const formatVariation = (n: number | null | undefined, digits = 1) => {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${(n * 100).toFixed(digits).replace(".", ",")}%`;
};

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
};

export const MONTHS_PT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];
/** Tailwind class for accounting values: negatives always red. */
export const signClass = (n: number | null | undefined) =>
  n == null ? "text-muted-foreground" : n < 0 ? "text-rose-500" : "text-emerald-500";

/** Same rule but keeps neutral (foreground) color for positives. */
export const negativeClass = (n: number | null | undefined) =>
  n != null && n < 0 ? "text-rose-500" : "";
