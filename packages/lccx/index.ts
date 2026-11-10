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
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.lc.cx/v1";

const lccx = defineProvider({
  name: "lc.cx",
  hosts: ["api.lc.cx"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/account`, {
      signal,
      headers: { apikey: account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({ username: string(), plan: string() }));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ apikey: account.fields.token, Accept: "application/json" });
const jsonHeaders = (account: Account) => ({ ...headers(account), "content-type": "application/json" });

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const segment = encodeURIComponent;

const tagObject = object({ name: string(), color: string().optional() });

const lccxTools = (account: Account, signal: AbortSignal) => {
  const get = async (fetch: typeof globalThis.fetch, path: string) =>
    decodeJson(await fetch(`${base}${path}`, { signal, headers: headers(account) }), json());
  const send = async (fetch: typeof globalThis.fetch, method: string, path: string, body?: unknown) =>
    decodeJson(
      await fetch(`${base}${path}`, {
        method,
        signal,
        headers: body === undefined ? headers(account) : jsonHeaders(account),
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
      json(),
    );

  return router({
    account: query(
      { description: "Get the account: username, plan, shortlink quota, usage and quota reset date.", input: object({}) },
      async ({ fetch }) => get(fetch, "/account"),
    ),
    workspaces: query(
      { description: "List workspaces with their attached branded domains.", input: object({}) },
      async ({ fetch }) => get(fetch, "/workspaces"),
    ),
    listDomains: query(
      { description: "List the branded domains attached to the account, with their ids (needed to create links).", input: object({}) },
      async ({ fetch }) => get(fetch, "/domains"),
    ),
    getDomain: query(
      { description: "Get one domain by id.", input: object({ id: string() }) },
      async ({ fetch }, { id }) => get(fetch, `/domains/${segment(id)}`),
    ),
    addDomain: mutation(
      {
        description:
          "Add a branded domain for shortening URLs. homepage and notfoundpage (custom landing and 404 URLs) are only available on the Pro and Agency plans.",
        input: object({
          domain: string(),
          description: string().optional(),
          homepage: string().optional(),
          notfoundpage: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/domains/add", input),
    ),
    updateDomain: mutation(
      {
        description: "Update a domain's description, homepage URL or 404 page URL by id.",
        input: object({
          id: string(),
          description: string().optional(),
          homepage: string().optional(),
          notfoundpage: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { id, ...body }) => send(fetch, "PATCH", `/domains/update/${segment(id)}`, body),
    ),
    deleteDomain: mutation(
      {
        description: "Delete a domain by id. All short links attached to the domain are deleted too.",
        input: object({ id: string() }),
        approval: always(),
      },
      async ({ fetch }, { id }) => send(fetch, "DELETE", `/domains/delete/${segment(id)}`),
    ),
    listLinks: query(
      {
        description: "List the 25 most recently created short links. Use offset to skip results for pagination.",
        input: object({ offset: number().optional() }),
      },
      async ({ fetch }, input) => get(fetch, `/links${search(input)}`),
    ),
    findLink: query(
      {
        description: "Find a short link by its path and the id of its domain.",
        input: object({ path: string(), domain: string() }),
      },
      async ({ fetch }, input) => get(fetch, `/links${search(input)}`),
    ),
    getLink: query(
      { description: "Get a short link by id.", input: object({ id: string() }) },
      async ({ fetch }, { id }) => get(fetch, `/links/${segment(id)}`),
    ),
    shorten: mutation(
      {
        description:
          "Create a short link. domain is the domain id (see listDomains). custom_path may not contain special characters. note is at most 255 characters. tags are tag ids. expiration_date is a UNIX timestamp and expiration_url is where visitors go after expiry.",
        input: object({
          destination: string(),
          domain: string(),
          custom_path: string().optional(),
          note: string().optional(),
          tags: array(string()).optional(),
          rule: string().optional(),
          expiration_date: number().optional(),
          expiration_url: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/shorten", input),
    ),
    shortenBulk: mutation(
      {
        description:
          "Create up to 1000 short links in one call (rate limit 5 requests per 10 seconds). Each item takes the same fields as shorten.",
        input: object({
          links: array(
            object({
              destination: string(),
              domain: string(),
              custom_path: string().optional(),
              note: string().optional(),
              tags: array(string()).optional(),
              rule: string().optional(),
            }),
          ),
        }),
        approval: always(),
      },
      async ({ fetch }, { links }) => send(fetch, "POST", "/shorten/bulk", links),
    ),
    updateLink: mutation(
      {
        description:
          "Update a short link's destination, note or tags by id. tags is the full list of tag ids; pass an empty array to remove all tags. Set rfcValidation or tldValidation to validate the new destination.",
        input: object({
          id: string(),
          destination: string().optional(),
          note: string().optional(),
          tags: array(string()).optional(),
          rfcValidation: boolean().optional(),
          tldValidation: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { id, rfcValidation, tldValidation, ...body }) =>
        send(
          fetch,
          "PATCH",
          `/links/update/${segment(id)}${search({ rfc_validation: rfcValidation === undefined ? undefined : String(rfcValidation), tld_validation: tldValidation === undefined ? undefined : String(tldValidation) })}`,
          body,
        ),
    ),
    deleteLink: mutation(
      {
        description: "Delete a short link by id.",
        input: object({ id: string() }),
        approval: always(),
      },
      async ({ fetch }, { id }) => send(fetch, "DELETE", `/links/delete/${segment(id)}`),
    ),
    listTags: query(
      { description: "List tags.", input: object({}) },
      async ({ fetch }) => get(fetch, "/tags"),
    ),
    getTag: query(
      { description: "Get one tag by id.", input: object({ id: string() }) },
      async ({ fetch }, { id }) => get(fetch, `/tags/${segment(id)}`),
    ),
    createTags: mutation(
      {
        description: "Create one or several tags. color is a hex code such as #797979 (the default).",
        input: object({ tags: array(tagObject) }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/tags/create", input),
    ),
    updateTag: mutation(
      {
        description: "Rename a tag or change its color by id.",
        input: object({ id: string(), name: string().optional(), color: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, { id, ...body }) => send(fetch, "PATCH", `/tags/update/${segment(id)}`, body),
    ),
    updateTagsBulk: mutation(
      {
        description: "Update several tags at once.",
        input: object({ tags: array(object({ id: string(), name: string(), color: string().optional() })) }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/tags/update/bulk", input),
    ),
    deleteTag: mutation(
      { description: "Permanently delete a tag by id.", input: object({ id: string() }), approval: always() },
      async ({ fetch }, { id }) => send(fetch, "DELETE", `/tags/delete/${segment(id)}`),
    ),
    deleteTagsBulk: mutation(
      {
        description: "Permanently delete several tags by id.",
        input: object({ tags: array(string()) }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/tags/delete/bulk", input),
    ),
    linkClicks: query(
      { description: "Get the total clicks on a short link by id.", input: object({ id: string() }) },
      async ({ fetch }, { id }) => get(fetch, `/statistics/links/${segment(id)}/clicks`),
    ),
    tagClicks: query(
      {
        description: "Get click totals for the short links carrying a tag. Use offset for pagination.",
        input: object({ id: string(), offset: number().optional() }),
      },
      async ({ fetch }, { id, offset }) => get(fetch, `/statistics/tags/${segment(id)}/clicks${search({ offset })}`),
    ),
    createQrCode: mutation(
      {
        description:
          "Create a QR code for a short link by id, either with title, color (hex such as #000000) and format (PNG or SVG, default PNG), or from a QR template id.",
        input: object({
          id: string(),
          title: string().optional(),
          color: string().optional(),
          format: string().optional(),
          template: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { id, ...body }) => send(fetch, "POST", `/qr/${segment(id)}/create`, body),
    ),
    createQrCodesBulk: mutation(
      {
        description:
          "Create QR codes for up to 50 short links at once, either from a QR template id or with title and color (hex such as #000000).",
        input: object({
          shortlinks: array(string()),
          template: string().optional(),
          title: string().optional(),
          color: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/qr/bulk/create", input),
    ),
  });
};

export default defineApp({ user: { accounts: { lccx: lccx.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.lccx ?? [], (account) => lccxTools(account, signal), { signal }), {
    title: "lc.cx",
    description: "Create and manage short links, branded domains, tags, click statistics and QR codes in lc.cx.",
    icons,
  }),
}));
