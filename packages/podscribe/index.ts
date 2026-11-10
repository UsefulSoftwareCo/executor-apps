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

const podscribe = defineProvider({
  name: "Podscribe",
  hosts: ["backend.podscribe.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Read-only search; an invalid key is answered with 403.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://backend.podscribe.ai/api/public/episode/search?search=a&timeFrame=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { podscribe: podscribe.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.podscribe ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Podscribe",
        description: "Podcast advertising verification and attribution with Podscribe: campaigns, impressions, conversions, reports, show and episode search, transcripts, rankers and advertiser management.",
        icons,
      },
    ),
  }),
);
