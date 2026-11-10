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

const suitedash = defineProvider({
  name: "SuiteDash",
  hosts: ["app.suitedash.com"],
  auth: {
    apiKey: secrets({
      label: "Secure API credentials",
      fields: object({ publicId: string({ minLength: 1 }), secretKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.suitedash.com/secure-api/contact/meta", {
      signal,
      headers: { "X-Public-ID": account.fields.publicId, "X-Secret-Key": account.fields.secretKey },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { suitedash: suitedash.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.suitedash ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SuiteDash",
        description: "Manage SuiteDash contacts, companies, projects and marketing audiences.",
        icons,
      },
    ),
  }),
);
