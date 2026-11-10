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

const lettr = defineProvider({
  name: "Lettr",
  hosts: ["app.lettr.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.lettr.com/api/auth/check", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ message: string() }));
  },
});

export default defineApp(
  { user: { accounts: { lettr: lettr.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.lettr ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Lettr",
        description:
          "Send and manage transactional email with Lettr: emails, domains, templates, webhooks, audience lists, contacts, topics, segments and campaigns.",
        icons,
      },
    ),
  }),
);
