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

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// API Secret auth: an HS256 JWT with iss = Secret ID, signed with "<Secret ID>||<Secret Key>".
async function signJwt(secretId: string, secretKey: string): Promise<string> {
  const encode = (value: unknown) => b64url(new TextEncoder().encode(JSON.stringify(value)));
  const input = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ iss: secretId, iat: Math.floor(Date.now() / 1000) })}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`${secretId}||${secretKey}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input)));
  return `${input}.${b64url(signature)}`;
}

const heymarket = defineProvider({
  name: "Heymarket",
  hosts: ["api.heymarket.com"],
  auth: {
    apiSecret: secrets({
      label: "API Secret (recommended)",
      fields: object({ secretId: string({ minLength: 1 }), secretKey: string({ minLength: 1 }) }),
    }),
    apiKey: secrets({
      label: "Legacy team API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const fields = account.fields as Record<string, string>;
    const bearer =
      account.method === "apiSecret" ? await signJwt(fields.secretId!, fields.secretKey!) : fields.token!;
    const response = await fetch("https://api.heymarket.com/v1/team", {
      signal,
      headers: { Authorization: `Bearer ${bearer}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;

// Re-signs the Authorization header of every request for an API Secret account, so a long-lived
// connection never sends an expired JWT.
function jwtFetch(base: Fetch, secretId: string, secretKey: string): Fetch {
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    headers.set("Authorization", `Bearer ${await signJwt(secretId, secretKey)}`);
    return base(input, { ...init, headers });
  }) as Fetch;
}

export default defineApp(
  { user: { accounts: { heymarket: heymarket.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.heymarket ?? [],
        (account) => {
          const fields = account.fields as Record<string, string>;
          const accountFetch =
            account.method === "apiSecret" ? jwtFetch(fetch, fields.secretId!, fields.secretKey!) : fetch;
          return withApprovals(
            liveOpenapiRouter({ ...options, cache, fetch: accountFetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Heymarket",
        description:
          "Business texting with Heymarket: send SMS, MMS and email, manage contacts, lists, conversations, inboxes, templates and tracked links.",
        icons,
      },
    ),
  }),
);
