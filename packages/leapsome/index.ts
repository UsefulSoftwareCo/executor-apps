import {
  accountRouter,
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
import { contentOptions, scimOptions } from "./openapi.js";

const tokenUrl = "https://api.leapsome.com/v1/token";

type FetchLike = typeof globalThis.fetch;

// The Content API signs requests with a JWT that lasts a few hours and is minted from the API Secret
// (GET /v1/token?secret=...). Tools carry the secret as their bearer value; this wrapper swaps it for a
// current JWT on the way out and reuses it until shortly before it expires.
const tokens = new Map<string, { token: string; expiresAt: number }>();

async function accessToken(fetch: FetchLike, secret: string, signal: AbortSignal | undefined) {
  const cached = tokens.get(secret);
  if (cached && cached.expiresAt > Date.now()) return cached.token;
  const response = await fetch(`${tokenUrl}?secret=${encodeURIComponent(secret)}`, {
    signal,
    headers: { accept: "application/json" },
  });
  const body = await decodeJson(response, object({ token: string(), expiresIn: number() }));
  tokens.set(secret, { token: body.token, expiresAt: Date.now() + Math.max(body.expiresIn - 60, 0) * 1000 });
  return body.token;
}

function exchangingFetch(fetch: FetchLike, secret: string): FetchLike {
  return async (input, init) => {
    const request = new Request(input, init);
    if (request.headers.get("authorization") !== `Bearer ${secret}`) return fetch(request);
    const token = await accessToken(fetch, secret, request.signal);
    request.headers.set("authorization", `Bearer ${token}`);
    return fetch(request);
  };
}

const leapsome = defineProvider({
  name: "Leapsome",
  hosts: ["api.leapsome.com"],
  auth: {
    apiSecret: secrets({
      label: "API Secret (Content API)",
      fields: object({ secret: string({ minLength: 1 }) }),
    }),
    scimToken: secrets({
      label: "SCIM token (user provisioning)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    if (account.method === "scimToken") {
      const response = await fetch("https://api.leapsome.com/scim/v1/ServiceProviderConfig", {
        signal,
        headers: { Authorization: `Bearer ${account.fields.token}` },
      });
      await decodeJson(response, object({}));
      return;
    }
    await accessToken(fetch, account.fields.secret, signal);
  },
});

export default defineApp(
  { user: { accounts: { leapsome: leapsome.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.leapsome ?? [],
        (account) => {
          const approve = <T extends Parameters<typeof withApprovals>[0]>(r: T) =>
            withApprovals(r, (tool) => (tool.kind === "mutation" ? always() : undefined));
          const contentFetch =
            account.method === "apiSecret" ? exchangingFetch(fetch, account.fields.secret) : fetch;
          return router(
            {
              content: approve(liveOpenapiRouter({ ...contentOptions, cache, fetch: contentFetch, signal, account })),
              scim: approve(liveOpenapiRouter({ ...scimOptions, cache, fetch, signal, account })),
            },
            { title: "Leapsome", description: "Leapsome account." },
          );
        },
        { signal },
      ),
      {
        title: "Leapsome",
        description:
          "Leapsome people enablement. content: goals, reviews, employees, absences, feedback, payroll, time tracking and documents (API Secret). scim: user and group provisioning (SCIM token).",
        icons,
      },
    ),
  }),
);
