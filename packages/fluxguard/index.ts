import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.fluxguard.com";

const fluxguard = defineProvider({
  name: "Fluxguard",
  hosts: ["api.fluxguard.com"],
  auth: {
    // Created in the Fluxguard app under organization settings; sent in the x-api-key header.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/account`, {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

type Call = (method: string, path: string, body?: Record<string, unknown>) => Promise<unknown>;

function api(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call: Call = async (method, path, body) => {
    const response = await fetcher(`${base}${path}`, {
      method,
      signal,
      headers: {
        "x-api-key": token,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    const text = await response.text();
    if (!response.ok) throw new Error(`Fluxguard ${method} ${path} failed with ${response.status}: ${text.slice(0, 500)}`);
    if (text === "") return { ok: true };
    return JSON.parse(text) as never;
  };
  const e = encodeURIComponent;
  const ids = { siteId: string(), sessionId: string(), pageId: string() };

  return router({
    account: router({
      get: query(
        { description: "Get the organization's account attributes.", input: object({}) },
        () => call("GET", "/account"),
      ),
    }),
    monitoring: router({
      addPage: mutation(
        {
          description:
            "Add a URL to monitor. Without siteId and sessionId a new site and session are created; then categories (list of category IDs), categoryId, categoryName and siteNickname may be set. Returns siteId, sessionId and pageId.",
          input: object({
            url: string(),
            siteId: string().optional(),
            sessionId: string().optional(),
            siteNickname: string().optional(),
            categories: array(string()).optional(),
            categoryId: string().optional(),
            categoryName: string().optional(),
          }),
        },
        (_ctx, args) => call("POST", "/add-page", args),
      ),
      crawl: mutation(
        {
          description: "Start a crawl of every page in a site session.",
          input: object({ siteId: string(), sessionId: string() }),
        },
        (_ctx, a) => call("POST", `/site/${e(a.siteId)}/session/${e(a.sessionId)}/crawl`),
      ),
      getPage: query(
        { description: "Get the data for a monitored page.", input: object(ids) },
        (_ctx, a) => call("GET", `/site/${e(a.siteId)}/session/${e(a.sessionId)}/page/${e(a.pageId)}`),
      ),
    }),
    webhooks: router({
      sample: query(
        { description: "Get a sample webhook payload built from the account's data.", input: object({}) },
        () => call("GET", "/account/webhook/sample"),
      ),
      list: query(
        { description: "List the organization's webhooks.", input: object({}) },
        () => call("GET", "/account/webhook"),
      ),
      create: mutation(
        { description: "Register a webhook URL that receives change notifications. Returns the webhook id.", input: object({ url: string() }) },
        (_ctx, a) => call("PUT", "/account/webhook", a),
      ),
      delete: mutation(
        { description: "Delete a webhook by id.", input: object({ id: string() }) },
        (_ctx, a) => call("DELETE", "/account/webhook", a),
      ),
    }),
    categories: router({
      list: query(
        { description: "List categories, keyed by category ID, with name and whether each applies to sites or pages.", input: object({}) },
        () => call("GET", "/account/category"),
      ),
      create: mutation(
        { description: "Create a site category. Returns its ID.", input: object({ name: string() }) },
        (_ctx, a) => call("POST", "/account/category", a),
      ),
    }),
    maintenance: router({
      deleteSite: mutation(
        { description: "Delete a site with all its sessions, pages and captured versions.", input: object({ siteId: string() }) },
        (_ctx, a) => call("DELETE", `/site/${e(a.siteId)}`),
      ),
      deletePage: mutation(
        { description: "Delete a page and all its captured versions.", input: object(ids) },
        (_ctx, a) => call("DELETE", `/site/${e(a.siteId)}/session/${e(a.sessionId)}/page/${e(a.pageId)}`),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { fluxguard: fluxguard.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.fluxguard ?? [],
        (account) =>
          withApprovals(api(account.fields.token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Fluxguard",
        description: "Monitor websites for changes with Fluxguard: add pages, crawl sites, read pages, manage webhooks and categories.",
        icons,
      },
    ),
  }),
);
