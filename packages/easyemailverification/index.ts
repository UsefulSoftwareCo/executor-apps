import {
  accountRouter,
  boolean,
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
import { options } from "./openapi.js";

const easyemailverification = defineProvider({
  name: "Easy Email Verification",
  hosts: ["api.easyemailverification.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.easyemailverification.com/v1/credits", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({ success: boolean(), credits_remaining: number() }));
  },
});

export default defineApp(
  { user: { accounts: { easyemailverification: easyemailverification.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.easyemailverification ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Easy Email Verification",
        description:
          "Verify email addresses with Easy Email Verification: single checks, batches of up to 50, asynchronous bulk list jobs and credit balance.",
        icons,
      },
    ),
  }),
);
