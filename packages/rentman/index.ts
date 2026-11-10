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

const rentman = defineProvider({
  name: "Rentman",
  hosts: ["api.rentman.net"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Rentman has no current-user endpoint and token permissions follow the role of the user who
  // generated it, so no resource is guaranteed readable. A 401 means the token is invalid; a 403
  // means it authenticated but the role cannot read crew, which still proves the token works.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.rentman.net/crew?limit=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    if (response.status === 401) throw new Error("Rentman rejected the API token (401)");
    if (response.status === 403) return;
    if (!response.ok) throw new Error(`Rentman health check failed (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { rentman: rentman.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.rentman ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Rentman",
        description: "Plan and run equipment rental and crew projects with Rentman: projects, contacts, crew, equipment, planning, invoices and files.",
        icons,
      },
    ),
  }),
);
