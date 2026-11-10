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

const shortmenu = defineProvider({
  name: "Short Menu",
  hosts: ["api.shortmenu.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The API has no read endpoint, so delete a link that cannot exist: a bad key answers 401, a good one 404.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.shortmenu.com/links/00000000-0000-0000-0000-000000000000", {
      method: "DELETE",
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Short Menu rejected the API key (${response.status})`);
    }
  },
});

export default defineApp(
  { user: { accounts: { shortmenu: shortmenu.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.shortmenu ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Short Menu",
        description: "Create, update and delete Short Menu short links.",
        icons,
      },
    ),
  }),
);
