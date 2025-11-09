export const PLAN_MAP = {
  plan_rgupWHoVJKhDw: { name: "Yearly", interval: "yearly" },
  plan_g5wnacjwa6tp3: { name: "Lifetime", interval: "lifetime" },
  plan_AhTV9u0UD48Z0: { name: "Monthly", interval: "monthly" },
} as const;

export type PlanInterval =
  (typeof PLAN_MAP)[keyof typeof PLAN_MAP]["interval"];

export function getPlanForProduct(
  productId: string | null | undefined,
) {
  if (!productId) return null;
  return PLAN_MAP[productId as keyof typeof PLAN_MAP] ?? null;
}

export const WHOP_USER_METADATA_KEY = "supabase_user_id";

/**
 * Adds the Supabase user id to a Whop checkout URL via metadata query param.
 * Works for hosted checkout links (metadata[n]=v format) and preserves other params.
 */
export function buildWhopCheckoutUrl(
  baseUrl: string,
  userId: string,
) {
  if (!baseUrl) {
    throw new Error("baseUrl is required to build Whop checkout URL");
  }
  if (!userId) {
    throw new Error("userId is required to build Whop checkout URL");
  }

  const url = new URL(baseUrl);
  url.searchParams.set(`metadata[${WHOP_USER_METADATA_KEY}]`, userId);
  return url.toString();
}
