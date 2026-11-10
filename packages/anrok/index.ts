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

const anrok = defineProvider({
  name: "Anrok",
  hosts: ["api.anrok.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.anrok.com/v1/seller/productTaxCategories/list", {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "Content-Type": "application/json" },
      body: "{}",
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { anrok: anrok.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.anrok ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Anrok",
        description: "Sales tax and VAT with Anrok: customers, exemption certificates, transactions, products, filings and tax ID validation.",
        icons,
      },
    ),
  }),
);
