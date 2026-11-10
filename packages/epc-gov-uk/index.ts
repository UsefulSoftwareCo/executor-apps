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

const epc = defineProvider({
  name: "Energy Performance Certificates (Gov.UK)",
  hosts: ["api.get-energy-performance-data.communities.gov.uk"],
  auth: {
    apiKey: secrets({
      label: "API bearer token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.get-energy-performance-data.communities.gov.uk/api/codes", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { epc: epc.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.epc ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Energy Performance Certificates (Gov.UK)",
        description:
          "Search and download England and Wales Energy Performance Certificates: domestic, non-domestic and display (DEC) certificates, recommendations, daily changes and bulk files.",
        icons,
      },
    ),
  }),
);
