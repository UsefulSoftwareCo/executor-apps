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

// TelTel sends SMS through two GET endpoints, which the framework classifies as queries.
const getSendTools = new Set(["smsOutbox.getSmsActionSendText", "smsInbox.getSmsActionSendInboxText"]);

const teltel = defineProvider({
  name: "TelTel",
  hosts: ["api.teltel.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.teltel.io/v2/account/balance", {
      signal,
      headers: { "X-API-KEY": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { teltel: teltel.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.teltel ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            tool.kind === "mutation" || getSendTools.has(name) ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "TelTel",
        description: "Voice and SMS with TelTel: calls, SMS and campaigns, autodialers, contacts, users, numbers and account balance.",
        icons,
      },
    ),
  }),
);
