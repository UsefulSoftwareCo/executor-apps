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

const base = "https://app.planly.com";

const planly = defineProvider({
  name: "Planly",
  hosts: ["app.planly.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing the teams the key belongs to is read-only and needs no team id.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/api/teams/list`, {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ data: array(object({ id: string() })) }));
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, body?: unknown, search?: Record<string, string>, method = "POST") => {
    const query = search ? `?${new URLSearchParams(search)}` : "";
    const response = await fetcher(`${base}${path}${query}`, {
      method,
      signal,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return decodeJson(response, json());
  };
}

const Pagination = object({
  cursor: string().optional(),
  orderBy: array(string()).optional(),
  pageSize: number().optional(),
});

const paginationHelp =
  "Omit pagination.cursor for the first page; afterwards pagination.cursor is the `next` value of the previous page; orderBy is [\"CreatedAt\" | \"ContentLength\", \"asc\" | \"desc\"]; pageSize defaults to 50.";

const ScheduleInput = object({
  channelId: string({ minLength: 1 }),
  content: string().optional(),
  media: array(object({ id: string({ minLength: 1 }), options: json().optional() })).optional(),
  options: json().optional(),
});

function build(call: ReturnType<typeof client>) {
  return router({
    teams: router(
      {
        list: query(
          { description: "List every team the authenticated user belongs to, with role, user count and channel count.", input: object({}) },
          async () => call("/api/teams/list"),
        ),
        get: query(
          {
            description: "Get a team's details, including permissions, limits, member and channel counts and integrations.",
            input: object({ id: string({ minLength: 1 }) }),
          },
          async (_ctx, { id }) => call("/api/v2/team/get", { id }),
        ),
        users: query(
          {
            description: "List a team's members with id, name, picture, email and role.",
            input: object({ teamId: string({ minLength: 1 }) }),
          },
          async (_ctx, { teamId }) => call("/api/v2/team/users", { id: teamId }),
        ),
        create: mutation(
          { description: "Create a new team. Returns the new teamId.", input: object({ name: string({ minLength: 1 }) }) },
          async (_ctx, { name }) => call("/api/v2/team/create", { name }),
        ),
        edit: mutation(
          {
            description: "Rename a team.",
            input: object({ teamId: string({ minLength: 1 }), name: string({ minLength: 1 }) }),
          },
          async (_ctx, { teamId, name }) => call("/api/v2/team/edit", { teamId, name }),
        ),
        delete: mutation(
          { description: "Permanently delete a team by id.", input: object({ id: string({ minLength: 1 }) }) },
          async (_ctx, { id }) => call("/api/v2/team/delete", undefined, { id }),
        ),
        transferOwnership: mutation(
          {
            description: "Transfer a team's ownership to another member.",
            input: object({ teamId: string({ minLength: 1 }), userId: string({ minLength: 1 }) }),
          },
          async (_ctx, { teamId, userId }) => call("/api/v2/team/transfer-ownership", { teamId, userId }),
        ),
        removeUser: mutation(
          {
            description: "Remove a user from a team.",
            input: object({ teamId: string({ minLength: 1 }), userId: string({ minLength: 1 }) }),
          },
          async (_ctx, { teamId, userId }) => call("/api/v2/team/users/remove", { teamId, userId }),
        ),
      },
      { title: "Teams", description: "Teams own channels, media and schedules. Most other tools need a teamId from teams.list." },
    ),
    channels: router(
      {
        list: query(
          {
            description:
              "List a team's connected social channels with name, picture, social_network, status and scopes. Channel ids are needed to schedule posts.",
            input: object({ teamId: string({ minLength: 1 }), excludeCompetitors: boolean().optional() }),
          },
          async (_ctx, { teamId, excludeCompetitors }) =>
            call("/api/v2/channels/list", { team_id: teamId, excludeCompetitors }),
        ),
        pinterestBoards: query(
          {
            description: "List the boards of a connected Pinterest channel. Pinterest posts need a boardId from here when published.",
            input: object({ channelId: string({ minLength: 1 }) }),
          },
          async (_ctx, { channelId }) => call(`/api/v2/pinterest/get-board-list/${encodeURIComponent(channelId)}`),
        ),
        delete: mutation(
          {
            description: "Delete (disconnect) a channel by id. Its scheduled posts are affected.",
            input: object({ id: string({ minLength: 1 }) }),
          },
          // Planly documents this endpoint as GET, unlike the rest of the API.
          async (_ctx, { id }) => call("/api/v2/channels/delete", undefined, { id }, "GET"),
        ),
      },
      { title: "Channels", description: "Connected social accounts (Instagram, TikTok, X, LinkedIn, YouTube and more)." },
    ),
    media: router(
      {
        list: query(
          {
            description: `List a team's media files with cursor pagination. ${paginationHelp}`,
            input: object({ teamId: string({ minLength: 1 }), pagination: Pagination.optional() }),
          },
          async (_ctx, { teamId, pagination }) => call("/api/v2/media/list", { teamId, pagination }),
        ),
        importFromUrl: mutation(
          {
            description: "Import a video/mp4, image/png, image/jpeg or image/webp file from a public URL into a team's media library.",
            input: object({ teamId: string({ minLength: 1 }), url: string({ minLength: 1 }) }),
          },
          async (_ctx, { teamId, url }) => call("/api/v2/media/import-from-url", { teamId, url }),
        ),
        startUpload: mutation(
          {
            description:
              "Start a direct upload. Returns mediaId and a pre-signed uploadUrl; PUT the file bytes to it with the returned headers, then call media.finishUpload. contentLength is validated against the upload. Provide contentType or fileName (contentType wins). For files reachable by URL prefer media.importFromUrl.",
            input: object({
              teamId: string({ minLength: 1 }),
              contentLength: number(),
              contentType: string().optional(),
              fileName: string().optional(),
            }),
          },
          async (_ctx, input) => {
            if (input.contentType === undefined && input.fileName === undefined) {
              throw new Error("media.startUpload needs contentType or fileName");
            }
            return call("/api/v2/media/start-upload", input);
          },
        ),
        finishUpload: mutation(
          {
            description: "Finalize an upload after the PUT to the pre-signed URL finished. Returns the media metadata.",
            input: object({ mediaId: string({ minLength: 1 }) }),
          },
          async (_ctx, { mediaId }) => call("/api/v2/media/finish-upload", { mediaId }),
        ),
        delete: mutation(
          { description: "Delete media files by id.", input: object({ ids: array(string({ minLength: 1 })) }) },
          async (_ctx, { ids }) => call("/api/v2/media/delete", { ids }),
        ),
      },
      { title: "Media", description: "A team's media library." },
    ),
    schedules: router(
      {
        list: query(
          {
            description: `List a team's schedules (one per channel post). ${paginationHelp}`,
            input: object({ teamId: string({ minLength: 1 }), pagination: Pagination.optional() }),
          },
          async (_ctx, { teamId, pagination }) => call("/api/v2/schedules/list", { teamId, pagination }),
        ),
        create: mutation(
          {
            description:
              "Schedule posts on one or more channels. Each item needs channelId and may set publishOn (ISO 8601; omitted means publish immediately), content, media [{id}] and network-specific options (e.g. Instagram postType 0=post 2=story; TikTok privacyLevel is required; Pinterest boardId; YouTube title/privacyStatus; Twitter threads). Always created as scheduled; use scheduleGroups.upsert for drafts.",
            input: object({
              schedules: array(
                object({
                  channelId: string({ minLength: 1 }),
                  publishOn: string().optional(),
                  content: string().optional(),
                  media: array(object({ id: string({ minLength: 1 }), options: json().optional() })).optional(),
                  options: json().optional(),
                }),
              ),
            }),
          },
          async (_ctx, { schedules }) => call("/api/v2/schedules/create", { schedules }),
        ),
      },
      { title: "Schedules", description: "Individual scheduled posts." },
    ),
    scheduleGroups: router(
      {
        list: query(
          {
            description: `List schedule groups (a post across several channels). Filter by ids, channels, status (0 draft, 1 scheduled, 3 published, 4 failed), socialNetworks, mediaType (0 image, 1 video) and a dateRange. ${paginationHelp}`,
            input: object({
              teamId: string({ minLength: 1 }),
              ids: array(string()).optional(),
              filter: object({
                channels: array(string()).optional(),
                status: array(number()).optional(),
                socialNetworks: array(string()).optional(),
                mediaType: array(number()).optional(),
              }).optional(),
              dateRange: object({ since: string().optional(), until: string().optional() }).optional(),
              pagination: Pagination.optional(),
            }),
          },
          async (_ctx, input) => call("/api/v2/schedule-groups/list", input),
        ),
        upsert: mutation(
          {
            description:
              "Create or update schedule groups. A group with an id is updated, without one it is created. status is draft or scheduled (default scheduled); publishOn omitted means publish immediately. Set validateOnly to check without saving.",
            input: object({
              teamId: string({ minLength: 1 }),
              validateOnly: boolean().optional(),
              scheduleGroups: array(
                object({
                  id: string().optional(),
                  publishOn: string().optional(),
                  status: string().optional(),
                  schedules: array(ScheduleInput),
                }),
              ),
            }),
          },
          async (_ctx, input) => call("/api/v2/schedule-groups/create", input),
        ),
        delete: mutation(
          {
            description: "Delete schedule groups by id, including all schedules inside them.",
            input: object({ ids: array(string({ minLength: 1 })) }),
          },
          async (_ctx, { ids }) => call("/api/v2/schedule-groups/delete", { ids }),
        ),
      },
      { title: "Schedule groups", description: "A post scheduled together on several channels, with draft support." },
    ),
    ai: router(
      {
        credits: query(
          {
            description: "Get how many AI credits a team has left.",
            input: object({ teamId: string({ minLength: 1 }) }),
          },
          async (_ctx, { teamId }) => call("/api/v2/ai/credits", undefined, { teamId }, "GET"),
        ),
        complete: mutation(
          {
            description: "Generate n text completions from a prompt for a team. Spends AI credits.",
            input: object({ teamId: string({ minLength: 1 }), prompt: string({ minLength: 1 }), n: number() }),
          },
          async (_ctx, input) => call("/api/v2/ai/complete", input),
        ),
      },
      { title: "AI", description: "Planly's AI text generation." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { planly: planly.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.planly ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Planly",
        description: "Schedule social media posts with Planly: teams, channels, media, schedules, schedule groups and AI text.",
        icons,
      },
    ),
  }),
);
