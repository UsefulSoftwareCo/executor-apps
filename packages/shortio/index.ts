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

const shortio = defineProvider({
  name: "Short.io",
  hosts: ["api.short.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Lists domains with a secret key (scoped to a team or domain); a bad key answers 401. Public keys only cover POST /links/public and are not expected to pass.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.short.io/api/domains", {
      signal,
      headers: { Authorization: account.fields.token },
    });
    if (!response.ok) throw new Error(`Short.io rejected the API key (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { shortio: shortio.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.shortio ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Short.io",
        description: "Create and manage Short.io branded short links, domains, tags, folders, QR codes, link bundles and geo targeting.",
        icons,
      },
    ),
  }),
);
