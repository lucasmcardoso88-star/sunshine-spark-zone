// Edge function placeholder — no external integration yet.
// In a future step this function will perform the Conta Azul OAuth token
// exchange and pull financial transactions into the `financial_transactions_raw`
// + `financial_transactions` tables. Tokens MUST NEVER be returned to the client.

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
        "access-control-allow-methods": "POST, OPTIONS",
      },
    });
  }

  const mockedLog = {
    timestamp: new Date().toISOString(),
    action: "sync-conta-azul-placeholder",
    status: "no-op",
    message: "Integração real será implementada no próximo passo",
  };
  console.log("[sync-conta-azul-placeholder]", mockedLog);

  return new Response(
    JSON.stringify({
      ok: true,
      message: "Integração real será implementada no próximo passo",
      log: mockedLog,
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      },
    },
  );
});