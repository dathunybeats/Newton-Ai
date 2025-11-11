// Client-safe types and utilities for subscriptions
// This file contains NO server-only imports

export type PlanTier = "free" | "monthly" | "yearly" | "lifetime";

/**
 * Format plan name for display
 */
export function formatPlanName(tier: PlanTier): string {
  switch (tier) {
    case "free":
      return "Free Plan";
    case "monthly":
      return "Monthly Plan";
    case "yearly":
      return "Yearly Plan";
    case "lifetime":
      return "Lifetime Access";
  }
}

/**
 * Get upgrade message based on tier
 */
export function getUpgradeMessage(tier: PlanTier): string {
  if (tier === "free") {
    return "Upgrade to unlock unlimited notes, quizzes, and flashcards!";
  }
  return "You have unlimited access to all features!";
}
