// The tools, without the account: index.ts and packages/google (through scripts/google-vendor.ts) both mount them.
import {
  array,
  decodeJson,
  json,
  mutation,
  number,
  object,
  query,
  router,
  string,
} from "apps";

const base = "https://meet.googleapis.com/v2";

/** The router's metadata, shared with packages/google. */
export const meta = {
  title: "Google Meet",
  description: "Create and configure Google Meet spaces, and read meeting records, participants, recordings and transcripts.",
};

type Fetch = typeof fetch;
type Search = Record<string, string | number | undefined>;

const spaceName = string({ minLength: 1 });
const pageOnly = { pageSize: number().optional(), pageToken: string().optional() };
const paging = { ...pageOnly, filter: string().optional() };

export function tools(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (path: string, init: { method?: string; body?: unknown; search?: Search } = {}) => {
    const url = new URL(`${base}/${path}`);
    for (const [key, value] of Object.entries(init.search ?? {})) if (value !== undefined) url.searchParams.set(key, String(value));
    const response = await fetcher(url.toString(), {
      method: init.method ?? "GET",
      signal,
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    return decodeJson(response, json());
  };
  // Resource names such as "spaces/abc123" are path segments, not single values: keep the slashes.
  const path = (name: string) => name.split("/").map(encodeURIComponent).join("/");
  const list = (parent: string, collection: string, input: { pageSize?: number; pageToken?: string; filter?: string }) =>
    call(`${path(parent)}/${collection}`, { search: input });

  return router({
    spaces: router(
      {
        create: mutation(
          {
            description:
              "Create a meeting space. Optionally pass a config object (accessType OPEN | TRUSTED | RESTRICTED, entryPointAccess, moderation, attendanceReportGenerationType, artifactConfig). Returns the space including meetingUri and meetingCode.",
            input: object({ config: json().optional() }),
          },
          async (_ctx, { config }) => call("spaces", { method: "POST", body: config === undefined ? {} : { config } }),
        ),
        get: query(
          {
            description: "Get a meeting space by resource name (spaces/{id}) or by meeting code (spaces/abc-mnop-xyz).",
            input: object({ name: spaceName }),
          },
          async (_ctx, { name }) => call(path(name)),
        ),
        update: mutation(
          {
            description:
              "Update a space's config. updateMask is a comma-separated field mask such as config.accessType or config.moderation.",
            input: object({ name: spaceName, config: json(), updateMask: string() }),
          },
          async (_ctx, { name, config, updateMask }) =>
            call(path(name), { method: "PATCH", body: { config }, search: { updateMask } }),
        ),
        endActiveConference: mutation(
          {
            description: "End the active conference in a space, removing all participants.",
            input: object({ name: spaceName }),
          },
          async (_ctx, { name }) => call(`${path(name)}:endActiveConference`, { method: "POST", body: {} }),
        ),
        members: router({
          list: query(
            { description: "List members of a space (spaces/{id}).", input: object({ parent: spaceName, ...pageOnly }) },
            async (_ctx, { parent, ...rest }) => list(parent, "members", rest),
          ),
          get: query(
            { description: "Get a space member by name (spaces/{id}/members/{member}).", input: object({ name: spaceName }) },
            async (_ctx, { name }) => call(path(name)),
          ),
          create: mutation(
            {
              description:
                "Add a member to a space. member is a Member object, e.g. { user: \"users/{id}\", role: \"COHOST\" }.",
              input: object({ parent: spaceName, member: json() }),
            },
            async (_ctx, { parent, member }) => call(`${path(parent)}/members`, { method: "POST", body: member }),
          ),
          update: mutation(
            {
              description: "Update a space member, for example their role. updateMask is a comma-separated field mask.",
              input: object({ name: spaceName, member: json(), updateMask: string().optional() }),
            },
            async (_ctx, { name, member, updateMask }) =>
              call(path(name), { method: "PATCH", body: member, search: { updateMask } }),
          ),
          delete: mutation(
            { description: "Remove a member from a space.", input: object({ name: spaceName }) },
            async (_ctx, { name }) => call(path(name), { method: "DELETE" }),
          ),
          batchUpdate: mutation(
            {
              description: "Update several space members at once. requests is an array of UpdateMemberRequest objects.",
              input: object({ parent: spaceName, requests: array(json()) }),
            },
            async (_ctx, { parent, requests }) =>
              call(`${path(parent)}/members:batchUpdate`, { method: "POST", body: { requests: [...requests] } }),
          ),
        }),
      },
      { title: "Spaces", description: "Create, read and configure meeting spaces and their members." },
    ),
    conferenceRecords: router(
      {
        list: query(
          {
            description:
              "List conference records (past and ongoing meetings you can access). filter supports space.meeting_code, space.name, start_time, end_time.",
            input: object(paging),
          },
          async (_ctx, input) => call("conferenceRecords", { search: input }),
        ),
        get: query(
          { description: "Get a conference record (conferenceRecords/{id}).", input: object({ name: spaceName }) },
          async (_ctx, { name }) => call(path(name)),
        ),
        participants: router({
          list: query(
            {
              description: "List participants of a conference record (conferenceRecords/{id}).",
              input: object({ parent: spaceName, ...paging }),
            },
            async (_ctx, { parent, ...rest }) => list(parent, "participants", rest),
          ),
          get: query(
            {
              description: "Get a participant (conferenceRecords/{id}/participants/{participant}).",
              input: object({ name: spaceName }),
            },
            async (_ctx, { name }) => call(path(name)),
          ),
          sessions: router({
            list: query(
              {
                description: "List a participant's join/leave sessions (conferenceRecords/{id}/participants/{participant}).",
                input: object({ parent: spaceName, ...paging }),
              },
              async (_ctx, { parent, ...rest }) => list(parent, "participantSessions", rest),
            ),
            get: query(
              { description: "Get a participant session by full resource name.", input: object({ name: spaceName }) },
              async (_ctx, { name }) => call(path(name)),
            ),
          }),
        }),
        recordings: router({
          list: query(
            {
              description: "List recordings of a conference record. Each has a Drive file reference.",
              input: object({ parent: spaceName, ...pageOnly }),
            },
            async (_ctx, { parent, ...rest }) => list(parent, "recordings", rest),
          ),
          get: query(
            {
              description: "Get a recording (conferenceRecords/{id}/recordings/{recording}).",
              input: object({ name: spaceName }),
            },
            async (_ctx, { name }) => call(path(name)),
          ),
        }),
        transcripts: router({
          list: query(
            {
              description: "List transcripts of a conference record. Each has a Google Docs reference.",
              input: object({ parent: spaceName, ...pageOnly }),
            },
            async (_ctx, { parent, ...rest }) => list(parent, "transcripts", rest),
          ),
          get: query(
            {
              description: "Get a transcript (conferenceRecords/{id}/transcripts/{transcript}).",
              input: object({ name: spaceName }),
            },
            async (_ctx, { name }) => call(path(name)),
          ),
          entries: router({
            list: query(
              {
                description: "List the spoken entries of a transcript (conferenceRecords/{id}/transcripts/{transcript}).",
                input: object({ parent: spaceName, ...pageOnly }),
              },
              async (_ctx, { parent, ...rest }) => list(parent, "entries", rest),
            ),
            get: query(
              { description: "Get one transcript entry by full resource name.", input: object({ name: spaceName }) },
              async (_ctx, { name }) => call(path(name)),
            ),
          }),
        }),
        smartNotes: router({
          list: query(
            {
              description: "List Gemini smart notes of a conference record. Each has a Google Docs reference.",
              input: object({ parent: spaceName, ...pageOnly }),
            },
            async (_ctx, { parent, ...rest }) => list(parent, "smartNotes", rest),
          ),
          get: query(
            {
              description: "Get a smart note (conferenceRecords/{id}/smartNotes/{note}).",
              input: object({ name: spaceName }),
            },
            async (_ctx, { name }) => call(path(name)),
          ),
        }),
      },
      { title: "Conference records", description: "Past and ongoing meetings: participants, recordings, transcripts and notes." },
    ),
  });
}
