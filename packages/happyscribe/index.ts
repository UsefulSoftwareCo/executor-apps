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
  oauth2,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://www.happyscribe.com/api/v1";
const mcpUrl = "https://www.happyscribe.com/mcp";

const happyscribe = defineProvider({
  name: "Happy Scribe",
  hosts: ["www.happyscribe.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // OAuth applies only to the MCP endpoint; the REST API takes the API key.
    oauth: oauth2({ discover: "https://www.happyscribe.com" }),
  },
  async health(check) {
    if (check.account.method === "oauth") {
      return mcpHealth(check, {
        url: mcpUrl,
        headers: { Authorization: `Bearer ${check.account.fields.access_token}` },
      });
    }
    const { account, fetch, signal } = check;
    const response = await fetch(`${base}/organizations`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({ organizations: array(object({ id: number() })) }));
  },
});

type Account = { fields: { token: string } };
type Params = Record<string, string | number | boolean | undefined>;

const search = (params: Params) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

// Happy Scribe answers some calls (membership removal) with 204 and no body.
const send = async (
  fetch: typeof globalThis.fetch,
  account: Account,
  signal: AbortSignal,
  method: string,
  path: string,
  options: { query?: Params; body?: unknown } = {},
) => {
  const response = await fetch(`${base}${path}${search(options.query ?? {})}`, {
    method,
    signal,
    headers: {
      Authorization: `Bearer ${account.fields.token}`,
      Accept: "application/json",
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });
  if (response.status === 204) return { ok: true };
  return decodeJson(response, json());
};

const compact = <T extends Record<string, unknown>>(value: T) =>
  Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));

const happyscribeTools = (account: Account, signal: AbortSignal) =>
  router({
    organizations: router(
      {
        list: query(
          {
            description:
              "List the workspaces (organizations) the API key's user belongs to, with id, name and role. Most other tools need an organization id from here.",
            input: object({}),
          },
          async ({ fetch }) => send(fetch, account, signal, "GET", "/organizations"),
        ),
        memberships: router({
          list: query(
            {
              description:
                "List workspace memberships (25 per page, page from 1). Filter by organizationId, role (owner, admin, member, guest), or partial email or name. Regular members only see their own row.",
              input: object({
                organizationId: number().optional(),
                role: string().optional(),
                email: string().optional(),
                name: string().optional(),
                page: number().optional(),
              }),
            },
            async ({ fetch }, { organizationId, ...rest }) =>
              send(fetch, account, signal, "GET", "/organization_memberships", {
                query: { organization_id: organizationId, ...rest },
              }),
          ),
          add: mutation(
            {
              description:
                "Add a user to a workspace by email (owner or admin only). An existing Happy Scribe user becomes a member at once (201); a new email gets an invitation (202). role is admin or member.",
              input: object({ organizationId: number(), email: string(), role: string() }),
              approval: always(),
            },
            async ({ fetch }, { organizationId, email, role }) =>
              send(fetch, account, signal, "POST", "/organization_memberships", {
                body: { organization_id: organizationId, email, role },
              }),
          ),
          updateRole: mutation(
            {
              description: "Change a membership's role to admin or member (owner or admin only).",
              input: object({ membershipId: number(), role: string() }),
              approval: always(),
            },
            async ({ fetch }, { membershipId, role }) =>
              send(fetch, account, signal, "PATCH", `/organization_memberships/${membershipId}`, { body: { role } }),
          ),
          remove: mutation(
            {
              description: "Remove a member from a workspace (owner or admin only). The owner cannot be removed.",
              input: object({ membershipId: number() }),
              approval: always(),
            },
            async ({ fetch }, { membershipId }) =>
              send(fetch, account, signal, "DELETE", `/organization_memberships/${membershipId}`),
          ),
        }),
      },
    ),
    glossaries: router({
      list: query(
        {
          description:
            "List the glossaries of a workspace. Glossary ids can be passed as glossaryIds when creating orders.",
          input: object({ organizationId: number() }),
        },
        async ({ fetch }, { organizationId }) =>
          send(fetch, account, signal, "GET", "/glossaries", { query: { organization_id: organizationId } }),
      ),
    }),
    styleGuides: router({
      list: query(
        {
          description:
            "List the style guides of a workspace (transcription or subtitles). Style guide ids can be passed as styleGuideId when creating orders.",
          input: object({ organizationId: number() }),
        },
        async ({ fetch }, { organizationId }) =>
          send(fetch, account, signal, "GET", "/style_guides", { query: { organization_id: organizationId } }),
      ),
    }),
    uploads: router({
      signedUrl: query(
        {
          description:
            "Get a signed S3 URL for uploading a media file. PUT the file bytes to the returned signedUrl, then pass that same URL as the url of an order.",
          input: object({ filename: string() }),
        },
        async ({ fetch }, { filename }) => send(fetch, account, signal, "GET", "/uploads/new", { query: { filename } }),
      ),
    }),
    orders: router({
      get: query(
        {
          description:
            "Retrieve an order: state (incomplete, submitted, fulfilled, failed, ...), pricing details, operations, ingestions, canBeSubmitted, and outputsIds (the resulting transcription ids) once fulfilled.",
          input: object({ orderId: string() }),
        },
        async ({ fetch }, { orderId }) => send(fetch, account, signal, "GET", `/orders/${encodeURIComponent(orderId)}`),
      ),
      createTranscription: mutation(
        {
          description:
            "Create a transcription or subtitling order from a publicly reachable media url (or an uploaded signed URL, YouTube or Vimeo link). language is a BCP-47 code (for example en-US). service is auto (machine, default) or pro (human, billed). With confirm false (default) the order stays incomplete until orders.confirm; with confirm true it is submitted and billed at once. Set isSubtitle for subtitles. Give folderId or a folder path.",
          input: object({
            url: string(),
            language: string(),
            organizationId: number(),
            service: string().optional(),
            confirm: boolean().optional(),
            folderId: number().optional(),
            folder: string().optional(),
            name: string().optional(),
            boost: boolean().optional(),
            isSubtitle: boolean().optional(),
            tags: array(string()).optional(),
            webhookUrl: string().optional(),
            glossaryIds: array(number()).optional(),
            styleGuideId: number().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, input) =>
          send(fetch, account, signal, "POST", "/orders", {
            body: {
              order: compact({
                url: input.url,
                language: input.language,
                organization_id: input.organizationId,
                service: input.service,
                confirm: input.confirm,
                folder_id: input.folderId,
                folder: input.folder,
                name: input.name,
                boost: input.boost,
                is_subtitle: input.isSubtitle,
                tags: input.tags,
                webhook_url: input.webhookUrl,
                glossary_ids: input.glossaryIds,
                style_guide_id: input.styleGuideId,
              }),
            },
          }),
      ),
      createTranslation: mutation(
        {
          description:
            "Create a translation order for an existing transcription into one or more targetLanguages (for example [\"es\", \"fr\"]). service is auto (default) or pro (human, about 3 days, billed). With confirm false (default) the order must be confirmed with orders.confirm.",
          input: object({
            sourceTranscriptionId: string(),
            targetLanguages: array(string()),
            service: string().optional(),
            confirm: boolean().optional(),
            boost: boolean().optional(),
            webhookUrl: string().optional(),
            tags: array(string()).optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, input) =>
          send(fetch, account, signal, "POST", "/orders/translation", {
            body: {
              order: compact({
                source_transcription_id: input.sourceTranscriptionId,
                target_languages: input.targetLanguages,
                service: input.service,
                confirm: input.confirm,
                boost: input.boost,
                webhook_url: input.webhookUrl,
                tags: input.tags,
              }),
            },
          }),
      ),
      confirm: mutation(
        {
          description:
            "Confirm and submit an order created with confirm false. This starts the work and the billing. Returns 409 while the media is still being ingested; retry shortly.",
          input: object({ orderId: string() }),
          approval: always(),
        },
        async ({ fetch }, { orderId }) =>
          send(fetch, account, signal, "POST", `/orders/${encodeURIComponent(orderId)}/confirm`),
      ),
    }),
    transcriptions: router({
      list: query(
        {
          description:
            "List transcriptions in a workspace, newest first (metadata only, not the transcript text; use exports.create for that). perPage is up to 100 (default 5); filter by folderId (includes subfolders) or tags.",
          input: object({
            organizationId: number(),
            folderId: number().optional(),
            page: number().optional(),
            perPage: number().optional(),
            tags: array(string()).optional(),
          }),
        },
        async ({ fetch }, { organizationId, folderId, page, perPage, tags }) => {
          const params = new URLSearchParams();
          params.set("organization_id", String(organizationId));
          if (folderId !== undefined) params.set("folder_id", String(folderId));
          if (page !== undefined) params.set("page", String(page));
          if (perPage !== undefined) params.set("per_page", String(perPage));
          for (const tag of tags ?? []) params.append("tags[]", tag);
          const response = await fetch(`${base}/transcriptions?${params.toString()}`, {
            signal,
            headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
          });
          return decodeJson(response, json());
        },
      ),
      get: query(
        {
          description:
            "Retrieve a transcription: state (automatic_done means ready), language, audio length, cost, tags, sharing state, and fresh signed audioUrl and videoUrl once transcoded. Meeting recordings include a meeting object.",
          input: object({ transcriptionId: string() }),
        },
        async ({ fetch }, { transcriptionId }) =>
          send(fetch, account, signal, "GET", `/transcriptions/${encodeURIComponent(transcriptionId)}`),
      ),
      summary: query(
        {
          description:
            "Get the AI-generated summary of a notetaker meeting recording. Answers 404 when no summary exists yet or the transcription is not a meeting recording.",
          input: object({ transcriptionId: string() }),
        },
        async ({ fetch }, { transcriptionId }) =>
          send(fetch, account, signal, "GET", `/transcriptions/${encodeURIComponent(transcriptionId)}/summary`),
      ),
      update: mutation(
        {
          description:
            "Rename a transcription, move it to another folder (folderId) in the same workspace, and/or toggle link sharing (sharingEnabled). Read publicUrl from the response to share it.",
          input: object({
            transcriptionId: string(),
            organizationId: number(),
            name: string().optional(),
            sharingEnabled: boolean().optional(),
            folderId: number().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, { transcriptionId, organizationId, name, sharingEnabled, folderId }) =>
          send(fetch, account, signal, "PATCH", `/transcriptions/${encodeURIComponent(transcriptionId)}`, {
            body: {
              transcription: compact({
                organization_id: organizationId,
                name,
                sharing_enabled: sharingEnabled,
                folder_id: folderId,
              }),
            },
          }),
      ),
      delete: mutation(
        {
          description:
            "Delete a transcription. By default it moves to the Trash; permanent true makes it irreversible. Deleting one still in progress cancels it and refunds credits, except in late pipeline states (409).",
          input: object({ transcriptionId: string(), permanent: boolean().optional() }),
          approval: always(),
        },
        async ({ fetch }, { transcriptionId, permanent }) =>
          send(fetch, account, signal, "DELETE", `/transcriptions/${encodeURIComponent(transcriptionId)}`, {
            query: { permanent },
          }),
      ),
    }),
    exports: router({
      create: mutation(
        {
          description:
            "Export one or more transcriptions as a file. format is one of txt, docx, pdf, srt, vtt, stl, avid, avid_script, avid_ds_subtitles, avid_edl, facebook_srt, html, premiere, maxqda, json, fcp, edl, csv, xlsx, mp3, mp4 (mp3 and mp4 take exactly one transcription and are ready at once). show* flags apply to txt, docx and pdf (highlights: docx and pdf). timestampsFrequency is 5s, 10s, 15s, 20s, 30s or 60s. Poll exports.get for the download_link.",
          input: object({
            format: string(),
            transcriptionIds: array(string()),
            showTimestamps: boolean().optional(),
            timestampsFrequency: string().optional(),
            showSpeakers: boolean().optional(),
            showComments: boolean().optional(),
            showHighlights: boolean().optional(),
            showHighlightsOnly: boolean().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, input) =>
          send(fetch, account, signal, "POST", "/exports", {
            body: {
              export: compact({
                format: input.format,
                transcription_ids: input.transcriptionIds,
                show_timestamps: input.showTimestamps,
                timestamps_frequency: input.timestampsFrequency,
                show_speakers: input.showSpeakers,
                show_comments: input.showComments,
                show_highlights: input.showHighlights,
                show_highlights_only: input.showHighlightsOnly,
              }),
            },
          }),
      ),
      get: query(
        {
          description:
            "Retrieve an export: state (pending, processing, ready, expired, failed) and, when ready, the download_link to fetch the file.",
          input: object({ exportId: string() }),
        },
        async ({ fetch }, { exportId }) => send(fetch, account, signal, "GET", `/exports/${encodeURIComponent(exportId)}`),
      ),
    }),
    translationTasks: router({
      create: mutation(
        {
          description:
            "Deprecated by Happy Scribe in favour of orders.createTranslation, but still available: machine-translate a finished transcription into targetLanguage (for example es). Poll translationTasks.get for translatedTranscriptionId.",
          input: object({ sourceTranscriptionId: string(), targetLanguage: string() }),
          approval: always(),
        },
        async ({ fetch }, { sourceTranscriptionId, targetLanguage }) =>
          send(fetch, account, signal, "POST", "/task/transcription_translation", {
            body: { source_transcription_id: sourceTranscriptionId, target_language: targetLanguage },
          }),
      ),
      get: query(
        {
          description:
            "Retrieve a translation task: state (initial, working, failed, done), progressPercent, failureReason and translatedTranscriptionId when done.",
          input: object({ taskId: string() }),
        },
        async ({ fetch }, { taskId }) =>
          send(fetch, account, signal, "GET", `/task/transcription_translation/${encodeURIComponent(taskId)}`),
      ),
    }),
    meetings: router({
      create: mutation(
        {
          description:
            "Send the Happy Scribe notetaker bot to a Zoom, Google Meet or Microsoft Teams call. It records, transcribes and summarises the meeting. joinAt is an optional future ISO 8601 time with UTC offset (default: join now). language is a BCP-47 code or auto. participants is a list of {email, name}. metadata is an opaque JSON object echoed back on the meeting and its webhooks. settings may include bot_name, welcome_message, recording_trigger (call_join, participant_join, participant_speak, manual), recording_mode (audio_and_video, audio_only), silence_detection, summary_language, summary_template, glossaries, destination_folder_id, access_level and send_recording_to.",
          input: object({
            organizationId: number(),
            meetingUrl: string(),
            joinAt: string().optional(),
            language: string().optional(),
            participants: array(object({ email: string().optional(), name: string().optional() })).optional(),
            metadata: json().optional(),
            settings: json().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, input) =>
          send(fetch, account, signal, "POST", "/meetings", {
            body: compact({
              organization_id: input.organizationId,
              meeting_url: input.meetingUrl,
              join_at: input.joinAt,
              language: input.language,
              participants: input.participants,
              metadata: input.metadata,
              settings: input.settings,
            }),
          }),
      ),
      get: query(
        {
          description:
            "Retrieve a notetaker meeting by its mtg_ id: status (queued, joining, in_call, processing, completed, failed, cancelled), settings, and once completed the full transcript, summary, people and companies.",
          input: object({ meetingId: string() }),
        },
        async ({ fetch }, { meetingId }) =>
          send(fetch, account, signal, "GET", `/meetings/${encodeURIComponent(meetingId)}`),
      ),
    }),
  });

export default defineApp({ user: { accounts: { happyscribe: happyscribe.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.happyscribe ?? [],
      async (account) =>
        account.method === "oauth"
          ? router({
              mcp: withApprovals(
                await mcpRouter({
                  url: mcpUrl,
                  account,
                  headers: { Authorization: `Bearer ${account.fields.access_token}` },
                  signal,
                }),
                (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
              ),
            })
          : happyscribeTools(account, signal),
      { signal },
    ),
    {
    title: "Happy Scribe",
    description:
      "Order machine or human transcription, subtitles and translation, export transcripts, send the meeting notetaker to calls, and manage glossaries, style guides and workspace members.",
    icons,
    },
  ),
}));
