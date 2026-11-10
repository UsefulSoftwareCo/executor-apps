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

const clicksend = defineProvider({
  name: "ClickSend",
  hosts: ["rest.clicksend.com"],
  auth: {
    apiKey: secrets({
      label: "Username and API key",
      fields: object({ username: string({ minLength: 1 }), apiKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://rest.clicksend.com/v3/account", {
      signal,
      headers: {
        Authorization: `Basic ${btoa(`${account.fields.username}:${account.fields.apiKey}`)}`,
      },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { clicksend: clicksend.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.clicksend ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ClickSend",
        description:
          "Send SMS, MMS, email, voice, fax and post with ClickSend, and manage contacts, lists, campaigns and account settings.",
        icons,
      },
    ),
  }),
);
