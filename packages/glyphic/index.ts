import {
  accountRouter,
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

const glyphic = defineProvider({
  name: "Glyphic",
  hosts: ["api.glyphic.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.glyphic.ai/v1/test/ping", {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    if (!response.ok) throw new Error(`Glyphic ping failed with status ${response.status}`);
  },
});

export default defineApp(
  { user: { accounts: { glyphic: glyphic.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.glyphic ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Glyphic",
        description: "Glyphic (now Airspeed) sales call intelligence: calls, transcripts, snippets, call tags, playbooks and forecasting.",
        icons,
      },
    ),
  }),
);
