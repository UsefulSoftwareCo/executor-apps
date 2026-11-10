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
import { v1Options, v2Options } from "./openapi.js";

const printful = defineProvider({
  name: "Printful",
  hosts: ["api.printful.com"],
  auth: {
    token: secrets({
      label: "Private token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.printful.com/oauth/scopes", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({ code: number() }));
    return { accountInfo: { externalId: "printful", displayName: "Printful" } };
  },
});

export default defineApp(
  { user: { accounts: { printful: printful.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.printful ?? [],
        (account) => {
          const mount = (options: typeof v1Options) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            { v1: mount(v1Options), v2: mount(v2Options) },
            { title: "Printful", description: "Printful API v1 and v2 beta." },
          );
        },
        { signal },
      ),
      {
        title: "Printful",
        description:
          "Printful print-on-demand. v1: orders, stores, catalog, sync products, files, shipping rates, mockup generator, webhooks, reports. v2 (beta): orders, catalog, shipping, mockups, warehouse products and approval sheets.",
        icons,
      },
    ),
  }),
);
