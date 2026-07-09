// Segundo Supabase externo — D61.
import { createClient } from "@supabase/supabase-js";

const D61_SUPABASE_URL = "https://ysxdfrjgjoahefkremmc.supabase.co";
const D61_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_qYYobn7_81O6dh4ayMS9bQ_R3biE0XL";

function createD61Fetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

export const supabaseD61 = createClient(
  D61_SUPABASE_URL,
  D61_SUPABASE_PUBLISHABLE_KEY,
  {
    global: { fetch: createD61Fetch(D61_SUPABASE_PUBLISHABLE_KEY) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  },
);

export const D61_SUPABASE_URL_PUBLIC = D61_SUPABASE_URL;
