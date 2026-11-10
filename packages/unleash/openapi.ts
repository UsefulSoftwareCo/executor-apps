import type { OpenapiToolNamesOptions } from "apps/openapi";

// Unleash is self-hosted or runs on Unleash's hosted cloud, so every account has its own origin.
// The vendor publishes the Admin API document at a stable URL; index.ts points baseUrl at the instance.
export const siteUrl = (url: string) => {
  let parsed: URL;
  try {
    parsed = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`);
  } catch {
    throw new Error("Enter your Unleash URL, for example https://us.app.unleash-hosted.com/hosted-name.");
  }
  if (parsed.protocol !== "https:")
    throw new Error("The Unleash URL must use https:// so the token is not sent in plaintext.");
  if (parsed.search !== "" || parsed.hash !== "" || parsed.username !== "" || parsed.password !== "")
    throw new Error("Enter only the Unleash base URL, without credentials, query or fragment.");
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`;
};

// The published document also covers unauthenticated and SDK/Edge-facing operations (password reset,
// invite signup, login, health, client metrics, Edge token issuing, signal endpoints). They are not
// admin-token operations, so they are removed to keep them away from an agent holding an admin token.
const nonAdminPaths = [
  "/auth/simple/login",
  "/auth/reset/validate",
  "/auth/reset/password",
  "/auth/reset/validate-password",
  "/auth/reset/password-email",
  "/invite/{token}/validate",
  "/invite/{token}/signup",
  "/health",
  "/ready",
  "/api/client/delta",
  "/api/client/streaming",
  "/api/client/metrics/bulk",
  "/api/client/metrics/edge",
  "/api/client/edge-licensing/heartbeat",
  "/api/signal-endpoint/{name}",
  "/edge/validate",
  "/edge/issue-token",
];

export const unleashOptions = (url: string) =>
  ({
    source: { url: "https://docs.getunleash.io/openapi/admin-api.json" },
    allowedOrigin: new URL(siteUrl(url)).origin,
    baseUrl: siteUrl(url),
    securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "Authorization" } },
    methods: { token: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
    oauth: [],
    patches: nonAdminPaths.map((path) => ({
      op: "remove" as const,
      path: `/paths/${path.replaceAll("~", "~0").replaceAll("/", "~1")}`,
    })),
  }) satisfies OpenapiToolNamesOptions;

export const options = unleashOptions("https://app.unleash-instance.example.com");
