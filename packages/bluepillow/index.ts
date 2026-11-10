import {
  accountRouter,
  decodeJson,
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

const bluepillow = defineProvider({
  name: "Blue Pillow",
  hosts: ["api.b2a.bluepillow.com"],
  auth: {
    apiKey: secrets({
      label: "B2A API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // No authenticated GET exists; destination resolution is a read-only lookup that requires a valid key.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.b2a.bluepillow.com/v1/destinations/resolve", {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Rome" }),
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { bluepillow: bluepillow.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bluepillow ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Blue Pillow Hotels & Stays",
        description:
          "Hotel and stay search across 16+ booking sites: destinations, ranked stays, property details, live offer comparison, recommendations, validation and tracked booking links.",
        icons,
      },
    ),
  }),
);
