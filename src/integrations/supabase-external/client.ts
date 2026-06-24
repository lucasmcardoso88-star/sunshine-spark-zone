// Client paralelo para um Supabase externo (separado do Lovable Cloud).
// Chave publicável — segura para o bundle do navegador.
import { createClient } from "@supabase/supabase-js";

const EXTERNAL_SUPABASE_URL = "https://naxuhmhkwejaggxjpmgx.supabase.co";
const EXTERNAL_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_G6l_P_wOoTSVDYMADxQqog_iMkgOjtD";

function createExternalFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    // sb_publishable_* não é um JWT — remover Authorization injetado pela lib
    if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

export const supabaseExternal = createClient(
  EXTERNAL_SUPABASE_URL,
  EXTERNAL_SUPABASE_PUBLISHABLE_KEY,
  {
    global: { fetch: createExternalFetch(EXTERNAL_SUPABASE_PUBLISHABLE_KEY) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  },
);

export const EXTERNAL_SUPABASE_URL_PUBLIC = EXTERNAL_SUPABASE_URL;
