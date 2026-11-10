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

const avoma = defineProvider({
  name: "Avoma",
  hosts: ["api.avoma.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Read-only check on GET /v1/users/ (in the spec). The 200 body
  // is typed as a bare array while sibling list endpoints are paginated objects, so no body shape
  // is decoded; only the status is checked.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.avoma.com/v1/users/", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Avoma rejected the API key (${response.status})`);
    }
    if (!response.ok) throw new Error(`Avoma health check failed (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { avoma: avoma.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.avoma ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Avoma",
        description: "Avoma AI meeting assistant: meetings, recordings, transcriptions, notes, insights, scorecards, calls, categories and templates.",
        icons,
      },
    ),
  }),
);
