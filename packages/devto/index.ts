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

// Forem API V1 requires the Accept header (documented). The User-Agent is not documented, but dev.to returns 403 without one.
const foremHeaders = { Accept: "application/vnd.forem.api-v1+json", "User-Agent": "executor.sh" };

const devto = defineProvider({
  name: "DEV Community",
  hosts: ["dev.to"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://dev.to/api/users/me", {
      signal,
      headers: { ...foremHeaders, "api-key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { devto: devto.many() } }, icons },
  async ({ user, cache, fetch, signal }) => {
    const foremFetch: typeof fetch = (input, init) => {
      const headers = new Headers(init?.headers);
      for (const [name, value] of Object.entries(foremHeaders)) headers.set(name, value);
      return fetch(input, { ...init, headers });
    };
    return {
      tools: router(
        await accountRouter(
          user?.accounts.devto ?? [],
          (account) =>
            withApprovals(
              liveOpenapiRouter({ ...options, cache, fetch: foremFetch, signal, account }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            ),
          { signal },
        ),
        {
          title: "DEV Community",
          description:
            "Publish and read on DEV Community (dev.to): articles, comments, reactions, tags, users, organizations, podcasts, analytics and moderation.",
          icons,
        },
      ),
    };
  },
);
