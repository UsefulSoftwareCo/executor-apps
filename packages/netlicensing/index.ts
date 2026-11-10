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

const netlicensing = defineProvider({
  name: "NetLicensing",
  hosts: ["go.netlicensing.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Keys are sent as HTTP Basic with the username "apiKey". The vendor's security page says
  // unauthorized access returns 403 and gives no evidence that a valid restricted-role key is
  // denied this endpoint, so any non-2xx response (401 and 403 included) fails the check.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://go.netlicensing.io/core/v2/rest/utility/licenseTypes", {
      signal,
      headers: {
        Authorization: `Basic ${btoa(`apiKey:${account.fields.token}`)}`,
        Accept: "application/json",
      },
    });
    if (response.status === 401 || response.status === 403) throw new Error(`NetLicensing rejected the API key (${response.status})`);
    if (!response.ok) throw new Error(`NetLicensing health check failed (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { netlicensing: netlicensing.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.netlicensing ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              fetch,
              signal,
              account: { ...account, fields: { ...account.fields, username: "apiKey" } },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "NetLicensing",
        description:
          "Software licensing with NetLicensing: products, product modules, license templates, licensees, licenses, bundles, tokens, transactions and payment methods, plus licensee validation.",
        icons,
      },
    ),
  }),
);
