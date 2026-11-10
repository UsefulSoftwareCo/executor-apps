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

const u301 = defineProvider({
  name: "U301",
  hosts: ["api.u301.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.u301.com/v2/shorten-domains", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { u301: u301.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.u301 ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            // GET /shorten creates a short link, so it is gated like a mutation.
            tool.kind === "mutation" || name === "shorten.getShorten" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "U301",
        description: "Shorten links, delete them, list available domains and create QR codes with U301.",
        icons,
      },
    ),
  }),
);
