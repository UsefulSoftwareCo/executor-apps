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

const pave = defineProvider({
  name: "Pave",
  hosts: ["api.pave.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.pave.com/ping", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    if (!response.ok) throw new Error(`Pave ping failed with ${response.status}`);
  },
});

export default defineApp(
  { user: { accounts: { pave: pave.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pave ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Pave",
        description: "Pave compensation platform: merit cycles, cycle employees and exchange rates.",
        icons,
      },
    ),
  }),
);
