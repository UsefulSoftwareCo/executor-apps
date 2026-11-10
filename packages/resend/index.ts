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

const resend = defineProvider({
  name: "Resend",
  hosts: ["api.resend.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // A sending-only key cannot list domains; Resend answers it with 401 restricted_api_key.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.resend.com/domains", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { resend: resend.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.resend ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Resend",
        description: "Send and manage email with Resend: emails, domains, audiences, contacts, broadcasts, templates and webhooks.",
        icons,
      },
    ),
  }),
);
