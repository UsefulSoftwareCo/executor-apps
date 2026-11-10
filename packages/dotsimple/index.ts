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
  plain,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://app.dotsimple.io/app/api";

const dotsimple = defineProvider({
  name: "DotSimple",
  hosts: ["app.dotsimple.io"],
  auth: {
    apiKey: secrets({
      label: "Access token",
      fields: object({
        workspaceUuid: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  // Listing the workspace's tags is read-only and fails with 401/404 for a wrong token or workspace.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/${account.fields.workspaceUuid}/tags`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({ data: array(object({ uuid: string() })) }));
    return { accountInfo: { externalId: account.fields.workspaceUuid } };
  },
});

type Fetch = typeof fetch;

function client(workspace: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const root = `${base}/${encodeURIComponent(workspace)}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
  const call = async (
    method: string,
    path: string,
    options: { search?: Record<string, string | number | undefined>; body?: unknown } = {},
  ) => {
    const search = Object.entries(options.search ?? {}).filter((e): e is [string, string | number] => e[1] !== undefined);
    const qs = search.length > 0 ? `?${new URLSearchParams(search.map(([k, v]) => [k, String(v)]))}` : "";
    const response = await fetcher(`${root}${path}${qs}`, {
      method,
      signal,
      headers: options.body === undefined ? headers : { ...headers, "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    return decodeJson(response, json());
  };
  const upload = async (file: Blob, name: string) => {
    const form = new FormData();
    form.append("file", file, name);
    const response = await fetcher(`${root}/media`, { method: "POST", signal, headers, body: form });
    return decodeJson(response, json());
  };
  return { call, upload };
}

const id = () => string({ minLength: 1 });
const Page = object({ page: number().optional() });

const Version = object({
  account_id: number(),
  is_original: boolean(),
  content: array(object({ body: string(), media: array(number()).optional() })),
  options: json().optional(),
});

const PostFields = {
  date: string().optional(),
  time: string().optional(),
  timezone: string().optional(),
  accounts: array(number()).optional(),
  tags: array(number()).optional(),
  versions: array(Version).optional(),
};

function build({ call, upload }: ReturnType<typeof client>, fetcher: Fetch, signal: AbortSignal | undefined) {
  const enc = encodeURIComponent;
  return router({
    accounts: router(
      {
        list: query(
          {
            description:
              "List the social accounts connected to the workspace with id, uuid, name, username, provider and authorized flag. Post tools take the numeric `id` values.",
            input: object({}),
          },
          async () => call("GET", "/accounts"),
        ),
        get: query(
          { description: "Get one connected social account by uuid.", input: object({ accountUuid: id() }) },
          async (_ctx, { accountUuid }) => call("GET", `/accounts/${enc(accountUuid)}`),
        ),
      },
      { title: "Accounts", description: "Social accounts (Instagram, TikTok, LinkedIn, X, Pinterest and more) connected to the workspace." },
    ),
    tags: router(
      {
        list: query({ description: "List the workspace's tags with id, uuid, name and hex_color.", input: object({}) }, async () =>
          call("GET", "/tags"),
        ),
        get: query(
          { description: "Get one tag by uuid.", input: object({ tagUuid: id() }) },
          async (_ctx, { tagUuid }) => call("GET", `/tags/${enc(tagUuid)}`),
        ),
        create: mutation(
          {
            description: "Create a tag. hex_color is a CSS hex colour such as \"#60a5fa\".",
            input: object({ name: string({ minLength: 1 }), hex_color: string({ minLength: 4 }) }),
          },
          async (_ctx, body) => call("POST", "/tags", { body }),
        ),
        delete: mutation(
          { description: "Delete a tag by uuid.", input: object({ tagUuid: id() }) },
          async (_ctx, { tagUuid }) => call("DELETE", `/tags/${enc(tagUuid)}`),
        ),
      },
      { title: "Tags", description: "Labels for organising posts." },
    ),
    media: router(
      {
        list: query(
          { description: "List media files, 20 per page. Returns data, links and meta (last_page, total).", input: Page },
          async (_ctx, { page }) => call("GET", "/media", { search: { page } }),
        ),
        get: query(
          { description: "Get one media file by uuid.", input: object({ mediaUuid: id() }) },
          async (_ctx, { mediaUuid }) => call("GET", `/media/${enc(mediaUuid)}`),
        ),
        uploadFromUrl: mutation(
          {
            description:
              "Download an image or video from a public URL and upload it to the media library. Returns the created media object; use its numeric id in post versions.",
            input: object({ url: string({ minLength: 1 }), fileName: string().optional() }),
          },
          async (_ctx, { url, fileName }) => {
            const source = await fetcher(url, { signal });
            if (!source.ok) throw new Error(`Could not download ${url}: HTTP ${source.status}`);
            const name = fileName ?? (new URL(url).pathname.split("/").pop() || "upload");
            return upload(await source.blob(), name);
          },
        ),
        uploadBase64: mutation(
          {
            description: "Upload a file given as base64 text to the media library. Returns the created media object.",
            input: object({ contentBase64: string({ minLength: 1 }), fileName: string({ minLength: 1 }), mimeType: string({ minLength: 1 }) }),
          },
          async (_ctx, { contentBase64, fileName, mimeType }) => {
            const bytes = Uint8Array.from(atob(contentBase64), (c) => c.charCodeAt(0));
            return upload(new Blob([bytes], { type: mimeType }), fileName);
          },
        ),
        delete: mutation(
          {
            description: "Delete media files by their numeric ids (the `id` field, not the uuid).",
            input: object({ items: array(number()) }),
          },
          async (_ctx, { items }) => call("DELETE", "/media", { body: { items } }),
        ),
      },
      { title: "Media", description: "The workspace's media library." },
    ),
    posts: router(
      {
        list: query(
          { description: "List posts, 20 per page, with status, accounts, versions, tags and schedule times.", input: Page },
          async (_ctx, { page }) => call("GET", "/posts", { search: { page } }),
        ),
        get: query(
          { description: "Get one post by uuid.", input: object({ postUuid: id() }) },
          async (_ctx, { postUuid }) => call("GET", `/posts/${enc(postUuid)}`),
        ),
        create: mutation(
          {
            description:
              "Create a post. accounts and tags are numeric ids from accounts.list and tags.list. versions[0] is the original (account_id 0, is_original true) with content [{ body, media: [mediaId] }]; extra versions override the content per account. options are per provider (e.g. youtube { title, status }, linkedin { visibility }, mastodon { sensitive }, instagram { type }). Set schedule with date (YYYY-MM-DD), time (HH:MM) and timezone to schedule, schedule_now to publish immediately, or queue to add to the publishing queue; otherwise a draft is saved.",
            input: object({
              ...PostFields,
              schedule: boolean().optional(),
              schedule_now: boolean().optional(),
              queue: boolean().optional(),
            }),
          },
          async (_ctx, body) => call("POST", "/posts", { body }),
        ),
        update: mutation(
          {
            description: "Update a post by uuid. Takes the same date, time, timezone, accounts, tags and versions as posts.create.",
            input: object({ postUuid: id(), ...PostFields }),
          },
          async (_ctx, { postUuid, ...body }) => call("PUT", `/posts/${enc(postUuid)}`, { body }),
        ),
        schedule: mutation(
          {
            description: "Schedule an existing post. postNow true publishes immediately; false uses the post's own date and time.",
            input: object({ postUuid: id(), postNow: boolean() }),
          },
          async (_ctx, { postUuid, postNow }) => call("POST", `/posts/schedule/${enc(postUuid)}`, { body: { postNow } }),
        ),
        addToQueue: mutation(
          { description: "Add an existing post to the publishing queue.", input: object({ postUuid: id() }) },
          async (_ctx, { postUuid }) => call("POST", `/posts/add-to-queue/${enc(postUuid)}`),
        ),
        delete: mutation(
          { description: "Delete a post by uuid.", input: object({ postUuid: id() }) },
          async (_ctx, { postUuid }) => call("DELETE", `/posts/${enc(postUuid)}`),
        ),
        deleteMany: mutation(
          { description: "Delete several posts by uuid.", input: object({ posts: array(string({ minLength: 1 })) }) },
          async (_ctx, { posts }) => call("DELETE", "/posts", { body: { posts } }),
        ),
      },
      { title: "Posts", description: "Drafts, scheduled and published posts across connected accounts." },
    ),
    ai: router(
      {
        credits: query(
          { description: "Get the workspace's total and used AI credits (total is \"unlimited\" when uncapped).", input: object({}) },
          async () => call("GET", "/ai/credits"),
        ),
        generateResponse: mutation(
          {
            description: "Generate text from a prompt, optionally in english or german. Spends AI credits.",
            input: object({ prompt: string({ minLength: 1 }), language: string().optional() }),
          },
          async (_ctx, { prompt, language }) => call("GET", "/ai/generate-response", { search: { prompt, language } }),
        ),
      },
      { title: "AI", description: "DotSimple's AI text generation." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { dotsimple: dotsimple.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dotsimple ?? [],
        (account) =>
          withApprovals(build(client(account.fields.workspaceUuid, account.fields.token, fetch, signal), fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "DotSimple",
        description: "Plan and publish social media posts with DotSimple: accounts, tags, media files, posts and AI text.",
        icons,
      },
    ),
  }),
);
