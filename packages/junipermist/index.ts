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
import { options } from "./openapi.js";

// The API hosts Mist documents for its cloud regions.
const regions = [
  "api.mist.com",
  "api.gc1.mist.com",
  "api.ac2.mist.com",
  "api.gc2.mist.com",
  "api.gc4.mist.com",
  "api.eu.mist.com",
  "api.gc3.mist.com",
  "api.ac6.mist.com",
  "api.gc6.mist.com",
  "api.ac5.mist.com",
  "api.gc5.mist.com",
  "api.gc7.mist.com",
];

function origin(account: { fields: { region: string } }) {
  const host = account.fields.region.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!regions.includes(host)) throw new Error(`Region must be one of: ${regions.join(", ")}.`);
  return `https://${host}`;
}


const mist = defineProvider({
  name: "Juniper Mist",
  hosts: regions,
  auth: {
    apiToken: secrets({
      label: "API host and API token",
      fields: object({
        region: plain(string({ minLength: 1 })),
        apiToken: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin(account)}/api/v1/self`, {
      signal,
      headers: { Authorization: `Token ${account.fields.apiToken}` },
    });
    // User tokens return a profile with an email; org tokens do not represent a user, so only
    // the status is checked and the region host is the account identity.
    if (!response.ok) throw new Error(`Mist /api/v1/self returned HTTP ${response.status}`);
    const host = origin(account).replace("https://", "");
    return { accountInfo: { externalId: host, username: host } };
  },
});

export default defineApp(
  { user: { accounts: { mist: mist.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mist ?? [],
        (account) => {
          const base = origin(account);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: base, baseUrl: base, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Juniper Mist",
        description:
          "Juniper Mist cloud-managed networking: organizations, sites, access points, switches, WAN edges, clients, WLANs, alarms, inventory and the rest of the Mist REST API.",
        icons,
      },
    ),
  }),
);
