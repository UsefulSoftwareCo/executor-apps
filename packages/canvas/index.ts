import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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
import { options } from "./openapi.js";

const Profile = object({ id: number(), name: string() });

// Hosted Canvas lives at <school>.instructure.com.
const domainPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9-]+)*\.instructure\.com$/i;

// One place that validates the stored domain; every use (health and tool routing) goes through it.
function normalizeDomain(raw: string): string {
  const domain = raw.trim().toLowerCase();
  if (!domainPattern.test(domain))
    throw new Error("Enter your Canvas domain, for example myschool.instructure.com.");
  return domain;
}

const canvas = defineProvider({
  name: "Canvas",
  hosts: ["*.instructure.com"],
  auth: {
    // Canvas OAuth needs an institution-admin developer key and per-school endpoints, so only
    // access tokens (Account > Settings > New Access Token) are offered.
    token: secrets({
      label: "Access token",
      fields: object({
        domain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const domain = normalizeDomain(account.fields.domain);
    const response = await fetch(`https://${domain}/api/v1/users/self/profile`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, Profile);
    return { accountInfo: { externalId: `${domain}:${me.id}`, displayName: me.name } };
  },
});

export default defineApp(
  { user: { accounts: { canvas: canvas.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.canvas ?? [],
        (account) => {
          const origin = `https://${normalizeDomain(account.fields.domain)}`;
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/api`,
              cache,
              fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Canvas",
        description:
          "Courses, assignments, submissions, grades, enrollments, modules, discussions, files and the rest of the Canvas LMS REST API.",
        instructions:
          "Ids are Canvas ids; use `self` for the current user and `sis_course_id:<id>` style ids where Canvas allows them. List endpoints are paginated by Canvas and return the first page. Array query parameters are named with a trailing `[]`, such as `include[]`.",
        icons,
      },
    ),
  }),
);
