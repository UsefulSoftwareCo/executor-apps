import {
  accountRouter,
  decodeJson,
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
import { options } from "./openapi.js";

// Snipe-IT is self-hosted (assets.example.com) or hosted (acme.snipe-it.io). Credentials only go to the
// account's own origin.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Snipe-IT host, for example acme.snipe-it.io.");
  }
  if (url.protocol !== "https:") throw new Error("Snipe-IT must be reached over https.");
  if (url.pathname.replace(/\/+$/, "") !== "" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the Snipe-IT host, with no path.");
  return url.origin;
}

const snipeit = defineProvider({
  name: "Snipe-IT",
  auth: {
    // A personal API token created under Account > Manage API Keys. Snipe-IT's OAuth needs a
    // client registered on the instance by an admin, so only the token is offered.
    apiKey: secrets({
      label: "API token",
      fields: object({
        host: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.host);
    const response = await fetch(`${origin}/api/v1/users/me`, {
      signal,
      headers: { Accept: "application/json", Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: origin, displayName: new URL(origin).host } };
  },
});

export default defineApp(
  { user: { accounts: { snipeit: snipeit.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.snipeit ?? [],
        (account) => {
          const origin = originOf(account.fields.host);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: `${origin}/api/v1`, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Snipe-IT",
        description:
          "Manage IT assets in Snipe-IT: hardware, licenses, accessories, consumables, components, users, locations, categories and reports.",
        icons,
      },
    ),
  }),
);
