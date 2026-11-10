import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options, optionsV1 } from "./openapi.js";

const jobdiva = defineProvider({
  name: "JobDiva",
  hosts: ["api.jobdiva.com"],
  auth: {
    apiUser: secrets({
      label: "API user",
      fields: object({
        clientId: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
    }),
  },
  // Signing in is the only credential check JobDiva offers; it answers 401 for a bad API user.
  async health({ account, fetch, signal }) {
    const response = await fetch(signInUrl(account.fields), { signal });
    if (response.status === 401 || response.status === 403)
      throw new Error("JobDiva refused the client ID, username or password. Use an API user, not a normal login.");
    if (!response.ok) throw new Error(`JobDiva sign-in failed with status ${response.status}.`);
    return { accountInfo: { externalId: `${account.fields.clientId}:${account.fields.username}`, username: account.fields.username } };
  },
});

// Version 1 signs in at /api/authenticate and Version 2 at /apiv2/authenticate; each gets its own token.
const signInUrl = (fields: { clientId: string; username: string; password: string }, version: "api" | "apiv2" = "apiv2") =>
  `https://api.jobdiva.com/${version}/authenticate?clientid=${encodeURIComponent(fields.clientId)}` +
  `&username=${encodeURIComponent(fields.username)}&password=${encodeURIComponent(fields.password)}`;

export default defineApp(
  { user: { accounts: { jobdiva: jobdiva.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.jobdiva ?? [],
        (account) => {
          const sessions = cache.forAccount(account);
          const mount = (version: "api" | "apiv2", spec: typeof options | typeof optionsV1) => {
            const key = version;
            const token = () =>
              sessions.get({
                key: ["token", key],
                schema: string(),
                freshFor: "1 hour",
                load: async ({ fetch, signal }) => {
                  const response = await fetch(signInUrl(account.fields, version), { signal });
                  if (!response.ok) throw new Error(`JobDiva sign-in failed with status ${response.status}.`);
                  const body = (await response.text()).trim().replace(/^"|"$/g, "");
                  if (body === "") throw new Error("JobDiva sign-in returned no token.");
                  return body;
                },
              });
            return withApprovals(
              liveOpenapiRouter({
                ...spec,
                cache,
                signal,
                account,
                fetch: async (input, init) => {
                  const headers = new Headers(init?.headers);
                  headers.set("authorization", `Bearer ${await token()}`);
                  const response = await fetch(input, { ...init, headers });
                  // An expired token signs in again on the next call.
                  if (response.status === 401) await sessions.invalidate(["token", key]);
                  return response;
                },
              }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            );
          };
          return router({ v2: mount("apiv2", options), v1: mount("api", optionsV1) });
        },
        { signal },
      ),
      {
        title: "JobDiva",
        description:
          "Staffing and recruiting with JobDiva: candidates, jobs, companies, contacts, activities, placements, timesheets and BI reports.",
        icons,
        instructions:
          "Version 2 tools live under v2.* and are the current API. Version 1 tools under v1.* cover operations Version 2 lacks (mostly /bi reports); prefer v2 when both have the operation.",
      },
    ),
  }),
);
