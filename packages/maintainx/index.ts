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

const maintainx = defineProvider({
  name: "MaintainX",
  hosts: ["api.getmaintainx.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Assumption: GET /v1/organizations is exempt from the x-organization-id requirement for multi-org tokens (not confirmed against the vendor docs).
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.getmaintainx.com/v1/organizations?limit=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { maintainx: maintainx.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.maintainx ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "MaintainX",
        description: "Manage maintenance in MaintainX: work orders, assets, parts, meters, purchase orders, locations, teams and users.",
        icons,
      },
    ),
  }),
);
