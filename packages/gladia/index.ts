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

const gladia = defineProvider({
  name: "Gladia",
  hosts: ["api.gladia.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.gladia.io/v2/pre-recorded?limit=1", {
      signal,
      headers: { "x-gladia-key": account.fields.token },
    });
    if (!response.ok) throw new Error(`Gladia rejected the API key (${response.status})`);
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { gladia: gladia.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gladia ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Gladia",
        description: "Speech-to-text with Gladia: upload audio, run pre-recorded and live transcriptions, and fetch or delete results.",
        icons,
      },
    ),
  }),
);
