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
import { bulkOptions, disposableOptions, validationOptions } from "./openapi.js";

const debounce = defineProvider({
  name: "DeBounce",
  hosts: ["api.debounce.io", "bulk.debounce.io", "disposable.debounce.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Balance is free and needs a valid private key (an invalid key gets HTTP 401, which
  // decodeJson rejects). The docs disagree on the balance type (string in prose, integer in
  // the OpenAPI) and the live API returns success as a string, so only the status is checked.
  async health({ account, fetch, signal }) {
    const url = new URL("https://api.debounce.io/v1/balance/");
    url.searchParams.set("api", account.fields.token);
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { debounce: debounce.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.debounce ?? [],
        (account) => {
          const mount = (options: typeof validationOptions | typeof bulkOptions | typeof disposableOptions) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            { validation: mount(validationOptions), bulk: mount(bulkOptions), disposable: mount(disposableOptions) },
            { title: "DeBounce", description: "DeBounce account." },
          );
        },
        { signal },
      ),
      {
        title: "DeBounce",
        description:
          "DeBounce email validation. validation: validate an address, reverse lookup, credit balance, usage history. bulk: upload a list by URL and check its status. disposable: check whether an email or domain is disposable.",
        icons,
      },
    ),
  }),
);
