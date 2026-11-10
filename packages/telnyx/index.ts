import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
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

const telnyx = defineProvider({
  name: "Telnyx",
  hosts: ["api.telnyx.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Telnyx publishes RFC 8414 metadata (with dynamic client registration) at the API origin.
    oauth: oauth2({ discover: "https://api.telnyx.com" }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.telnyx.com/v2/balance", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { telnyx: telnyx.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.telnyx ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Telnyx",
        description: "Telnyx communications platform: voice, messaging, phone numbers, SIP, wireless, fax, verify, storage and AI.",
        icons,
      },
    ),
  }),
);
