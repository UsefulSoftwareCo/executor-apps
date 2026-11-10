import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  record,
  router,
  type AppContext,
  type RouterDeclaration,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const BASE = "https://api.nextdns.io";

const nextdns = defineProvider({
  name: "NextDNS",
  hosts: ["api.nextdns.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${BASE}/profiles`, {
      signal,
      headers: { "X-Api-Key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const url = (path: string, params: Params = {}) => {
    const u = new URL(`${BASE}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      u.searchParams.set(key, String(value));
    }
    return u.toString();
  };
  const send = async (method: string, path: string, params: Params = {}, body?: unknown) => {
    const response = await fetcher(url(path, params), {
      method,
      signal,
      headers: {
        "X-Api-Key": token,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    // DELETE, PATCH and PUT answer 204 with an empty body.
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
  return {
    get: (path: string, params?: Params) => send("GET", path, params),
    post: (path: string, body: unknown) => send("POST", path, {}, body),
    put: (path: string, body: unknown) => send("PUT", path, {}, body),
    patch: (path: string, body: unknown) => send("PATCH", path, {}, body),
    del: (path: string) => send("DELETE", path),
  };
}

type Client = ReturnType<typeof client>;
type Group = RouterDeclaration<AppContext, AppContext>;

const profile = string({ minLength: 1 });
const P = (id: string) => `/profiles/${encodeURIComponent(id)}`;
const Body = record(json());

// A nested object resource (security, privacy, ...): read and partially update.
function objectResource(c: Client, path: string, label: string): Group {
  return router({
    get: query(
      { description: `Get a profile's ${label}.`, input: object({ profile }) },
      async (_ctx, { profile }) => c.get(`${P(profile)}/${path}`),
    ),
    update: mutation(
      {
        description: `Partially update a profile's ${label}. Send only the fields to change.`,
        input: object({ profile, changes: Body }),
        approval: always(),
      },
      async (_ctx, { profile, changes }) => c.patch(`${P(profile)}/${path}`, changes),
    ),
  });
}

// A nested array resource (denylist, blocklists, ...): list, add, replace, edit and remove entries.
function listResource(c: Client, path: string, label: string, example: string): Group {
  return router({
    list: query(
      { description: `List a profile's ${label}.`, input: object({ profile }) },
      async (_ctx, { profile }) => c.get(`${P(profile)}/${path}`),
    ),
    add: mutation(
      {
        description: `Add one entry to a profile's ${label}. entry example: ${example}`,
        input: object({ profile, entry: Body }),
        approval: always(),
      },
      async (_ctx, { profile, entry }) => c.post(`${P(profile)}/${path}`, entry),
    ),
    replace: mutation(
      {
        description: `Replace the whole ${label} list of a profile with the given entries. Existing entries not listed are removed.`,
        input: object({ profile, entries: array(Body) }),
        approval: always(),
      },
      async (_ctx, { profile, entries }) => c.put(`${P(profile)}/${path}`, entries),
    ),
    update: mutation(
      {
        description: `Update one entry in a profile's ${label}. id is the entry's identifier, for example a domain.`,
        input: object({ profile, id: string({ minLength: 1 }), changes: Body }),
        approval: always(),
      },
      async (_ctx, { profile, id, changes }) => c.patch(`${P(profile)}/${path}/${encodeURIComponent(id)}`, changes),
    ),
    remove: mutation(
      {
        description: `Remove one entry from a profile's ${label}. id is the entry's identifier.`,
        input: object({ profile, id: string({ minLength: 1 }) }),
        approval: always(),
      },
      async (_ctx, { profile, id }) => c.del(`${P(profile)}/${path}/${encodeURIComponent(id)}`),
    ),
  });
}

const Range = {
  from: string().optional(),
  to: string().optional(),
  limit: number().optional(),
  cursor: string().optional(),
  device: string().optional(),
};

function analyticsTool(c: Client, endpoint: string, description: string, extra: Params = {}): ReturnType<typeof query> {
  return query(
    {
      description: `${description} from and to accept ISO 8601 dates, Unix time or relative values such as -6h, -1d, now. limit is 1-500 (default 10); pass meta.pagination.cursor as cursor for the next page. device filters by device id (__UNIDENTIFIED__ for unidentified). series returns a time series; interval is in seconds.`,
      input: object({
        profile,
        ...Range,
        series: boolean().optional(),
        interval: string().optional(),
        alignment: string().optional(),
        timezone: string().optional(),
        partials: string().optional(),
        ...(extra as Record<string, never>),
      }),
    },
    async (_ctx, input) => {
      const { profile: id, series, ...params } = input as Params & { profile: string; series?: boolean };
      return c.get(`${P(id)}/analytics/${endpoint}${series ? ";series" : ""}`, params);
    },
  ) as ReturnType<typeof query>;
}

function build(c: Client): Group {
  return router(
    {
      profiles: router({
        list: query({ description: "List all profiles of the account with their ids and names.", input: object({}) }, async () =>
          c.get("/profiles"),
        ),
        get: query(
          {
            description: "Get a full profile: security, privacy, parental control, deny and allow lists, rewrites and settings.",
            input: object({ profile }),
          },
          async (_ctx, { profile }) => c.get(P(profile)),
        ),
        create: mutation(
          {
            description:
              "Create a profile. config is the profile JSON, for example { name: 'Home', security: { threatIntelligenceFeeds: true }, privacy: { blocklists: [{ id: 'nextdns-recommended' }] } }. Returns the new profile id.",
            input: object({ config: Body }),
            approval: always(),
          },
          async (_ctx, { config }) => c.post("/profiles", config),
        ),
        update: mutation(
          {
            description: "Partially update a profile. Send only the fields to change.",
            input: object({ profile, changes: Body }),
            approval: always(),
          },
          async (_ctx, { profile, changes }) => c.patch(P(profile), changes),
        ),
        delete: mutation(
          { description: "Delete a profile and its logs permanently.", input: object({ profile }), approval: always() },
          async (_ctx, { profile }) => c.del(P(profile)),
        ),
      }),
      security: router({
        settings: objectResource(c, "security", "security settings (threat feeds, AI threat detection, Google Safe Browsing, cryptojacking, DNS rebinding, IDN homographs, typosquatting, DGA, NRD, DDNS, parking, CSAM)"),
        tlds: listResource(c, "security/tlds", "blocked TLDs", "{ id: 'xyz' }"),
      }),
      privacy: router({
        settings: objectResource(c, "privacy", "privacy settings (disguised trackers, affiliate allowance)"),
        blocklists: listResource(c, "privacy/blocklists", "blocklists", "{ id: 'nextdns-recommended' }"),
        natives: listResource(c, "privacy/natives", "native tracking protections", "{ id: 'apple' }"),
      }),
      parentalControl: router({
        settings: objectResource(c, "parentalControl", "parental control settings (safe search, YouTube restricted mode, block bypass)"),
        services: listResource(c, "parentalControl/services", "blocked services", "{ id: 'tiktok', active: true }"),
        categories: listResource(c, "parentalControl/categories", "blocked categories", "{ id: 'gambling', active: true }"),
      }),
      denylist: listResource(c, "denylist", "denylist (always blocked domains)", "{ id: 'badwebsite.com', active: true }"),
      allowlist: listResource(c, "allowlist", "allowlist (always allowed domains)", "{ id: 'goodwebsite.com', active: true }"),
      rewrites: listResource(c, "rewrites", "DNS rewrites", "{ name: 'example.com', content: '1.2.3.4' }"),
      settings: router({
        all: objectResource(c, "settings", "settings"),
        logs: objectResource(c, "settings/logs", "logging settings (enabled, drop IP/domain, retention seconds, location)"),
        blockPage: objectResource(c, "settings/blockPage", "block page settings"),
        performance: objectResource(c, "settings/performance", "performance settings (ECS, cache boost, CNAME flattening)"),
        web3: objectResource(c, "settings/web3", "Web3 setting"),
      }),
      analytics: router(
        {
          status: analyticsTool(c, "status", "Query counts by status (default, blocked, allowed)."),
          domains: analyticsTool(c, "domains", "Top domains queried. Set root to true to group by root domain; status filters to default, blocked or allowed.", {
            status: string().optional(),
            root: boolean().optional(),
          }),
          reasons: analyticsTool(c, "reasons", "Why queries were blocked, by blocklist or feature."),
          ips: analyticsTool(c, "ips", "Top client IPs with network and geolocation."),
          devices: analyticsTool(c, "devices", "Query counts per device."),
          protocols: analyticsTool(c, "protocols", "Query counts by DNS protocol (UDP, TCP, DoH, DoT, DoQ)."),
          queryTypes: analyticsTool(c, "queryTypes", "Query counts by DNS record type."),
          ipVersions: analyticsTool(c, "ipVersions", "Query counts by IP version."),
          dnssec: analyticsTool(c, "dnssec", "Query counts by DNSSEC validation."),
          encryption: analyticsTool(c, "encryption", "Query counts by whether they were encrypted."),
          destinations: analyticsTool(c, "destinations", "Where queries go. type is countries or gafam.", { type: string().optional() }),
        },
        { description: "Aggregate DNS query analytics for a profile, optionally as time series." },
      ),
      logs: router({
        list: query(
          {
            description:
              "Query logs of a profile. status is default, error, blocked or allowed; search is a substring match; sort is asc or desc; limit is 10-1000 (default 100). raw=true returns all query types instead of deduplicated A, AAAA and HTTPS. Use meta.pagination.cursor as cursor for the next page.",
            input: object({
              profile,
              ...Range,
              sort: string().optional(),
              status: string().optional(),
              search: string().optional(),
              raw: boolean().optional(),
            }),
          },
          async (_ctx, { profile, raw, ...params }) => c.get(`${P(profile)}/logs`, { ...params, raw: raw === undefined ? undefined : raw ? 1 : 0 }),
        ),
        downloadUrl: query(
          {
            description: "Get a URL to download a profile's logs as a file.",
            input: object({ profile, from: string().optional(), to: string().optional() }),
          },
          async (_ctx, { profile, ...params }) => c.get(`${P(profile)}/logs/download`, { ...params, redirect: 0 }),
        ),
        clear: mutation(
          { description: "Permanently delete all logs of a profile.", input: object({ profile }), approval: always() },
          async (_ctx, { profile }) => c.del(`${P(profile)}/logs`),
        ),
      }),
    },
    {},
  );
}

export default defineApp(
  { user: { accounts: { nextdns: nextdns.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.nextdns ?? [], (account) => build(client(account.fields.token, fetch, signal)), { signal }),
      {
        title: "NextDNS",
        description:
          "Manage NextDNS profiles: security, privacy, parental control, allow and deny lists, rewrites, settings, analytics and query logs.",
        icons,
      },
    ),
  }),
);
