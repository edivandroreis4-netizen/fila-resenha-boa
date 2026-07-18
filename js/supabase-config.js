export const SUPABASE_CONFIG = {
  url: "https://khwrxmwylinaeifxvphe.supabase.co",
  publishableKey: "sb_publishable_CUFst8_b3bYF1C5GC7aKew_k7cc6eOT",
  barbershopId: "11111111-1111-4111-8111-111111111111"
};

export function hasSupabaseConfig() {
  return Boolean(
    SUPABASE_CONFIG.url &&
    SUPABASE_CONFIG.publishableKey &&
    !SUPABASE_CONFIG.url.includes("COLE_AQUI") &&
    !SUPABASE_CONFIG.publishableKey.includes("COLE_AQUI")
  );
}
