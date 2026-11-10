import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  jsonSchema,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { optionsFor, regionUrl } from "./openapi.js";

const description =
  "Email, calendar, contacts, Notetaker, Scheduler, connectors, webhooks and administration through the Nylas v3 API.";

const nylas = defineProvider({
  name: "Nylas",
  hosts: ["api.us.nylas.com", "api.eu.nylas.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        region: plain(jsonSchema({ type: "string", enum: ["us", "eu"] })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = regionUrl(account.fields.region);
    const response = await fetch(`${base}/v3/grants?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { nylas: nylas.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.nylas ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({ ...optionsFor(account.fields.region), cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Nylas",
        description,
        icons,
        instructions:
          "Most email, calendar and contact tools take a grant_id, the connected mailbox; list grants first to find it.",
      },
    ),
  }),
);
