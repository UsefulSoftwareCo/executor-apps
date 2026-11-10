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

const orshot = defineProvider({
  name: "Orshot",
  hosts: ["api.orshot.com"],
  auth: {
    apiKey: secrets({
      label: "Workspace API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    oauth: oauth2({
      discover: "https://api.orshot.com",
      scopes: [
        "workspace:read",
        "workspace:templates:read",
        "workspace:templates:write",
        "render:generate",
        "offline_access",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.orshot.com/v1/me", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { orshot: orshot.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.orshot ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Orshot",
        description:
          "Generate images, PDFs and videos from Orshot templates; manage brand assets, approval flows, notifications and social publishing.",
        icons,
      },
    ),
  }),
);
