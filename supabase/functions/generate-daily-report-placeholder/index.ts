// Edge function placeholder — generates a daily-report JSON.
// In a future step this JSON will be consumed by the Claude Cowork agent to
// compose the daily controllership email. No external calls are made here.

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
        "access-control-allow-methods": "POST, GET, OPTIONS",
      },
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  const payload = {
    generated_at: new Date().toISOString(),
    period: { date: today },
    summary: {
      kpis: {
        gross_revenue: 268_400,
        net_revenue: 232_500,
        ebitda: 41_800,
        net_profit: 28_900,
        net_margin: 0.124,
        cash_balance: 184_300,
        accounts_receivable: 96_700,
        accounts_payable: 71_200,
      },
      open_alerts: [
        { title: "Receita abaixo da meta", severity: "high", impact: -42_000 },
        { title: "Caixa projetado negativo em 30 dias", severity: "critical", impact: -18_000 },
      ],
      relevant_deviations: [
        { category: "Mídia paga", planned: 35_000, realized: 41_300, delta_pct: 0.18 },
        { category: "Receita - Branding", planned: 45_000, realized: 34_300, delta_pct: -0.238 },
      ],
      recommendations: [
        "Reaquecer leads em estágio final do funil comercial.",
        "Auditar campanhas de mídia paga com CPA acima do alvo.",
        "Antecipar recebíveis para mitigar caixa projetado negativo.",
      ],
    },
    note:
      "Este payload é mockado. Em produção, será montado a partir de kpi_snapshots, alert_events e budget_targets.",
  };

  console.log("[generate-daily-report-placeholder] generated", today);

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    },
  });
});