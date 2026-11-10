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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.curated.co/api/v3";

const curated = defineProvider({
  name: "Curated",
  hosts: ["api.curated.co"],
  auth: {
    apiKey: secrets({
      label: "Account API key (my.curated.co > Account > Account API key)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/publications`, {
      signal,
      headers: {
        Authorization: `Token token="${account.fields.token}"`,
        Accept: "application/json",
      },
    });
    await decodeJson(response, array(object({ id: number() })));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params = {}, body?: unknown) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Token token="${token}"`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204) return { ok: true };
    if (method === "DELETE" && response.ok) {
      const text = await response.text();
      return text ? decodeJsonText(text) : { ok: true };
    }
    return decodeJson(response, json());
  };
}

function decodeJsonText(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { ok: true, response: text };
  }
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const pub = () => number();

function build(call: Call) {
  const publications = router({
    list: query({ description: "List the publications on the account (id, name, subdomain key).", input: object({}) }, () =>
      call("GET", "/publications"),
    ),
    categories: query(
      {
        description: "List the categories of a publication (code, name, sponsored, sponsored-link limit). Category codes are used when creating links.",
        input: object({ publicationId: pub() }),
      },
      (_c, { publicationId }) => call("GET", `/publications/${seg(String(publicationId))}/categories`),
    ),
  });

  const issues = router({
    list: query(
      {
        description: "List issues of a publication with pagination (perPage default 10, max 250; state is published or draft; stats adds open and click rates).",
        input: object({
          publicationId: pub(),
          perPage: number().optional(),
          page: number().optional(),
          state: string().optional(),
          stats: boolean().optional(),
        }),
      },
      (_c, { publicationId, perPage, page, state, stats }) =>
        call("GET", `/publications/${seg(String(publicationId))}/issues`, { per_page: perPage, page, state, stats }),
    ),
    get: query(
      {
        description:
          "Get one issue with its categories and items. issueNumber accepts the issue number or id; unpublished issues only accept the id.",
        input: object({ publicationId: pub(), issueNumber: string({ minLength: 1 }), stats: boolean().optional() }),
      },
      (_c, { publicationId, issueNumber, stats }) =>
        call("GET", `/publications/${seg(String(publicationId))}/issues/${seg(issueNumber)}`, { stats }),
    ),
    createDraft: mutation(
      { description: "Create a draft issue using the publication's default settings. Issues cannot be published through the API.", input: object({ publicationId: pub() }) },
      (_c, { publicationId }) => call("POST", `/publications/${seg(String(publicationId))}/issues/`),
    ),
    deleteDraft: mutation(
      { description: "Delete a draft issue by its id. Published issues cannot be deleted.", input: object({ publicationId: pub(), id: string({ minLength: 1 }) }) },
      (_c, { publicationId, id }) => call("DELETE", `/publications/${seg(String(publicationId))}/issues/${seg(id)}`),
    ),
  });

  const links = router({
    list: query(
      { description: "List collected links not yet attached to any issue.", input: object({ publicationId: pub() }) },
      (_c, { publicationId }) => call("GET", `/publications/${seg(String(publicationId))}/links`),
    ),
    get: query(
      { description: "Get one collected link.", input: object({ publicationId: pub(), id: string({ minLength: 1 }) }) },
      (_c, { publicationId, id }) => call("GET", `/publications/${seg(String(publicationId))}/links/${seg(id)}`),
    ),
    create: mutation(
      {
        description: "Collect a link into a publication (category is a code from publications.categories; image is a URL). Only links can be collected through the API, not text items.",
        input: object({
          publicationId: pub(),
          url: string({ minLength: 1 }),
          title: string().optional(),
          description: string().optional(),
          image: string().optional(),
          category: string().optional(),
        }),
      },
      (_c, { publicationId, ...fields }) => call("POST", `/publications/${seg(String(publicationId))}/links`, fields),
    ),
    update: mutation(
      {
        description:
          "Update a link that is not in a published issue. Set issueId to a draft issue's id to move the link into it; leave it out to keep it where it is.",
        input: object({
          publicationId: pub(),
          id: string({ minLength: 1 }),
          url: string().optional(),
          title: string().optional(),
          description: string().optional(),
          category: string().optional(),
          issueId: string().optional(),
        }),
      },
      (_c, { publicationId, id, issueId, ...fields }) =>
        call("PUT", `/publications/${seg(String(publicationId))}/links/${seg(id)}`, { ...fields, issue_id: issueId }),
    ),
    delete: mutation(
      { description: "Delete a link.", input: object({ publicationId: pub(), id: string({ minLength: 1 }) }) },
      (_c, { publicationId, id }) => call("DELETE", `/publications/${seg(String(publicationId))}/links/${seg(id)}`),
    ),
  });

  const subscribers = router({
    list: query(
      {
        description: "List email subscribers of a publication (perPage default 100, max 500).",
        input: object({ publicationId: pub(), perPage: number().optional(), page: number().optional() }),
      },
      (_c, { publicationId, perPage, page }) =>
        call("GET", `/publications/${seg(String(publicationId))}/email_subscribers`, { per_page: perPage, page }),
    ),
    get: query(
      { description: "Get one email subscriber by id.", input: object({ publicationId: pub(), id: string({ minLength: 1 }) }) },
      (_c, { publicationId, id }) => call("GET", `/publications/${seg(String(publicationId))}/email_subscribers/${seg(id)}`),
    ),
    subscribe: mutation(
      {
        description:
          "Subscribe an email address. The subscriber still receives a welcome email. Only use where the person has been told they will be subscribed; sync=true skips the publication's double opt-in.",
        input: object({ publicationId: pub(), email: string({ minLength: 1 }), sync: boolean().optional() }),
      },
      (_c, { publicationId, email, sync }) =>
        call("POST", `/publications/${seg(String(publicationId))}/email_subscribers`, {}, { email, ...(sync === undefined ? {} : { sync }) }),
    ),
    listUnsubscribers: query(
      {
        description: "List email unsubscribers of a publication (perPage default 100, max 500).",
        input: object({ publicationId: pub(), perPage: number().optional(), page: number().optional() }),
      },
      (_c, { publicationId, perPage, page }) =>
        call("GET", `/publications/${seg(String(publicationId))}/email_unsubscribers`, { per_page: perPage, page }),
    ),
    unsubscribe: mutation(
      { description: "Unsubscribe an email address from a publication.", input: object({ publicationId: pub(), email: string({ minLength: 1 }) }) },
      (_c, { publicationId, email }) =>
        call("POST", `/publications/${seg(String(publicationId))}/email_unsubscribers`, {}, { email }),
    ),
  });

  return router({ publications, issues, links, subscribers });
}

export default defineApp(
  { user: { accounts: { curated: curated.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.curated ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Curated",
        description: "Curated newsletters: publications, categories, issues, collected links and email subscribers.",
        icons,
        instructions:
          "Most tools need a publicationId; get it from publications.list. Issues can be created as drafts but not published through the API, and only links (not text items) can be collected.",
      },
    ),
  }),
);
