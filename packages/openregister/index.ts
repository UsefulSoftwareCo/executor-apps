import {
  accountRouter,
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

const openregister = defineProvider({
  name: "OpenRegister",
  hosts: ["api.openregister.de"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.openregister.de/v1/credits", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(
      response,
      object({
        used_credits: number(),
        included_credits: number(),
        remaining_credits: number(),
        overage_credits: number(),
      }),
    );
  },
});

export default defineApp(
  { user: { accounts: { openregister: openregister.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.openregister ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "OpenRegister",
        description: "German company register data: company search, owners, UBO, financials, documents, insolvency, persons and monitoring.",
        icons,
      },
    ),
  }),
);
