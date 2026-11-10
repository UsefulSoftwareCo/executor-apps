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

const supadata = defineProvider({
  name: "Supadata",
  hosts: ["api.supadata.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.supadata.ai/v1/me", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({ organizationId: string() }));
  },
});

export default defineApp(
  { user: { accounts: { supadata: supadata.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.supadata ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Supadata",
        description: "Video transcripts, metadata and AI extraction, YouTube data, and web scraping, mapping and crawling.",
        icons,
      },
    ),
  }),
);
