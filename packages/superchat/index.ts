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

const superchat = defineProvider({
  name: "Superchat",
  hosts: ["api.superchat.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.superchat.com/v1.0/me", {
      signal,
      headers: { "X-API-KEY": account.fields.token },
    });
    await decodeJson(response, object({ user: object({ id: string() }), workspace: object({ name: string() }) }));
  },
});

export default defineApp(
  { user: { accounts: { superchat: superchat.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.superchat ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Superchat",
        description: "Send and manage WhatsApp, Instagram, Messenger, Telegram, SMS and email conversations with Superchat: messages, contacts, conversations, labels, templates, files, notes and webhooks.",
        icons,
      },
    ),
  }),
);
