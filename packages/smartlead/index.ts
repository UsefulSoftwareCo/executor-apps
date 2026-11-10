import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const smartlead = defineProvider({
  name: "Smartlead",
  hosts: ["server.smartlead.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // Smartlead takes the key as a query parameter, so never log this URL.
    const url = new URL("https://server.smartlead.ai/api/v1/campaigns/");
    url.searchParams.set("api_key", account.fields.apiKey);
    const response = await fetch(url.toString(), { signal });
    // Smartlead's API reference documents GET /campaigns/ as a direct array of campaigns, each with an
    // integer id, although some of its SDK samples read `data.campaigns`. The reference is followed here.
    await decodeJson(response, array(object({ id: number() })));
  },
});

export default defineApp(
  { user: { accounts: { smartlead: smartlead.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.smartlead ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            // trackEmailOpen is a GET tracking pixel that records an email open, so it needs approval too.
            tool.kind === "mutation" || name.endsWith("trackEmailOpen") ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Smartlead",
        description:
          "Cold email outreach with Smartlead: campaigns, sequences, leads, email accounts and warmup, master inbox, analytics, webhooks, Smart Delivery and Smart Senders.",
        icons,
      },
    ),
  }),
);
