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
import { options } from "./openapi.js";

const emaillistverify = defineProvider({
  name: "EmailListVerify",
  hosts: ["api.emaillistverify.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.emaillistverify.com/api/credits", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({ onDemand: object({ available: number() }) }));
  },
});

export default defineApp(
  { user: { accounts: { emaillistverify: emaillistverify.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.emaillistverify ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "EmailListVerify",
        description:
          "Verify email addresses with EmailListVerify: single and bulk verification, contact finding, disposable and blacklist checks, inbox placement tests and credits.",
        icons,
      },
    ),
  }),
);
