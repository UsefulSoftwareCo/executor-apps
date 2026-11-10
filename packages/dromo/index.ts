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
import { options, sessionsOptions } from "./openapi.js";

const dromo = defineProvider({
  name: "Dromo",
  hosts: ["app.dromo.io"],
  auth: {
    apiKey: secrets({
      label: "Backend license key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.dromo.io/api/v1/schemas/", {
      signal,
      headers: { "X-Dromo-License-Key": account.fields.token },
    });
    // The list response shape is not needed; a valid key answers 200, an invalid one 401/403.
    if (!response.ok) throw new Error(`Dromo rejected the license key (HTTP ${response.status}).`);
  },
});

export default defineApp(
  { user: { accounts: { dromo: dromo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dromo ?? [],
        (account) => {
          const mount = (o: typeof options | typeof sessionsOptions) =>
            withApprovals(liveOpenapiRouter({ ...o, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router({ api: mount(options), sessions: mount(sessionsOptions) }, { title: "Dromo", description: "Dromo account." });
        },
        { signal },
      ),
      {
        title: "Dromo",
        description:
          "Dromo spreadsheet importer. api: saved import schemas, uploads, headless imports, SFTP credentials and connectors. sessions: partial-import sessions for the embedded widget.",
        icons,
      },
    ),
  }),
);
