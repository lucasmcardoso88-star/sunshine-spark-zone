const RELOAD_FLAG = "app:chunk-reload";

const CHUNK_ERROR_PATTERNS = [
  "dynamically imported module",
  "importing a module script failed",
  "chunkloaderror",
  "loading chunk",
  "loading css chunk",
  "failed to fetch dynamically",
  "unexpected token '<'",
];

export function isStaleAssetError(error: unknown): boolean {
  const message =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : "";
  const normalized = message.toLowerCase();
  return CHUNK_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern));
}

/**
 * A new deploy invalidates the previous asset hashes. A browser holding an old
 * document then fails to import a chunk and the app falls into the error page.
 * Reloading once (guarded by sessionStorage so we never loop) fetches the
 * current document and recovers transparently.
 */
export function recoverFromStaleAssets(error: unknown): boolean {
  if (typeof window === "undefined") return false;
  if (!isStaleAssetError(error)) return false;

  try {
    if (window.sessionStorage.getItem(RELOAD_FLAG)) return false;
    window.sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    // sessionStorage unavailable (private mode): still attempt a single reload.
  }

  window.location.reload();
  return true;
}

export function clearStaleAssetFlag() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    // ignore
  }
}

export function installStaleAssetRecovery() {
  if (typeof window === "undefined") return () => {};

  const onError = (event: ErrorEvent) => {
    recoverFromStaleAssets(event.error ?? event.message);
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    recoverFromStaleAssets(event.reason);
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
