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

const base = "https://open.tiktokapis.com/v2";

const tiktok = defineProvider({
  name: "TikTok",
  hosts: ["open.tiktokapis.com"],
  auth: {
    // TikTok's OAuth uses client_key (not client_id) in the authorize URL and token request, which the framework's
    // OAuth flow cannot send, so the user access token is entered directly.
    accessToken: secrets({
      label: "User access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/user/info/?fields=open_id`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const body = await decodeJson(response, object({ data: object({ user: object({ open_id: string() }) }) }));
    return { accountInfo: { externalId: body.data.user.open_id } };
  },
});

type Fetch = typeof fetch;

const userFields = "open_id,union_id,avatar_url,avatar_url_100,avatar_large_url,display_name";
const videoFields = "id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count";

const privacy = string({ minLength: 1 });

function tools(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (path: string, init: { method?: string; search?: Record<string, string>; body?: unknown } = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(init.search ?? {})) url.searchParams.set(key, value);
    const response = await fetcher(url.toString(), {
      method: init.method ?? "GET",
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(init.body === undefined ? {} : { "content-type": "application/json; charset=UTF-8" }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    // TikTok sends {data, error: {code: "ok", ...}}; non-"ok" codes accompany an HTTP error status.
    const text = await response.text();
    let result: unknown;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(`TikTok returned HTTP ${response.status}: ${text.slice(0, 300)}`);
    }
    const error = (result as { error?: { code?: string; message?: string; log_id?: string } })?.error;
    if (!response.ok || (error?.code && error.code !== "ok"))
      throw new Error(`TikTok error ${error?.code ?? response.status}: ${error?.message ?? "request failed"} (log_id ${error?.log_id ?? "unknown"})`);
    return (result as { data?: unknown }).data ?? null;
  };

  const pick = (value: string | undefined, fallback: string) => value ?? fallback;

  return {
    user: router(
      {
        info: query(
          {
            description:
              "The authorized user's profile. fields is a comma-separated list; basic: open_id, union_id, avatar_url, avatar_url_100, avatar_large_url, display_name (scope user.info.basic); profile: bio_description, profile_deep_link, is_verified, username (user.info.profile); stats: follower_count, following_count, likes_count, video_count (user.info.stats). Defaults to the basic fields only; profile and stats fields are opt-in and need their scopes to have been granted.",
            input: object({ fields: string().optional() }),
          },
          async (_ctx, input: { fields?: string }) => call("/user/info/", { search: { fields: pick(input.fields, userFields) } }),
        ),
      },
      { title: "User", description: "The authorized TikTok user's profile and stats." },
    ),
    videos: router(
      {
        list: query(
          {
            description:
              "List the authorized user's public videos, newest first (scope video.list). Pass the returned cursor for the next page. max_count is 1 to 20.",
            input: object({ fields: string().optional(), cursor: number().optional(), max_count: number().optional() }),
          },
          async (_ctx, input: { fields?: string; cursor?: number; max_count?: number }) =>
            call("/video/list/", {
              method: "POST",
              search: { fields: pick(input.fields, videoFields) },
              body: { cursor: input.cursor, max_count: input.max_count ?? 20 },
            }),
        ),
        get: query(
          {
            description: "Fetch details and metrics for up to 20 of the authorized user's videos by id (scope video.list).",
            input: object({ video_ids: array(string({ minLength: 1 })), fields: string().optional() }),
          },
          async (_ctx, input: { video_ids: readonly string[]; fields?: string }) =>
            call("/video/query/", {
              method: "POST",
              search: { fields: pick(input.fields, videoFields) },
              body: { filters: { video_ids: input.video_ids } },
            }),
        ),
      },
      { title: "Videos", description: "The authorized user's published videos." },
    ),
    publish: router(
      {
        creatorInfo: query(
          {
            description:
              "Creator's posting options before publishing (scope video.publish or video.upload): allowed privacy_level_options, comment/duet/stitch availability and max video duration. Call this before direct posting; privacy_level must be one of the returned options.",
            input: object({}),
          },
          async () => call("/post/publish/creator_info/query/", { method: "POST", body: {} }),
        ),
        status: query(
          {
            description: "Status of a publish started with this app, by publish_id. Statuses include PROCESSING_DOWNLOAD, PROCESSING_UPLOAD, SEND_TO_USER_INBOX, PUBLISH_COMPLETE and FAILED (with fail_reason).",
            input: object({ publish_id: string({ minLength: 1 }) }),
          },
          async (_ctx, input: { publish_id: string }) => call("/post/publish/status/fetch/", { method: "POST", body: { publish_id: input.publish_id } }),
        ),
        videoFromUrl: mutation(
          {
            description:
              "Publish a video to the user's TikTok directly from a URL (scope video.publish). The URL's domain or URL prefix must be verified in the TikTok developer portal. Content from unaudited apps is restricted to private viewing. privacy_level must be one of the privacy_level_options from publish.creatorInfo. Returns a publish_id; poll publish.status.",
            input: object({
              video_url: string({ minLength: 1 }),
              title: string().optional(),
              privacy_level: privacy,
              disable_duet: boolean().optional(),
              disable_comment: boolean().optional(),
              disable_stitch: boolean().optional(),
              video_cover_timestamp_ms: number().optional(),
              brand_content_toggle: boolean().optional(),
              brand_organic_toggle: boolean().optional(),
              is_aigc: boolean().optional(),
            }),
          },
          async (_ctx, input) => {
            const { video_url, ...post_info } = input;
            return call("/post/publish/video/init/", {
              method: "POST",
              body: { post_info, source_info: { source: "PULL_FROM_URL", video_url } },
            });
          },
        ),
        videoToInbox: mutation(
          {
            description:
              "Send a video from a URL to the user's TikTok inbox as a draft they finish in the app (scope video.upload). The URL's domain or prefix must be verified in the developer portal. Returns a publish_id.",
            input: object({ video_url: string({ minLength: 1 }) }),
          },
          async (_ctx, input: { video_url: string }) =>
            call("/post/publish/inbox/video/init/", {
              method: "POST",
              body: { source_info: { source: "PULL_FROM_URL", video_url: input.video_url } },
            }),
        ),
        photos: mutation(
          {
            description:
              "Publish a photo post (or carousel) from image URLs. post_mode DIRECT_POST publishes (scope video.publish; privacy_level required); MEDIA_UPLOAD sends a draft to the inbox (scope video.upload). DIRECT_POST requires privacy_level (one of publish.creatorInfo's privacy_level_options), brand_content_toggle and brand_organic_toggle; auto_add_music and privacy_level are Direct Post only and are ignored for MEDIA_UPLOAD. post_mode must be exactly DIRECT_POST or MEDIA_UPLOAD. Up to 35 JPEG or WEBP images on verified domains. Returns a publish_id.",
            input: object({
              post_mode: string({ minLength: 1 }),
              photo_images: array(string({ minLength: 1 })),
              photo_cover_index: number().optional(),
              title: string().optional(),
              description: string().optional(),
              privacy_level: string().optional(),
              disable_comment: boolean().optional(),
              auto_add_music: boolean().optional(),
              brand_content_toggle: boolean().optional(),
              brand_organic_toggle: boolean().optional(),
            }),
          },
          async (_ctx, input) => {
            const { post_mode, photo_images, photo_cover_index, ...rest } = input;
            if (post_mode !== "DIRECT_POST" && post_mode !== "MEDIA_UPLOAD") throw new Error("post_mode must be DIRECT_POST or MEDIA_UPLOAD");
            let post_info: Record<string, unknown> = rest;
            if (post_mode === "DIRECT_POST") {
              if (!rest.privacy_level) throw new Error("privacy_level is required for DIRECT_POST");
              if (rest.brand_content_toggle === undefined || rest.brand_organic_toggle === undefined)
                throw new Error("brand_content_toggle and brand_organic_toggle are required for DIRECT_POST");
            } else {
              const { privacy_level: _p, auto_add_music: _a, ...inbox } = rest;
              post_info = inbox;
            }
            return call("/post/publish/content/init/", {
              method: "POST",
              body: {
                post_info,
                source_info: { source: "PULL_FROM_URL", photo_cover_index: photo_cover_index ?? 0, photo_images },
                post_mode,
                media_type: "PHOTO",
              },
            });
          },
        ),
      },
      { title: "Publish", description: "Content Posting API: post videos and photos, or send them to the inbox as drafts." },
    ),
    api: router(
      {
        get: query(
          {
            description: "GET any other open.tiktokapis.com/v2 path, e.g. /research/... or /user/info/. query holds URL parameters.",
            input: object({ path: string({ minLength: 1 }), query: json().optional() }),
          },
          async (_ctx, input: { path: string; query?: unknown }) =>
            call(input.path.startsWith("/") ? input.path : `/${input.path}`, {
              search: Object.fromEntries(Object.entries((input.query ?? {}) as Record<string, unknown>).map(([k, v]) => [k, String(v)])),
            }),
        ),
        post: mutation(
          {
            description: "POST any other open.tiktokapis.com/v2 path with a JSON body.",
            input: object({ path: string({ minLength: 1 }), query: json().optional(), body: json().optional() }),
          },
          async (_ctx, input: { path: string; query?: unknown; body?: unknown }) =>
            call(input.path.startsWith("/") ? input.path : `/${input.path}`, {
              method: "POST",
              search: Object.fromEntries(Object.entries((input.query ?? {}) as Record<string, unknown>).map(([k, v]) => [k, String(v)])),
              body: input.body ?? {},
            }),
        ),
      },
      { title: "API", description: "Raw access to other TikTok v2 API paths." },
    ),
  };
}

export default defineApp({ user: { accounts: { tiktok: tiktok.many() } }, icons }, async ({ user, fetch, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.tiktok ?? [],
      (account) =>
        withApprovals(router(tools(account.fields.token, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
      { signal },
    ),
    {
      title: "TikTok",
      description: "TikTok profile and stats, the user's videos, and posting videos and photos (Display and Content Posting APIs).",
      icons,
    },
  ),
}));
