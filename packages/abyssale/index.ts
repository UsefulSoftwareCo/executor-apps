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

const abyssale = defineProvider({
  name: "Abyssale",
  hosts: ["api.abyssale.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /credits is workspace-key only: user-scoped keys (which pass POST /auth)
  // and plans without API access answer 401, so it proves the key drives the API.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.abyssale.com/credits", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    if (!response.ok) throw new Error(`Abyssale rejected the API key (${response.status})`);
    await decodeJson(response, object({ generation_credits: object({}), ai_credits: object({}) }));
  },
});

export default defineApp(
  { user: { accounts: { abyssale: abyssale.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.abyssale ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Abyssale",
        description:
          "Generate images, videos, GIFs, HTML5 banners and print PDFs with Abyssale: designs, projects, templates, imports, fonts and credits.",
        icons,
      },
    ),
  }),
);
