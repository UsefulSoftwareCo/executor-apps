import {
  accountRouter,
  boolean,
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

const gtmetrix = defineProvider({
  name: "GTmetrix",
  hosts: ["gtmetrix.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://gtmetrix.com/api/2.0/status", {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.token}:`)}` },
    });
    await decodeJson(
      response,
      object({
        data: object({
          attributes: object({
            account_type: string(),
            account_pro_analysis_options_access: boolean(),
            account_pro_locations_access: boolean(),
            account_whitelabel_pdf_access: boolean(),
          }),
        }),
      }),
    );
  },
});

export default defineApp(
  { user: { accounts: { gtmetrix: gtmetrix.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gtmetrix ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "GTmetrix",
        description: "Test and monitor website speed with GTmetrix: tests, reports, pages, tags, performance alerts, locations and browsers.",
        icons,
      },
    ),
  }),
);
