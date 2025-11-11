import Whop from "@whop/sdk";

const WHOP_API_KEY = process.env.WHOP_API_KEY;
const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET;

if (!WHOP_API_KEY) {
  console.warn("Missing WHOP_API_KEY environment variable");
}

if (!WHOP_WEBHOOK_SECRET) {
  console.warn("Missing WHOP_WEBHOOK_SECRET environment variable");
}

export const whopSdk = new Whop({
  apiKey: WHOP_API_KEY || "",
  // Whop SDK expects base64 encoded webhook secret
  webhookKey: WHOP_WEBHOOK_SECRET ? btoa(WHOP_WEBHOOK_SECRET) : undefined,
});
