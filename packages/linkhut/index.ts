import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  oauth2,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.ln.ht/v1";
const userAgent = "executor-linkhut/0.0.1";
// Linkhut asks for at least one second between requests and to back off on 500/999.
const minGapMs = 1000;
const backoffMs = 2000;
const maxRetries = 3;

const sleep = (ms: number, signal: AbortSignal | undefined) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => (clearTimeout(timer), reject(signal.reason)), { once: true });
  });

// Per-token queue: calls run one at a time, each starting at least minGapMs after the previous one started.
const queues = new Map<string, { tail: Promise<unknown>; last: number }>();
function throttled<T>(key: string, run: () => Promise<T>): Promise<T> {
  const state = queues.get(key) ?? { tail: Promise.resolve(), last: 0 };
  queues.set(key, state);
  const result = state.tail.then(async () => {
    const wait = state.last + minGapMs - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    try {
      return await run();
    } finally {
      state.last = Date.now();
    }
  });
  state.tail = result.catch(() => undefined);
  return result;
}

const linkhut = defineProvider({
  name: "Linkhut",
  hosts: ["api.ln.ht"],
  auth: {
    // Personal access tokens are created at https://ln.ht/_/oauth/personal-token.
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Linkhut offers no client registration: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://ln.ht/_/oauth/authorize",
      tokenUrl: "https://api.ln.ht/v1/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["posts:read", "posts:write", "tags:read", "tags:write"],
    }),
  },
  // The API has no current-user endpoint; posts/update answers for any valid token.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/posts/update`, {
      signal,
      headers: { Authorization: `Bearer ${bearer(account)}`, Accept: "application/json", "User-Agent": userAgent },
    });
    await decodeJson(response, object({ update_time: string() }));
  },
});

function bearer(account: { method: "token"; fields: { token: string } } | { method: "oauth"; fields: { access_token: string } }) {
  return account.method === "oauth" ? account.fields.access_token : account.fields.token;
}

type Params = Record<string, string | number | undefined>;

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  // Every Linkhut method is a GET, writes included.
  const call = async (path: string, params: Params) => {
    const url = new URL(`${base}/${path}`);
    for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, String(value));
    return throttled(token, async () => {
      for (let attempt = 0; ; attempt++) {
        const response = await fetcher(url.toString(), {
          signal,
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "User-Agent": userAgent },
        });
        // 500 and 999 mean the account has been throttled: back off and retry.
        if ((response.status === 500 || response.status === 999) && attempt < maxRetries) {
          await sleep(backoffMs * 2 ** attempt, signal);
          continue;
        }
        return decodeJson(response, json());
      }
    });
  };

  const date = (what: string) => `${what} (format CCYY-MM-DDThh:mm:ssZ, with a literal T and Z)`;

  return router({
    posts: router(
      {
        update: query(
          { description: "Return the most recent time a bookmark was added, updated or deleted.", input: object({}) },
          () => call("posts/update", {}),
        ),
        get: query(
          {
            description:
              "Return posts on a single day matching the arguments. With no date or url, the date of the most recent bookmark is used.",
            input: object({
              tag: string().optional(),
              dt: string().optional(),
              url: string().optional(),
              hashes: string().optional(),
              meta: string().optional(),
            }),
          },
          (_ctx, args) => call("posts/get", args),
        ),
        recent: query(
          {
            description: "Return the most recent posts, optionally filtered by tag.",
            input: object({ tag: string().optional(), count: string().optional() }),
          },
          (_ctx, args) => call("posts/recent", args),
        ),
        dates: query(
          {
            description: "Return the dates on which bookmarks were saved with the number of posts on each, optionally filtered by tag.",
            input: object({ tag: string().optional() }),
          },
          (_ctx, args) => call("posts/dates", args),
        ),
        all: query(
          {
            description:
              "Return all bookmarks. Use sparingly and check posts.update first. Up to 1000 are returned unless results is set.",
            input: object({
              tag: string().optional(),
              start: string().optional(),
              results: string().optional(),
              fromdt: string().optional(),
              todt: string().optional(),
              meta: string().optional(),
            }),
          },
          (_ctx, args) => call("posts/all", args),
        ),
        suggest: query(
          {
            description: "Return popular tags (used by others) and recommended tags (from your own set) for a url.",
            input: object({ url: string() }),
          },
          (_ctx, args) => call("posts/suggest", args),
        ),
        add: mutation(
          {
            description: "Add a bookmark, replacing an existing one with the same url unless replace is no.",
            input: object({
              url: string(),
              description: string(),
              extended: string().optional(),
              tags: string().optional(),
              dt: string().optional(),
              replace: string().optional(),
              shared: string().optional(),
              toread: string().optional(),
            }),
          },
          (_ctx, args) => call("posts/add", args),
        ),
        delete: mutation(
          { description: "Delete the bookmark with the given url.", input: object({ url: string() }) },
          (_ctx, args) => call("posts/delete", args),
        ),
      },
      {
        title: "Posts",
        description: `Bookmarks. Dates use ${date("the")}. Tags are comma separated when writing and joined by + when filtering.`,
      },
    ),
    tags: router(
      {
        get: query(
          { description: "Return all tags with the number of times each is used.", input: object({}) },
          () => call("tags/get", {}),
        ),
        rename: mutation(
          { description: "Rename a tag on every post that has it.", input: object({ old: string(), new: string() }) },
          (_ctx, args) => call("tags/rename", args),
        ),
        delete: mutation(
          { description: "Delete a tag from every post that has it.", input: object({ tag: string() }) },
          (_ctx, args) => call("tags/delete", args),
        ),
      },
      { title: "Tags", description: "Tags used across your bookmarks." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { linkhut: linkhut.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.linkhut ?? [],
        (account) =>
          withApprovals(build(bearer(account), fetch, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Linkhut",
        description: "Save, search and organize bookmarks and tags on Linkhut (ln.ht).",
        icons,
      },
    ),
  }),
);
