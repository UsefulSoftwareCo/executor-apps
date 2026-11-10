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

const bluebarry = defineProvider({
  name: "Bluebarry",
  hosts: ["data.bluebarry.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Any 2xx on a one-row read proves the key; the body is OData and is not decoded.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://data.bluebarry.ai/data/AdvisorLinks?$top=1", {
      signal,
      headers: { Authorization: account.fields.token },
    });
    if (!response.ok) throw new Error(`Bluebarry rejected the API key (HTTP ${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { bluebarry: bluebarry.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bluebarry ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Bluebarry",
        description: "Bluebarry product advisors and shopper data: advisors, questions, profiles, identities, products, events and integrations.",
        icons,
      },
    ),
  }),
);
