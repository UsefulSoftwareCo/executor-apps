import { defineApp, router } from "apps";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// Public API: it answers without credentials, so no account is declared.
export default defineApp({ user: { accounts: {} }, icons }, async ({ cache, fetch, signal }) => ({
  tools: router(liveOpenapiRouter({ ...options, cache, fetch, signal }), {
    title: "Epic Games",
    description:
      "Fortnite Data API: public Fortnite islands, engagement metrics (plays, players, peak CCU, retention), rankings and genres.",
    icons,
    instructions:
      "Metrics cover the last 7 days only. A null value means the island had fewer than 5 unique players in that interval. Island codes look like 1234-5678-9012.",
  }),
}));
