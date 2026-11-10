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

const anchorbrowser = defineProvider({
  name: "Anchor Browser",
  hosts: ["api.anchorbrowser.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.anchorbrowser.io/v1/sessions/all/status", {
      signal,
      headers: { "anchor-api-key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { anchorbrowser: anchorbrowser.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.anchorbrowser ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Anchor Browser",
        description:
          "Run cloud browsers for AI agents: sessions, mouse and keyboard control, web tasks, screenshots, identities, profiles and recordings.",
        icons,
      },
    ),
  }),
);
