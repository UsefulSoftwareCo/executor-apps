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

const rockgympro = defineProvider({
  name: "Rock Gym Pro",
  hosts: ["api.rockgympro.com"],
  auth: {
    apiKey: secrets({
      label: "API username and password",
      fields: object({ username: string({ minLength: 1 }), password: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.rockgympro.com/v1/ping", {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.username}:${account.fields.password}`)}` },
    });
    if (!response.ok) throw new Error(`Rock Gym Pro health check failed (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { rockgympro: rockgympro.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.rockgympro ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Rock Gym Pro",
        description:
          "Manage climbing gym data in Rock Gym Pro: facilities, customers, bookings, check-ins, invoices, sales, staff, time clocks and event widgets.",
        icons,
      },
    ),
  }),
);
