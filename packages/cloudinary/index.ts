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

const cloudinary = defineProvider({
  name: "Cloudinary",
  hosts: ["api.cloudinary.com"],
  auth: {
    apiKey: secrets({
      label: "Cloudinary API key and secret",
      fields: object({
        cloudName: string({ minLength: 1 }),
        apiKey: string({ minLength: 1 }),
        apiSecret: string({ minLength: 1 }),
      }),
    }),
    // Cloudinary lets users register OAuth apps (Console > Settings > Developers > OAuth Apps, beta).
    // The connect page asks for that app's client.
    oauth: oauth2({
      authorizationUrl: "https://oauth.cloudinary.com/oauth2/auth",
      tokenUrl: "https://oauth.cloudinary.com/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["asset_management", "upload", "offline_access"],
    }),
  },
  async health({ account, fetch, signal }) {
    // An OAuth token is cloud-specific but carries no cloud name, and the ping path needs one, so there is
    // nothing account-independent to check; the first tool call surfaces an invalid token.
    if (account.method === "oauth") return;
    const { cloudName, apiKey, apiSecret } = account.fields;
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/ping`, {
      signal,
      headers: { Authorization: `Basic ${btoa(`${apiKey}:${apiSecret}`)}` },
    });
    await decodeJson(response, object({ status: string() }));
  },
});

export default defineApp(
  { user: { accounts: { cloudinary: cloudinary.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cloudinary ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Cloudinary",
        description:
          "Manage Cloudinary media: upload, assets, folders, tags, transformations, upload presets, structured metadata and search.",
        icons,
      },
    ),
  }),
);
