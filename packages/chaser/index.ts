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

const chaser = defineProvider({
  name: "Chaser",
  hosts: ["openapi.chaserhq.com"],
  auth: {
    apiKey: secrets({
      label: "API key and secret (Organisation settings > Integrations > Get API keys)",
      fields: object({ apiKey: string({ minLength: 1 }), apiSecret: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://openapi.chaserhq.com/v1/organisation", {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.apiKey}:${account.fields.apiSecret}`)}` },
    });
    if (!response.ok) throw new Error(`Chaser rejected the API key and secret (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { chaser: chaser.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.chaser ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Chaser",
        description: "Chaser accounts receivable automation: customers, invoices, credit notes, overpayments, contact persons, notes, chasing schedules, tasks and templates.",
        icons,
      },
    ),
  }),
);
