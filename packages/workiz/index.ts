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

const workiz = defineProvider({
  name: "Workiz",
  hosts: ["api.workiz.com"],
  // Workiz v1 has no OAuth. The Developer API add-on issues an API token and an API secret.
  auth: {
    apiKey: secrets({
      label: "API token and secret",
      fields: object({
        token: string({ minLength: 1 }),
        secret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`https://api.workiz.com/api/v1/${encodeURIComponent(account.fields.token)}/team/all/`, {
      signal,
    });
    await decodeJson(response, array(object({})));
  },
});

type Fetch = typeof fetch;

// POST bodies carry the API secret as auth_secret. Add it so callers never handle it.
function withSecret(base: Fetch, secret: string): Fetch {
  return async (input, init) => {
    if (init?.method?.toUpperCase() === "POST" && typeof init.body === "string") {
      try {
        const body = JSON.parse(init.body) as unknown;
        if (body !== null && typeof body === "object" && !Array.isArray(body)) {
          return base(input, { ...init, body: JSON.stringify({ ...body, auth_secret: secret }) });
        }
      } catch {
        // Not JSON: send as is.
      }
    }
    return base(input, init);
  };
}

export default defineApp(
  { user: { accounts: { workiz: workiz.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.workiz ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              fetch: withSecret(fetch, account.fields.secret),
              signal,
              account,
              parameterDefaults: { path: { api_token: account.fields.token } },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Workiz",
        description: "Field service management in Workiz: jobs, leads, team members, time off and job payments.",
        instructions:
          "Jobs and leads are identified by UUID. List endpoints page with offset and records (up to 100). The API token and secret are supplied by the connected account; do not pass api_token or auth_secret.",
        icons,
      },
    ),
  }),
);
