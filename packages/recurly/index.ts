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
import { euOptions, options } from "./openapi.js";

const fields = object({ token: string({ minLength: 1 }) });

const recurly = defineProvider({
  name: "Recurly",
  hosts: ["v3.recurly.com", "v3.eu.recurly.com"],
  auth: {
    apiKey: secrets({ label: "Private API key (US data center)", fields }),
    apiKeyEu: secrets({ label: "Private API key (EU data center)", fields }),
  },
  async health({ account, fetch, signal }) {
    const host = account.method === "apiKeyEu" ? "v3.eu.recurly.com" : "v3.recurly.com";
    const response = await fetch(`https://${host}/sites?limit=1`, {
      signal,
      headers: {
        Authorization: `Basic ${btoa(`${account.fields.token}:`)}`,
        Accept: "application/vnd.recurly.v2021-02-25+json",
      },
    });
    await decodeJson(response, object({}));
  },
});

// Every request must name the API version in its Accept header.
const versioned =
  (base: typeof globalThis.fetch): typeof globalThis.fetch =>
  (input, init) => {
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    headers.set("Accept", "application/vnd.recurly.v2021-02-25+json");
    return base(input, { ...init, headers });
  };

export default defineApp(
  { user: { accounts: { recurly: recurly.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.recurly ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...(account.method === "apiKeyEu" ? euOptions : options),
              cache,
              fetch: versioned(fetch),
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Recurly",
        description: "Subscription billing with Recurly: accounts, plans, subscriptions, invoices, transactions, coupons and more.",
        icons,
      },
    ),
  }),
);
