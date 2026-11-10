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

const lob = defineProvider({
  name: "Lob",
  hosts: ["api.lob.com"],
  auth: {
    apiKey: secrets({
      label: "Secret API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.lob.com/v1/addresses?limit=1", {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.token}:`)}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { lob: lob.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.lob ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Lob",
        description: "Send direct mail and verify addresses with Lob: postcards, letters, checks, self mailers, campaigns, addresses, verifications and webhooks.",
        icons,
      },
    ),
  }),
);
