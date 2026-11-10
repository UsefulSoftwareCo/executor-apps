import {
  accountRouter,
  array,
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

const lilt = defineProvider({
  name: "LILT",
  hosts: ["api.lilt.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /v2/memories without an id lists memories (getMemory, read-only) and needs a valid key.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.lilt.com/v2/memories", {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.token}:${account.fields.token}`)}` },
    });
    await decodeJson(response, array(object({})));
  },
});

export default defineApp(
  { user: { accounts: { lilt: lilt.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.lilt ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "LILT",
        description: "LILT translation and localization: machine translation, translation memories, projects, jobs, documents and files.",
        icons,
      },
    ),
  }),
);
