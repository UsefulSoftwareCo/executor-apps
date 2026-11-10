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

const mailcheck = defineProvider({
  name: "Mailcheck",
  hosts: ["api.mailcheck.co"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Lists batch operations (read-only, authenticated) to validate the key; reads no fields.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.mailcheck.co/v1/emails/operations?page_size=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { mailcheck: mailcheck.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mailcheck ?? [],
        (account) =>
          // Every POST spends verification credits, so mutations ask for approval.
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Mailcheck",
        description: "Verify email addresses with Mailcheck: single checks and batch operations with syntax, MX, SMTP, disposable and catch-all results and a trust rate.",
        icons,
      },
    ),
  }),
);
