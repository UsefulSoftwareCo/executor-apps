import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const jinko = defineProvider({
  name: "Jinko",
  hosts: ["api.gojinko.com"],
  auth: {
    apiKey: secrets({
      label: "API key (jnk_...)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Probe: GET /v1/trip/{id} with an unknown id. Per https://docs.gojinko.com/concepts/errors a missing, malformed or
  // expired key is 401 AUTH_REQUIRED; a valid key gets 404 NOT_FOUND for an unknown trip (or 200). A 403 FORBIDDEN means
  // the key is valid but lacks a scope, so it is not a rejected credential. Anything else (429, 5xx, ...) is unhealthy.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.gojinko.com/v1/trip/trip_health_probe", {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    if (response.status === 401) {
      throw new Error("Jinko rejected the API key (401 AUTH_REQUIRED)");
    }
    if (response.ok || response.status === 404 || response.status === 403) return;
    throw new Error(`Jinko health probe returned unexpected status ${response.status}`);
  },
});

export default defineApp(
  { user: { accounts: { jinko: jinko.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.jinko ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Jinko",
        description: "Search and book flights, hotels and rental cars with Jinko: trips, checkout, bookings, ancillaries and travel demand data.",
        icons,
      },
    ),
  }),
);
