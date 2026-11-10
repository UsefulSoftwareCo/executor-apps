import {
  accountRouter,
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

const base = "https://api.gettranscribe.ai";

const gettranscribe = defineProvider({
  name: "GetTranscribe",
  hosts: ["api.gettranscribe.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing one job is read-only and free; it fails with 401 for a bad key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/transcription-jobs?$limit=1`, {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({ total: number() }));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ "x-api-key": account.fields.token, Accept: "application/json" });
const jsonHeaders = (account: Account) => ({ ...headers(account), "Content-Type": "application/json" });

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const models = "accurate (default), fast, quality or speakers (labels speakers, ignores prompt)";
const paging = {
  limit: number().optional(),
  skip: number().optional(),
  sort: string().optional(),
};
// The API uses Feathers-style query parameters: $limit, $skip and $sort[field].
const pageParams = (input: { limit?: number; skip?: number; sort?: string }) => ({
  $limit: input.limit,
  $skip: input.skip,
  ...(input.sort === undefined ? {} : { "$sort[created_at]": input.sort === "asc" ? 1 : -1 }),
});

const gettranscribeTools = (account: Account, signal: AbortSignal) =>
  router({
    jobs: router(
      {
        create: mutation(
          {
            description: `Start an asynchronous transcription of a public video or media link (Instagram, TikTok, YouTube, Facebook, X, Pinterest, Google Drive or a direct media URL). Uses credits. Returns a pending job; poll jobs.get until status is completed or failed, then read the transcript with transcriptions.get using its transcription_id. model is ${models}. language is an ISO-639-1 code. prompt gives names or jargon as context.`,
            input: object({
              url: string(),
              folder_id: number().optional(),
              model: string().optional(),
              language: string().optional(),
              prompt: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(`${base}/transcription-jobs`, {
                method: "POST",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify({ ...input, source: "api" }),
              }),
              json(),
            ),
        ),
        get: query(
          {
            description:
              "Get one transcription job by id: status (pending, processing, completed, failed), progress, and on completion the transcription_id; on failure error_message and error_code. Poll every few seconds.",
            input: object({ id: number() }),
          },
          async ({ fetch }, { id }) =>
            decodeJson(await fetch(`${base}/transcription-jobs/${id}`, { signal, headers: headers(account) }), json()),
        ),
        list: query(
          {
            description:
              "List transcription jobs. status filters by pending, processing, completed or failed. limit is the page size, skip the offset, sort is asc or desc by creation time. Returns { total, limit, skip, data }.",
            input: object({ status: string().optional(), ...paging }),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(`${base}/transcription-jobs${search({ status: input.status, ...pageParams(input) })}`, {
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
      },
      { title: "Jobs", description: "Create and track asynchronous transcription jobs." },
    ),
    transcriptions: router(
      {
        get: query(
          {
            description:
              "Get a finished transcription by id: full text, platform, author, title, language, duration, word and character counts, and time-limited audio and thumbnail URLs. Word and segment timing arrays can be large and may be empty.",
            input: object({ id: number() }),
          },
          async ({ fetch }, { id }) =>
            decodeJson(await fetch(`${base}/transcriptions/${id}`, { signal, headers: headers(account) }), json()),
        ),
        list: query(
          {
            description:
              "List completed transcriptions as lightweight metadata (no transcript text; use transcriptions.get for that). Filter by folder_id or platform (youtube, instagram, tiktok...). Returns { total, limit, skip, data }.",
            input: object({ folder_id: number().optional(), platform: string().optional(), ...paging }),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(
                `${base}/transcriptions${search({ folder_id: input.folder_id, platform: input.platform, ...pageParams(input) })}`,
                { signal, headers: headers(account) },
              ),
              json(),
            ),
        ),
      },
      { title: "Transcriptions", description: "Read finished transcriptions." },
    ),
    folders: router(
      {
        list: query(
          {
            description:
              "List the account's transcription folders. parent_id filters to one parent folder. Returns { total, limit, skip, data }.",
            input: object({ parent_id: number().optional(), ...paging }),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(`${base}/transcriptions-folders${search({ parent_id: input.parent_id, ...pageParams(input) })}`, {
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
        get: query(
          { description: "Get one folder by id.", input: object({ id: number() }) },
          async ({ fetch }, { id }) =>
            decodeJson(
              await fetch(`${base}/transcriptions-folders/${id}`, { signal, headers: headers(account) }),
              json(),
            ),
        ),
        create: mutation(
          {
            description: "Create a folder. Omit parent_id for a root folder.",
            input: object({ name: string(), parent_id: number().optional() }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(`${base}/transcriptions-folders`, {
                method: "POST",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify({ name: input.name, parent_id: input.parent_id ?? null }),
              }),
              json(),
            ),
        ),
        update: mutation(
          {
            description: "Rename a folder or move it under another parent folder.",
            input: object({ id: number(), name: string().optional(), parent_id: number().optional() }),
            approval: always(),
          },
          async ({ fetch }, { id, ...body }) =>
            decodeJson(
              await fetch(`${base}/transcriptions-folders/${id}`, {
                method: "PATCH",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify(body),
              }),
              json(),
            ),
        ),
      },
      { title: "Folders", description: "Organize transcriptions into folders." },
    ),
    resolveDownloadUrl: mutation(
      {
        description:
          "Resolve a fresh direct download URL and thumbnail for a public video link without transcribing it. Debits a small amount from the wallet balance. The returned links expire.",
        input: object({ url: string() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/download-video`, {
            method: "POST",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    account: query(
      {
        description:
          "Get the account's plan, subscription status, minute and message limits, current usage and balances. id is the account's own user id; it appears as user_id on every job from jobs.list.",
        input: object({ id: number() }),
      },
      async ({ fetch }, { id }) =>
        decodeJson(await fetch(`${base}/users/${id}`, { signal, headers: headers(account) }), json()),
    ),
  });

export default defineApp(
  { user: { accounts: { gettranscribe: gettranscribe.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.gettranscribe ?? [], (account) => gettranscribeTools(account, signal), { signal }),
      {
        title: "GetTranscribe",
        description:
          "Transcribe Instagram, TikTok, YouTube and other public video links: transcription jobs, finished transcripts, folders and download links.",
        instructions:
          "Always create transcriptions with jobs.create, poll jobs.get until completed, then read transcriptions.get with the transcription_id. Creating jobs and resolving download URLs spend credits.",
        icons,
      },
    ),
  }),
);
