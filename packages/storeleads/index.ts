import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  array,
  json,
  mutation,
  number,
  object,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const storeleads = defineProvider({
  name: "Store Leads",
  hosts: ["storeleads.app"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://storeleads.app/json/api/v1/all/app?page_size=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

const base = "https://storeleads.app/json/api/v1/all";

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" });

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const seg = encodeURIComponent;

const fieldsHint = "fields is a comma-separated list of fields to return (nested with a period, e.g. name,plans.name); asking for fewer fields is much faster.";

// The published swagger.yaml has only four operations. These tools cover the other endpoints
// documented at https://storeleads.app/api.
const storeleadsCustom = (account: Account, signal: AbortSignal) => {
  const get = async (fetch: typeof globalThis.fetch, path: string) =>
    decodeJson(await fetch(`${base}${path}`, { signal, headers: headers(account) }), json());
  const send = async (fetch: typeof globalThis.fetch, method: string, path: string, body?: unknown) =>
    decodeJson(
      await fetch(`${base}${path}`, {
        method,
        signal,
        headers: { ...headers(account), "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      json(),
    );
  return router({
    domainsBulk: query(
      {
        description:
          "Retrieve up to 100 domains by name in one call. Each name is a public domain (merchant.com) or platform domain (merchant.myshopify.com). fields limits the returned fields (comma-separated). This is a POST that only reads.",
        input: object({ domains: array(string()), fields: string().optional() }),
      },
      ({ fetch }, input) => send(fetch, "POST", "/domain/bulk", input),
    ),
    domainAppReviews: query(
      {
        description:
          "List the app reviews associated with a domain (Shopify apps only). name is the public or platform domain. " + fieldsHint,
        input: object({ name: string(), fields: string().optional(), page: number().optional(), page_size: number().optional() }),
      },
      ({ fetch }, { name, ...rest }) => get(fetch, `/domain/${seg(name)}/app_reviews${search(rest)}`),
    ),
    appReviews: query(
      {
        description:
          "List the reviews of one app (Shopify apps only). id is platform.token, for example shopify.marsello. page_size max 50, sort is updated_at or -updated_at. " + fieldsHint,
        input: object({
          id: string(),
          fields: string().optional(),
          page: number().optional(),
          page_size: number().optional(),
          sort: string().optional(),
        }),
      },
      ({ fetch }, { id, ...rest }) => get(fetch, `/app/${seg(id)}/reviews${search(rest)}`),
    ),
    companyDomains: query(
      {
        description:
          "List domains for a company or brand name (for example gymshark, or Steve Madden rather than SteveMadden). page_size default 5, max 50. " + fieldsHint,
        input: object({ name: string(), fields: string().optional(), page_size: number().optional() }),
      },
      ({ fetch }, { name, ...rest }) => get(fetch, `/company/${seg(name)}${search(rest)}`),
    ),
    domainsByTld1: query(
      {
        description:
          "List all domains sharing a top-level-domain plus one (for example every subdomain of gymshark.com). " + fieldsHint,
        input: object({ name: string(), fields: string().optional() }),
      },
      ({ fetch }, { name, ...rest }) => get(fetch, `/domain/bytld1/${seg(name)}${search(rest)}`),
    ),
    historicalLabels: query(
      {
        description:
          "List the labels of the weekly historical domain archives. Needs an Enterprise plan. Pass a label to historicalDomains.",
        input: object({}),
      },
      ({ fetch }) => get(fetch, "/historical/domain"),
    ),
    historicalDomains: query(
      {
        description:
          "Retrieve domains from one weekly historical archive (label from historicalLabels), unfiltered. Needs an Enterprise plan; 1 request per minute. Always set limit: the archive is huge. Returns JSONL text, one domain per line. " + fieldsHint,
        input: object({ label: string(), limit: number(), fields: string().optional() }),
      },
      async ({ fetch }, { label, ...rest }) => {
        const response = await fetch(`${base}/historical/domain/${seg(label)}${search(rest)}`, {
          signal,
          headers: headers(account),
        });
        if (!response.ok) throw new Error(`Store Leads returned ${response.status}`);
        return response.text();
      },
    ),
    lists: query(
      { description: "List the Store Leads domain lists your account can access.", input: object({}) },
      ({ fetch }) => get(fetch, "/list"),
    ),
    list: query(
      { description: "Retrieve one domain list by name.", input: object({ name: string() }) },
      ({ fetch }, { name }) => get(fetch, `/list/${seg(name)}`),
    ),
    addDomainsToList: mutation(
      {
        description:
          "Add domains to a list (max 10,000 per request, no concurrent requests). Not possible for lists created by saving a search. Returns count_domains_added and unrecognized_domains.",
        input: object({ name: string(), domains: array(string()) }),
        approval: always(),
      },
      ({ fetch }, { name, domains }) => send(fetch, "PUT", `/list/${seg(name)}/add-domains`, { domains }),
    ),
    removeDomainsFromList: mutation(
      {
        description:
          "Remove domains from a list (max 10,000 per request, no concurrent requests). Not possible for lists created by saving a search.",
        input: object({ name: string(), domains: array(string()) }),
        approval: always(),
      },
      ({ fetch }, { name, domains }) => send(fetch, "PUT", `/list/${seg(name)}/remove-domains`, { domains }),
    ),
    truncateList: mutation(
      {
        description: "Remove every domain from a list. Not possible for lists created by saving a search.",
        input: object({ name: string() }),
        approval: always(),
      },
      ({ fetch }, { name }) => send(fetch, "PUT", `/list/${seg(name)}/truncate`),
    ),
    social: query(
      {
        description: "Retrieve a social media account by profile URL, for example https://twitter.com/amazon.",
        input: object({ url: string() }),
      },
      ({ fetch }, input) => get(fetch, `/social${search(input)}`),
    ),
    technology: query(
      {
        description: "Retrieve one technology (for example Yoast) with its install counts. " + fieldsHint,
        input: object({ name: string(), fields: string().optional() }),
      },
      ({ fetch }, { name, ...rest }) => get(fetch, `/technology/${seg(name)}${search(rest)}`),
    ),
    technologies: query(
      {
        description:
          "Search technologies. Optional filters go in params using the API's request options (for example q, sort such as -installs, page, page_size). " + fieldsHint,
        input: object({ params: record(json()).optional() }),
      },
      ({ fetch }, { params }) => send(fetch, "POST", "/technology", params ?? {}),
    ),
    themes: query(
      {
        description:
          "Search ecommerce themes. Optional request options go in params (for example sort such as -installs, page, page_size, fields).",
        input: object({ params: record(json()).optional() }),
      },
      ({ fetch }, { params }) => send(fetch, "POST", "/theme", params ?? {}),
    ),
  });
};

export default defineApp(
  { user: { accounts: { storeleads: storeleads.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: await accountRouter(
          user?.accounts.storeleads ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
        custom: await accountRouter(user?.accounts.storeleads ?? [], (account) => storeleadsCustom(account, signal), { signal }),
      },
      {
        title: "Store Leads",
        description: "Look up ecommerce stores and the apps they use with Store Leads: search domains, apps, reviews, technologies and themes, and manage domain lists.",
        icons,
      },
    ),
  }),
);
