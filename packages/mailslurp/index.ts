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

const mailslurp = defineProvider({
  name: "MailSlurp",
  hosts: ["api.mailslurp.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.mailslurp.com/user/info", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({ id: string(), emailAddress: string() }));
  },
});

export default defineApp(
  { user: { accounts: { mailslurp: mailslurp.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mailslurp ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "MailSlurp",
        description:
          "Programmable email and SMS inboxes: create inboxes, send and receive email, wait for messages, webhooks, phone numbers and more.",
        icons,
      },
    ),
  }),
);
