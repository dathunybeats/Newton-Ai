import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PlanTier as PlanTierType } from "./types";

// Re-export client-safe types
export type { PlanTier } from "./types";
export { formatPlanName, getUpgradeMessage } from "./types";

export interface UserSubscription {
  id: string;
  user_id: string;
  whop_membership_id: string;
  product_id: string;
  plan_interval: "monthly" | "yearly" | "lifetime";
  status: string;
  period_start: string | null;
  period_end: string | null;
  cancel_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionStatus {
  tier: PlanTierType;
  isActive: boolean;
  subscription: UserSubscription | null;
  limits: {
    maxNotes: number;
    maxQuizzes: number;
    maxFlashcards: number;
    hasUnlimitedAccess: boolean;
  };
}

/**
 * Get plan tier from subscription interval
 */
function getPlanTier(subscription: UserSubscription | null): PlanTierType {
  if (!subscription || subscription.status !== "active") {
    return "free";
  }

  switch (subscription.plan_interval) {
    case "monthly":
      return "monthly";
    case "yearly":
      return "yearly";
    case "lifetime":
      return "lifetime";
    default:
      return "free";
  }
}

/**
 * Get limits based on plan tier
 */
function getLimitsForTier(tier: PlanTierType) {
  switch (tier) {
    case "free":
      return {
        maxNotes: 3,
        maxQuizzes: 3,
        maxFlashcards: 10,
        hasUnlimitedAccess: false,
      };
    case "monthly":
    case "yearly":
    case "lifetime":
      return {
        maxNotes: Infinity,
        maxQuizzes: Infinity,
        maxFlashcards: Infinity,
        hasUnlimitedAccess: true,
      };
  }
}

/**
 * Get active subscription for a user (using service role for API routes)
 */
export async function getUserSubscriptionAdmin(
  userId: string
): Promise<UserSubscription | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching subscription (admin):", error);
      return null;
    }

    return data as UserSubscription | null;
  } catch (error) {
    console.error("Error in getUserSubscriptionAdmin:", error);
    return null;
  }
}

/**
 * Get active subscription for a user (using user's session for client)
 */
export async function getUserSubscription(
  userId: string
): Promise<UserSubscription | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching subscription:", error);
      return null;
    }

    return data as UserSubscription | null;
  } catch (error) {
    console.error("Error in getUserSubscription:", error);
    return null;
  }
}

/**
 * Get complete subscription status for a user (admin version for API routes)
 */
export async function getSubscriptionStatusAdmin(
  userId: string
): Promise<SubscriptionStatus> {
  const subscription = await getUserSubscriptionAdmin(userId);
  const tier = getPlanTier(subscription);
  const limits = getLimitsForTier(tier);

  return {
    tier,
    isActive: subscription !== null && subscription.status === "active",
    subscription,
    limits,
  };
}

/**
 * Get complete subscription status for a user (client version)
 */
export async function getSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatus> {
  const subscription = await getUserSubscription(userId);
  const tier = getPlanTier(subscription);
  const limits = getLimitsForTier(tier);

  return {
    tier,
    isActive: subscription !== null && subscription.status === "active",
    subscription,
    limits,
  };
}

/**
 * Check if user has an active paid subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserSubscriptionAdmin(userId);
  return subscription !== null && subscription.status === "active";
}

/**
 * Check if user can create more notes
 */
export async function canCreateNote(userId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number;
  tier: PlanTierType;
}> {
  const status = await getSubscriptionStatusAdmin(userId);

  // Get current note count
  const { count, error } = await supabaseAdmin
    .from("notes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Error counting notes:", error);
    return {
      allowed: false,
      currentCount: 0,
      limit: status.limits.maxNotes,
      tier: status.tier,
    };
  }

  const currentCount = count || 0;
  const allowed = currentCount < status.limits.maxNotes;

  return {
    allowed,
    currentCount,
    limit: status.limits.maxNotes,
    tier: status.tier,
  };
}

/**
 * Check if user can generate quizzes
 */
export async function canGenerateQuiz(userId: string): Promise<{
  allowed: boolean;
  tier: PlanTierType;
}> {
  const status = await getSubscriptionStatusAdmin(userId);

  return {
    allowed: status.limits.hasUnlimitedAccess,
    tier: status.tier,
  };
}
