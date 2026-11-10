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

const drata = defineProvider({
  name: "Drata",
  hosts: ["public-api.drata.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Scoped keys may lack access to any one resource, so a 403 still proves the key is valid.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://public-api.drata.com/public/v2/users?size=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    if (response.status === 403) return;
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { drata: drata.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.drata ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Drata",
        description: "Drata compliance automation: users, personnel, devices, assets, controls, policies, risks, vendors, evidence and custom connections.",
        icons,
      },
    ),
  }),
);
