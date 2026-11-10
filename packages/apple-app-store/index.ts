import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  plain,
  raw,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

type Fields = { issuerId: string; keyId: string; privateKey: string };

const appleAppStore = defineProvider({
  name: "Apple App Store",
  hosts: ["api.appstoreconnect.apple.com"],
  auth: {
    // Create a key at https://appstoreconnect.apple.com/access/integrations/api (Team Keys).
    // The .p8 file is downloadable once. Requests carry a JWT that this app signs (ES256).
    apiKey: secrets({
      label: "App Store Connect API key",
      fields: object({
        issuerId: plain(string({ minLength: 1 })),
        keyId: plain(string({ minLength: 1 })),
        privateKey: raw(string({ minLength: 1 })),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.appstoreconnect.apple.com/v1/apps?limit=1", {
      signal,
      headers: { Authorization: `Bearer ${await signToken(account.fields)}` },
    });
    if (!response.ok) throw new Error(`App Store Connect rejected the API key (HTTP ${response.status})`);
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: account.fields.issuerId, displayName: `Key ${account.fields.keyId}` } };
  },
});

const encoder = new TextEncoder();
const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const importKey = (pem: string) => {
  const body = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
};

// Apple allows tokens of up to 20 minutes.
async function signToken(fields: Fields): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(encoder.encode(JSON.stringify({ alg: "ES256", kid: fields.keyId, typ: "JWT" })));
  const payload = b64url(
    encoder.encode(JSON.stringify({ iss: fields.issuerId, iat: now, exp: now + 15 * 60, aud: "appstoreconnect-v1" })),
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      await importKey(fields.privateKey),
      encoder.encode(`${header}.${payload}`),
    ),
  );
  return `${header}.${payload}.${b64url(signature)}`;
}

export default defineApp(
  { user: { accounts: { appleAppStore: appleAppStore.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.appleAppStore ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              signal,
              account,
              fetch: async (input, init) => {
                const headers = new Headers(init?.headers);
                headers.set("authorization", `Bearer ${await signToken(account.fields)}`);
                return fetch(input, { ...init, headers });
              },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Apple App Store",
        description:
          "App Store Connect: apps, builds, TestFlight, app versions, customer reviews, in-app purchases, subscriptions, pricing, users and sales and analytics reports.",
        icons,
      },
    ),
  }),
);
