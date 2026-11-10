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

const ngrok = defineProvider({
  name: "ngrok",
  hosts: ["api.ngrok.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.ngrok.com/api_keys?limit=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "Ngrok-Version": "2" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { ngrok: ngrok.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ngrok ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, parameterDefaults: { headers: { "ngrok-version": "2" } }, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ngrok",
        description:
          "Manage ngrok with its cloud API: endpoints, tunnels, domains, reserved addresses, credentials, API keys, IP policies, traffic policies and more.",
        icons,
      },
    ),
  }),
);
