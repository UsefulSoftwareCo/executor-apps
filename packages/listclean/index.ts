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

const listclean = defineProvider({
  name: "Listclean",
  hosts: ["api.listclean.xyz"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Single-address verification is a GET but spends credits, so it needs approval like mutations.
  // GET /credits is authenticated, read-only and costs nothing.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.listclean.xyz/v1/credits", {
      signal,
      headers: { "X-Auth-Token": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { listclean: listclean.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.listclean ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            tool.kind === "mutation" || name === "verifications.getVerifyEmail" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Listclean",
        description: "Verify email addresses and clean email lists with Listclean: single and batch verification, list uploads, downloads and credits.",
        icons,
      },
    ),
  }),
);
