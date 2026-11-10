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

const tailscale = defineProvider({
  name: "Tailscale",
  hosts: ["api.tailscale.com"],
  auth: {
    apiKey: secrets({
      label: "API access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Trust credential (OAuth client) created in the admin console; client_id + client_secret exchanged for a 1 hour token.
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://api.tailscale.com/api/v2/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  // "-" addresses the tailnet that owns the token.
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.tailscale.com/api/v2/tailnet/-/devices", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { tailscale: tailscale.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.tailscale ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Tailscale",
        description: "Manage a Tailscale tailnet: devices, users, keys, ACL policy file, DNS, settings, webhooks and logs.",
        instructions: "Use \"-\" as the tailnet path parameter to address the tailnet that owns the access token.",
        icons,
      },
    ),
  }),
);
