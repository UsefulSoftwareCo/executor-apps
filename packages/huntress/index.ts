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

const huntress = defineProvider({
  name: "Huntress",
  hosts: ["api.huntress.io"],
  auth: {
    // Huntress uses HTTP Basic with the API key (hk_...) as username and the API secret (hs_...) as password.
    apiKey: secrets({
      label: "API key and secret",
      fields: object({ apiKey: string({ minLength: 1 }), apiSecret: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.huntress.io/v1/organizations?limit=1", {
      signal,
      headers: {
        Authorization: `Basic ${btoa(`${account.fields.apiKey}:${account.fields.apiSecret}`)}`,
        Accept: "application/json",
      },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { huntress: huntress.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.huntress ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Huntress",
        description:
          "Managed endpoint security in Huntress: accounts, organizations, agents, incident reports, remediations, signals, escalations, identities, external ports, reports and invoices.",
        icons,
      },
    ),
  }),
);
