import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  mutation,
  number,
  oauth2,
  object,
  query,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.linkedin.com";
// LinkedIn requires a version header on /rest calls and supports each version for a year.
const version = "202609";

const linkedin = defineProvider({
  name: "LinkedIn",
  hosts: ["api.linkedin.com"],
  auth: {
    // LinkedIn offers no client registration: the connect page asks for a LinkedIn developer app's client.
    // Only the self-serve products are requested: "Sign In with LinkedIn using OpenID Connect" and
    // "Share on LinkedIn". Other scopes need LinkedIn's approval and make authorization fail for unapproved apps.
    oauth: oauth2({
      authorizationUrl: "https://www.linkedin.com/oauth/v2/authorization",
      tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["openid", "profile", "email", "w_member_social"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v2/userinfo`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, object({ sub: string(), name: string() }));
    return { accountInfo: { externalId: me.sub, displayName: me.name } };
  },
});

type Fetch = typeof fetch;
type Search = Record<string, string | undefined>;

const urn = string({ minLength: 1 });
// URNs contain colons and parentheses, which LinkedIn expects percent-encoded in path segments.
const enc = encodeURIComponent;

function tools(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (
    path: string,
    init: { method?: string; search?: Search; body?: unknown; restliMethod?: string } = {},
  ) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(init.search ?? {})) if (value !== undefined) url.searchParams.set(key, value);
    const response = await fetcher(url.toString(), {
      method: init.method ?? "GET",
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": version,
        ...(init.restliMethod ? { "X-RestLi-Method": init.restliMethod } : {}),
        ...(init.body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    // Creates answer 201 with an empty body and the new id in x-restli-id; deletes answer 204.
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      if (!response.ok) throw new Error(`LinkedIn answered ${response.status}`);
      return { status: response.status, id: response.headers.get("x-restli-id") ?? undefined };
    }
    const text = await response.text();
    if (!response.ok) throw new Error(`LinkedIn answered ${response.status}: ${text.slice(0, 1000)}`);
    const id = response.headers.get("x-restli-id") ?? undefined;
    if (text === "") return { status: response.status, id };
    const parsed: unknown = JSON.parse(text);
    return id === undefined || typeof parsed !== "object" || parsed === null ? parsed : { id, ...parsed };
  };

  const visibility = string().default("PUBLIC");

  return router({
    profile: router(
      {
        me: query(
          {
            description:
              "The connected member: sub (the member id; the person URN is urn:li:person:<sub>), name, given and family name, picture, locale and email when granted.",
            input: object({}),
          },
          async () => call("/v2/userinfo"),
        ),
      },
      { title: "Profile", description: "The connected LinkedIn member." },
    ),
    posts: router(
      {
        create: mutation(
          {
            description:
              "Publish a post. author is a person URN (urn:li:person:<sub from profile.me>). Optionally attach an article link (articleUrl, with articleTitle and articleDescription), an image or video (mediaUrn from images.initializeUpload or videos.initializeUpload, uploaded already), or reshare an existing post (reshareUrn). visibility is PUBLIC, CONNECTIONS or LOGGED_IN. Returns the new post URN as id.",
            input: object({
              author: urn,
              commentary: string(),
              visibility,
              articleUrl: string().optional(),
              articleTitle: string().optional(),
              articleDescription: string().optional(),
              mediaUrn: string().optional(),
              mediaTitle: string().optional(),
              mediaAltText: string().optional(),
              reshareUrn: string().optional(),
            }),
          },
          async (_ctx, input) => {
            const content = input.articleUrl
              ? {
                  article: {
                    source: input.articleUrl,
                    title: input.articleTitle ?? input.articleUrl,
                    ...(input.articleDescription ? { description: input.articleDescription } : {}),
                  },
                }
              : input.mediaUrn
                ? {
                    media: {
                      id: input.mediaUrn,
                      ...(input.mediaTitle ? { title: input.mediaTitle } : {}),
                      ...(input.mediaAltText ? { altText: input.mediaAltText } : {}),
                    },
                  }
                : undefined;
            return call("/rest/posts", {
              method: "POST",
              body: {
                author: input.author,
                commentary: input.commentary,
                visibility: input.visibility,
                distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
                lifecycleState: "PUBLISHED",
                isReshareDisabledByAuthor: false,
                ...(content ? { content } : {}),
                ...(input.reshareUrn ? { reshareContext: { parent: input.reshareUrn } } : {}),
              },
            });
          },
        ),
        get: query(
          {
            description: "Get a post by URN (urn:li:share:<id> or urn:li:ugcPost:<id>). Needs the r_member_social permission, which LinkedIn grants only to approved apps.",
            input: object({ post: urn }),
          },
          async (_ctx, { post }) => call(`/rest/posts/${enc(post)}`),
        ),
        update: mutation(
          {
            description: "Change the text of one of your posts.",
            input: object({ post: urn, commentary: string() }),
          },
          async (_ctx, { post, commentary }) =>
            call(`/rest/posts/${enc(post)}`, {
              method: "POST",
              restliMethod: "PARTIAL_UPDATE",
              body: { patch: { $set: { commentary } } },
            }),
        ),
        delete: mutation(
          { description: "Delete one of your posts.", input: object({ post: urn }) },
          async (_ctx, { post }) => call(`/rest/posts/${enc(post)}`, { method: "DELETE", restliMethod: "DELETE" }),
        ),
      },
      { title: "Posts", description: "Publish, edit and delete posts." },
    ),
    media: router(
      {
        initializeImageUpload: mutation(
          {
            description:
              "Reserve an image upload for a person URN. Returns uploadUrl (send the image bytes to it with a PUT) and the image URN to pass to posts.create as mediaUrn.",
            input: object({ owner: urn }),
          },
          async (_ctx, { owner }) =>
            call("/rest/images", { method: "POST", search: { action: "initializeUpload" }, body: { initializeUploadRequest: { owner } } }),
        ),
        initializeVideoUpload: mutation(
          {
            description:
              "Reserve a video upload for a person URN. fileSizeBytes is the exact size in bytes (a positive integer). Returns upload instructions and the video URN; finish with media.finalizeVideoUpload.",
            input: object({ owner: urn, fileSizeBytes: number() }),
          },
          async (_ctx, { owner, fileSizeBytes }) => {
            if (!Number.isInteger(fileSizeBytes) || fileSizeBytes < 1) throw new Error("fileSizeBytes must be a positive integer");
            return call("/rest/videos", {
              method: "POST",
              search: { action: "initializeUpload" },
              body: {
                initializeUploadRequest: {
                  owner,
                  fileSizeBytes,
                  uploadCaptions: false,
                  uploadThumbnail: false,
                },
              },
            });
          },
        ),
        finalizeVideoUpload: mutation(
          {
            description: "Complete a video upload with the video URN and the ETag of each uploaded part (uploadedPartIds).",
            input: object({ video: urn, uploadToken: string().default(""), uploadedPartIds: array(string()) }),
          },
          async (_ctx, { video, uploadToken, uploadedPartIds }) =>
            call("/rest/videos", {
              method: "POST",
              search: { action: "finalizeUpload" },
              body: { finalizeUploadRequest: { video, uploadToken, uploadedPartIds } },
            }),
        ),
        getVideo: query(
          { description: "Look up an uploaded video by URN (urn:li:video:<id>): processing status and download URL.", input: object({ video: urn }) },
          async (_ctx, { video }) => call(`/rest/videos/${enc(video)}`),
        ),
      },
      { title: "Media", description: "Reserve and inspect image and video uploads for posts." },
    ),
    raw: router(
      {
        get: query(
          {
            description:
              "GET any LinkedIn REST path the other tools do not cover, for example /rest/posts or /v2/me. Works only with permissions the app was granted.",
            input: object({ path: string({ minLength: 1 }) }),
          },
          async (_ctx, { path }) => {
            if (!/^\/(rest|v2)\//.test(path)) throw new Error("path must start with /rest/ or /v2/");
            const [pathname, queryString] = path.split("?", 2);
            const search: Search = {};
            for (const [key, value] of new URLSearchParams(queryString ?? "")) search[key] = value;
            return call(pathname!, { search });
          },
        ),
      },
      { title: "Raw", description: "Read other LinkedIn REST endpoints." },
    ),
  });
}

export default defineApp({ user: { accounts: { linkedin: linkedin.many() } }, icons }, async ({ user, fetch, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.linkedin ?? [],
      (account) =>
        withApprovals(tools(account.fields.access_token, fetch, signal), (tool) =>
          tool.kind === "mutation" ? always() : undefined,
        ),
      { signal },
    ),
    {
      title: "LinkedIn",
      description: "Publish, edit and delete LinkedIn posts as the connected member, reserve image and video uploads, and read the member profile.",
      icons,
    },
  ),
}));
