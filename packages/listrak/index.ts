import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  oauth2,
  router,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { dataOptions, emailOptions, smsOptions } from "./openapi.js";

const listrak = defineProvider({
  name: "Listrak",
  hosts: ["api.listrak.com", "auth.listrak.com"],
  auth: {
    // Integration Management > API Keys in the Listrak platform. The client ID and secret are posted to the token endpoint.
    apiClient: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://auth.listrak.com/OAuth2/Token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.listrak.com/email/v1/List", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: "listrak", displayName: "Listrak" } };
  },
});

export default defineApp(
  { user: { accounts: { listrak: listrak.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.listrak ?? [],
        (account) => {
          const mount = (options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            { email: mount(emailOptions), sms: mount(smsOptions), data: mount(dataOptions) },
            { title: "Listrak", description: "Listrak Email, SMS and Data Import REST APIs." },
          );
        },
        { signal },
      ),
      {
        title: "Listrak",
        description:
          "Listrak retail marketing. email: lists, contacts, messages, segmentation, events and reports. sms: short codes, phone lists, contacts, broadcasts and transactional messages. data: customers, orders, products, reviews and rating summaries.",
        icons,
      },
    ),
  }),
);
