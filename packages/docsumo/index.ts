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

const docsumo = defineProvider({
  name: "Docsumo",
  hosts: ["app.docsumo.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.docsumo.com/api/v1/eevee/apikey/limit/", {
      signal,
      headers: { apikey: account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { docsumo: docsumo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.docsumo ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              fetch,
              signal,
              account,
              // The spec declares the key as `apikey` on 14 operations and `x-api-key` on 2 (field PATCH, move);
              // `content-type` is a required header on usbs-analytics. Defaults bind by declared parameter name.
              parameterDefaults: {
                headers: {
                  apikey: String(account.fields.token),
                  "x-api-key": String(account.fields.token),
                  "content-type": "application/json",
                },
              },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Docsumo",
        description: "Docsumo document AI: upload documents, fetch extracted data, review and manage documents.",
        icons,
      },
    ),
  }),
);
