import {
  accountRouter,
  array,
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

const base = "https://api.spotlightr.com";

const spotlightr = defineProvider({
  name: "Spotlightr",
  hosts: ["api.spotlightr.com"],
  auth: {
    apiKey: secrets({
      label: "API key (vooKey)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const url = new URL(`${base}/api/user/domain`);
    url.searchParams.set("vooKey", account.fields.token);
    const response = await fetch(url.toString(), { signal });
    if (!response.ok) throw new Error(`Spotlightr rejected the API key (${response.status})`);
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | undefined>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const clean = (params: Params) => {
    const out = new URLSearchParams({ vooKey: token });
    for (const [k, v] of Object.entries(params)) if (v !== undefined) out.set(k, String(v));
    return out;
  };
  return {
    get: async (path: string, params: Params = {}) =>
      decodeJson(await fetcher(`${base}${path}?${clean(params)}`, { signal }), json()),
    post: async (path: string, params: Params = {}) =>
      decodeJson(
        await fetcher(`${base}${path}`, {
          method: "POST",
          signal,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: clean(params),
        }),
        json(),
      ),
  };
}

function build({ get, post }: ReturnType<typeof client>) {
  return router({
    videos: router(
      {
        list: query(
          {
            description: "List videos in the account, optionally one video by videoID or the videos of one project (videoGroup).",
            input: object({ videoID: number().optional(), videoGroup: number().optional() }),
          },
          async (_c, i) => get("/api/videos", i),
        ),
        createFromUrl: mutation(
          {
            description:
              "Create a linked video from a URL (YouTube, Vimeo, Google Drive, Dropbox...). customS3 is 0 or the ID of a custom storage integration. playerSettings is the ID of one of your own videos to copy player settings from. File upload is not supported by this tool.",
            input: object({
              name: string({ minLength: 1 }),
              url: string({ minLength: 1 }),
              customS3: number(),
              hls: number().optional(),
              videoGroup: number().optional(),
              playerSettings: string().optional(),
            }),
          },
          async (_c, i) =>
            post("/api/createVideo", {
              name: i.name,
              URL: i.url,
              customS3: i.customS3,
              hls: i.hls,
              videoGroup: i.videoGroup,
              playerSettings: i.playerSettings,
              create: 1,
            }),
        ),
        setSource: mutation(
          {
            description: "Replace the source of an existing video with a new URL.",
            input: object({ id: number(), url: string({ minLength: 1 }) }),
          },
          async (_c, i) => get("/api/videoSource", { id: i.id, URL: i.url }),
        ),
        updatePlayerSettings: mutation(
          {
            description:
              "Update individual player settings of a video. id is the decoded (numeric) video ID; settings is a JSON object string with only the keys to change, e.g. {\"alwaysVisibleControls\":true}. Assumption: the vendor documents settings as a JSON object but not the body encoding or the valid keys, so it is sent as a JSON string in a form field; the example keys come from the vendor JavaScript player API and are not confirmed for this endpoint.",
            input: object({ id: number(), settings: string({ minLength: 2 }) }),
          },
          async (_c, i) => post("/video/updateSettings", { id: i.id, settings: i.settings }),
        ),
      },
      { title: "Videos", description: "Create, list, re-source and configure videos." },
    ),
    projects: router(
      {
        list: query({ description: "List projects (groups) that organize videos.", input: object({}) }, async () =>
          get("/groups"),
        ),
        create: mutation(
          { description: "Create a project (group).", input: object({ name: string({ minLength: 1 }) }) },
          async (_c, i) => post("/groups", { name: i.name }),
        ),
      },
      { title: "Projects", description: "Projects (groups) that hold videos." },
    ),
    analytics: router(
      {
        topVideos: query(
          {
            description: "Top videos over a reporting window. days defaults to 30, total (number of videos) to 3.",
            input: object({ days: number().optional(), total: number().optional() }),
          },
          async (_c, i) => get("/api/getTopVideos", i),
        ),
        videoMetrics: query(
          {
            description: "Aggregate metrics for a video: loads, plays, play rate, percent watched, completion rate, shares.",
            input: object({ videoID: number() }),
          },
          async (_c, i) => get("/api/video/metrics", i),
        ),
        // Vendor table types onlyWatched/allViews as bool ("true | false"); we send 1, matching the vendor examples.
        views: query(
          {
            description:
              "Individual views of a video. customViewerID filters to one known viewer (ID or email); onlyWatched=1 keeps views with percentWatched over 1; allViews=1 disables data pagination (the vendor documents no page/limit parameters, so without it the response may be paginated).",
            input: object({
              videoID: number(),
              customViewerID: string().optional(),
              onlyWatched: number().optional(),
              allViews: number().optional(),
            }),
          },
          async (_c, i) => get("/api/views/getViews", i),
        ),
        search: query(
          { description: "Search everything in the account (videos, projects, courses).", input: object({}) },
          async () => post("/search/global"),
        ),
      },
      { title: "Analytics", description: "Video metrics, views, top videos and account search." },
    ),
    domains: router(
      {
        list: query({ description: "List whitelisted domains allowed to embed videos.", input: object({}) }, async () =>
          get("/api/user/domain"),
        ),
        add: mutation(
          { description: "Whitelist a domain (e.g. example.com) for embedding.", input: object({ domain: string({ minLength: 3 }) }) },
          async (_c, i) => post("/api/user/domain", { domain: i.domain }),
        ),
      },
      { title: "Domains", description: "Domains whitelisted to embed videos." },
    ),
    courses: router(
      {
        createStudent: mutation(
          {
            description:
              "Create a course or gallery student. never is 0 or 1 (never expires); unlocks and time are 0 or any number; expires is 0000-00-00 or YYYY-MM-DD.",
            input: object({
              email: string({ minLength: 3 }),
              password: string({ minLength: 1 }),
              id: number(),
              never: number(),
              unlocks: number(),
              time: number(),
              expires: string({ minLength: 1 }),
            }),
          },
          async (_c, i) => post("/spotlight/students", i),
        ),
        getAccess: query(
          {
            description: "Get a student's access record for a course.",
            input: object({ email: string({ minLength: 3 }), courseId: number() }),
          },
          async (_c, i) => get("/access", { email: i.email, "Course ID": i.courseId }),
        ),
        expireAccess: mutation(
          { description: "Expire a student's access record.", input: object({ id: number() }) },
          async (_c, i) => post("/access", { id: i.id, expire: 1 }),
        ),
        expireCode: mutation(
          { description: "Expire a gallery access code.", input: object({ id: number() }) },
          async (_c, i) => post("/spotlight/updateCode", { id: i.id, expires: 1 }),
        ),
      },
      { title: "Courses", description: "Course and gallery students, access records and codes." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { spotlightr: spotlightr.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.spotlightr ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Spotlightr",
        description: "Manage Spotlightr video hosting: videos, projects, analytics, player settings, domains and course access.",
        icons,
      },
    ),
  }),
);
