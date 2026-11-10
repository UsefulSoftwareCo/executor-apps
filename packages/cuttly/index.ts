import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const regularBase = "https://cutt.ly/api/api.php";
const teamBase = "https://cutt.ly/team/API/index.php";

const keyFields = object({ token: string({ minLength: 1 }) });

const regular = defineProvider({
  name: "Cutt.ly",
  hosts: ["cutt.ly"],
  auth: { apiKey: secrets({ label: "API key (Edit Account page)", fields: keyFields }) },
  // Stats of a link that does not exist is read-only; a bad key returns 401 and fails decoding.
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `${regularBase}?${new URLSearchParams({ key: account.fields.token, stats: "https://cutt.ly/executorhealthcheck" })}`,
      { signal },
    );
    await decodeJson(response, object({ stats: object({ status: number() }) }));
  },
});

const team = defineProvider({
  name: "Cutt.ly Team",
  hosts: ["cutt.ly"],
  auth: { apiKey: secrets({ label: "Team API key (Team edit page)", fields: keyFields }) },
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `${teamBase}?${new URLSearchParams({ key: account.fields.token, action: "stats", url: "https://cutt.ly/executorhealthcheck" })}`,
      { signal },
    );
    await decodeJson(response, object({ stats: object({ status: number() }) }));
  },
});

type Account = { fields: { token: string } };
type Params = Record<string, string | number | undefined>;

const search = (params: Params) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const editShape = {
  tag: string().optional(),
  name: string().optional(),
  source: string().optional(),
  unique: number().optional(),
  title: string().optional(),
  mobile: string().optional(),
  destination: string().optional(),
  package_id: string().optional(),
  referrer: string().optional(),
  expire: number().optional(),
  expireCond: string().optional(),
  expireRedirect: string().optional(),
  expireUnique: number().optional(),
  abtest: number().optional(),
  abtest_b: number().optional(),
  abtest_bvariation: string().optional(),
  abtest_c: number().optional(),
  abtest_cvariation: string().optional(),
};

const editDescription =
  "Edit a short link; send only the fields to change. tag adds a tag, name is a new alias, source the new destination URL, unique 0 (off), 1, or 15-1440 minutes (Team plans), title a custom title. mobile is android, ios, windowsMobile or redirect (case-sensitive) with destination a URL or deep link (omit destination to remove that redirect); package_id and referrer configure Android deferred deep links (empty removes them). expire is 0 (by clicks) or 1 (by date, per the field table) with expireCond a click count, a YYYY-MM-DD date, or 0 to remove, plus expireRedirect and expireUnique (1 unique clicks only). abtest is 0 (remove), 1 (A/B) or 2 (A/B/C) with abtest_b/abtest_c chances (0-100, sum at most 100) and abtest_bvariation/abtest_cvariation URLs. Returns status 1 ok, 2 save failed, 3 link not found or not yours, 4 invalid URL. Requires a Single plan or higher.";

const statsDescription =
  "Get click analytics for a short link: total clicks, clicks by Facebook, Twitter, LinkedIn, other and bots, plus referrers, countries, devices, operating systems, browsers, brands, languages and bot names. date_from and date_to (YYYY-MM-DD) require a Team plan.";

const regularTools = (account: Account, signal: AbortSignal) => {
  const call = (fetch: typeof globalThis.fetch, params: Params, init?: RequestInit) =>
    fetch(`${regularBase}?${search({ key: account.fields.token, ...params })}`, { signal, ...init });
  return router({
    shorten: mutation(
      {
        description:
          "Shorten a URL. Optional name is a custom alias, userDomain 1 uses your branded domain (paid plan), noTitle 1 skips title lookup (Team Enterprise), public 1 makes click stats public (Single plan or higher). The response url.status is 7 on success (with shortLink, fullLink, title, date); 1 already shortened, 2 not a link, 3 alias taken, 4 invalid key, 5 failed validation, 6 domain blocked, 8 monthly limit reached. Free plan allows 3 calls per minute.",
        input: object({
          short: string(),
          name: string().optional(),
          userDomain: number().optional(),
          noTitle: number().optional(),
          public: number().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => decodeJson(await call(fetch, input), json()),
    ),
    stats: query(
      { description: statsDescription, input: object({ link: string(), date_from: string().optional(), date_to: string().optional() }) },
      async ({ fetch }, { link, ...rest }) => decodeJson(await call(fetch, { stats: link, ...rest }), json()),
    ),
    edit: mutation(
      { description: editDescription, input: object({ link: string(), ...editShape }), approval: always() },
      async ({ fetch }, { link, ...rest }) => decodeJson(await call(fetch, { edit: link, ...rest }), json()),
    ),
    delete: mutation(
      { description: "Permanently delete a short link. Returns the edit status (1 ok, 3 not found or not yours).", input: object({ link: string() }), approval: always() },
      async ({ fetch }, { link }) => decodeJson(await call(fetch, { edit: link, delete: 1 }), json()),
    ),
    setPassword: mutation(
      { description: "Set a password on a short link; an empty password removes it. Sent by POST.", input: object({ link: string(), password: string() }), approval: always() },
      async ({ fetch }, { link, password }) =>
        decodeJson(
          await call(fetch, { edit: link, password: 1 }, { method: "POST", body: new URLSearchParams({ password }) }),
          json(),
        ),
    ),
  });
};

const teamTools = (account: Account, signal: AbortSignal) => {
  const call = (fetch: typeof globalThis.fetch, params: Params, init?: RequestInit) =>
    fetch(`${teamBase}?${search({ key: account.fields.token, ...params })}`, { signal, ...init });
  return router({
    shorten: mutation(
      {
        description:
          "Shorten a URL for the team. Optional name is a custom alias, domain a custom domain the team owns (or 2s.ms/HEADER for TRAI SMS), header the TRAI SMS header for a custom domain, noTitle 1 skips title lookup (Team Enterprise), public 1 makes click stats public. Errors are returned as HTTP 400/401/409.",
        input: object({
          url: string(),
          name: string().optional(),
          domain: string().optional(),
          header: string().optional(),
          noTitle: number().optional(),
          public: number().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => decodeJson(await call(fetch, { action: "shorten", ...input }), json()),
    ),
    stats: query(
      { description: statsDescription + " stats.status is 0 link not found, 1 ok, 2 invalid key.", input: object({ url: string(), date_from: string().optional(), date_to: string().optional() }) },
      async ({ fetch }, input) => decodeJson(await call(fetch, { action: "stats", ...input }), json()),
    ),
    edit: mutation(
      { description: editDescription.replace("Requires a Single plan or higher.", "Requires a Team plan."), input: object({ url: string(), ...editShape }), approval: always() },
      async ({ fetch }, input) => decodeJson(await call(fetch, { action: "edit", ...input }), json()),
    ),
    delete: mutation(
      { description: "Permanently delete a team short link.", input: object({ url: string() }), approval: always() },
      async ({ fetch }, { url }) => decodeJson(await call(fetch, { action: "edit", url, delete: 1 }), json()),
    ),
    setPassword: mutation(
      { description: "Set a password on a team short link; an empty password removes it. Sent by POST.", input: object({ url: string(), password: string() }), approval: always() },
      async ({ fetch }, { url, password }) =>
        decodeJson(
          await call(fetch, { action: "edit", url, password: 1 }, { method: "POST", body: new URLSearchParams({ password }) }),
          json(),
        ),
    ),
  });
};

export default defineApp(
  { user: { accounts: { cuttly: regular.many(), team: team.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      {
        api: await accountRouter(user?.accounts.cuttly ?? [], (account) => regularTools(account, signal), { signal }),
        team: await accountRouter(user?.accounts.team ?? [], (account) => teamTools(account, signal), { signal }),
      },
      {
        title: "Cutt.ly",
        description: "Shorten links, edit them (alias, destination, expiry, deep links, A/B tests, password), delete them and read click analytics. The api group uses a regular API key; the team group uses a Team API key.",
        icons,
      },
    ),
  }),
);
