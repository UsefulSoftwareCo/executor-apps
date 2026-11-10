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

const emailvalidation = defineProvider({
  name: "Emailvalidation",
  hosts: ["api.emailvalidation.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /v1/status returns the quota and does not consume a validation.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.emailvalidation.io/v1/status", {
      signal,
      headers: { apikey: account.fields.token },
    });
    if (!response.ok) throw new Error(`Emailvalidation rejected the API key (${response.status})`);
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { emailvalidation: emailvalidation.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.emailvalidation ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Emailvalidation",
        description:
          "Validate email addresses for deliverability, run bulk list verification jobs and check quota with emailvalidation.io.",
        icons,
      },
    ),
  }),
);
