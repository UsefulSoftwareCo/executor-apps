import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const tldv = defineProvider({
  name: "tl;dv",
  hosts: ["pasta.tldv.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // /v1alpha1/health is unauthenticated, so a one-item meeting list is used to test the key.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://pasta.tldv.io/v1alpha1/meetings?limit=1", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({ total: number(), results: array(object({})) }));
  },
});

export default defineApp(
  { user: { accounts: { tldv: tldv.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.tldv ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "tl;dv",
        description: "Read tl;dv meeting recordings: meetings, transcripts, notes, highlights and download links, plus importing and uploading recordings.",
        icons,
      },
    ),
  }),
);
