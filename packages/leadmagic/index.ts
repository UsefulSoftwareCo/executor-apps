import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  number,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const leadmagic = defineProvider({
  name: "LeadMagic",
  hosts: ["api.leadmagic.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.leadmagic.io/v1/credits", {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    await decodeJson(response, object({ credits: number() }));
  },
});

export default defineApp(
  { user: { accounts: { leadmagic: leadmagic.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.leadmagic ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "LeadMagic",
        description: "B2B data enrichment with LeadMagic: email finding and validation, mobile numbers, profile and company enrichment, job and ad search, and credits.",
        icons,
      },
    ),
  }),
);
