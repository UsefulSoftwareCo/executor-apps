import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  number,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const joggai = defineProvider({
  name: "JoggAI",
  hosts: ["api.jogg.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.jogg.ai/v2/user/whoami", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    const body = await decodeJson(response, object({ code: number(), msg: string() }));
    if (body.code !== 0) throw new Error(`JoggAI health check failed: ${body.code} ${body.msg}`);
  },
});

export default defineApp(
  { user: { accounts: { joggai: joggai.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.joggai ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "JoggAI",
        description:
          "Create AI avatar, product, lip-sync, template and translated videos with JoggAI, and manage avatars, voices, assets and webhooks.",
        icons,
      },
    ),
  }),
);
