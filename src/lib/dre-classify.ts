// Classificação de categorias para as linhas do DRE.
// Baseado nos planos de contas vindos do Conta Azul (ex.: "03.02.01. Simples Nacional").

const TAX_KEYWORDS = [
  "imposto",
  "tributo",
  "simples nacional",
  "iss",
  "icms",
  "pis",
  "cofins",
  "irpj",
  "csll",
  "das ",
  "taxa fiscaliza",
  "retencao",
  "retenção",
];

const COMMISSION_KEYWORDS = ["comiss"];

function normalize(category: string | null | undefined) {
  return (category ?? "").toLowerCase().trim();
}

/** Código do plano de contas, ex.: "03.02.01. Simples Nacional" -> "03.02" */
function groupCode(category: string) {
  const match = category.match(/^\s*(\d{2})\.(\d{2})/);
  return match ? `${match[1]}.${match[2]}` : null;
}

/** Impostos sobre a venda (grupo 03.02 ou palavras-chave fiscais). */
export function isTaxCategory(category: string | null | undefined) {
  const c = normalize(category);
  if (!c) return false;
  if (groupCode(c) === "03.02") return true;
  return TAX_KEYWORDS.some((k) => c.includes(k));
}

/** Comissões sobre a venda. */
export function isCommissionCategory(category: string | null | undefined) {
  const c = normalize(category);
  if (!c) return false;
  return COMMISSION_KEYWORDS.some((k) => c.includes(k));
}

/** Custos operacionais (CMV/CSP) versus despesas operacionais. */
export function isOperationalCostCategory(category: string | null | undefined) {
  const c = normalize(category);
  if (!c) return false;
  return (
    c.includes("custo") ||
    c.includes("operacional") ||
    c.includes("produto") ||
    c.includes("serviço") ||
    c.includes("servico")
  );
}

export type DreBucket = "taxes" | "commissions" | "operationalCosts" | "operationalExpenses";

export function classifyExpense(category: string | null | undefined): DreBucket {
  if (isTaxCategory(category)) return "taxes";
  if (isCommissionCategory(category)) return "commissions";
  if (isOperationalCostCategory(category)) return "operationalCosts";
  return "operationalExpenses";
}
