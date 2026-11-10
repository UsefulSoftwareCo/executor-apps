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

const single = "https://api.millionverifier.com";
const bulk = "https://bulkapi.millionverifier.com";

const millionverifier = defineProvider({
  name: "MillionVerifier",
  hosts: ["api.millionverifier.com", "bulkapi.millionverifier.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${single}/api/v3/credits?${new URLSearchParams({ api: account.fields.token })}`, { signal });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

// The Single API takes the key as `api`, the Bulk API as `key`.
const url = (base: string, path: string, keyName: "api" | "key", account: Account, params: Record<string, string | number | undefined> = {}) => {
  const out = new URLSearchParams({ [keyName]: account.fields.token });
  for (const [name, value] of Object.entries(params)) if (value !== undefined) out.set(name, String(value));
  return `${base}${path}?${out}`;
};

const millionverifierTools = (account: Account, signal: AbortSignal) =>
  router({
    verifyEmail: query(
      {
        description:
          "Verify one email address in real time. Returns result (ok, catch_all, unknown, invalid, disposable), resultcode, subresult, quality, free and role flags, a didyoumean suggestion, and remaining credits. timeout is 2-60 seconds (default 20). Each verification uses a credit.",
        input: object({ email: string(), timeout: number().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(url(single, "/api/v3", "api", account, input), { signal }), json()),
    ),
    getCredits: query(
      {
        description: "Get the number of verification credits remaining on the account.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(url(single, "/api/v3/credits", "api", account), { signal }), json()),
    ),
    bulkUpload: mutation(
      {
        description:
          "Upload a list of email addresses (CSV or TXT text, one address per line or a column) as a bulk verification job. fileName is the name to give the file, for example list.csv. Returns file_id and status; use bulkFileInfo to follow progress. Verification consumes credits.",
        input: object({ fileContents: string(), fileName: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, { fileContents, fileName }) => {
        const form = new FormData();
        form.set("file_contents", new Blob([fileContents], { type: "text/csv" }), fileName ?? "emails.csv");
        return decodeJson(await fetch(url(bulk, "/bulkapi/v2/upload", "key", account), { method: "POST", signal, body: form }), json());
      },
    ),
    bulkFileInfo: query(
      {
        description:
          "Get the status and counters of one bulk file: status, percent complete, total rows, and counts of ok, catch_all, disposable, invalid and unknown addresses.",
        input: object({ fileId: number() }),
      },
      async ({ fetch }, { fileId }) =>
        decodeJson(await fetch(url(bulk, "/bulkapi/v2/fileinfo", "key", account, { file_id: fileId }), { signal }), json()),
    ),
    bulkFileList: query(
      {
        description:
          "List bulk files with optional filters. limit defaults to and is capped at 50. status is one or more comma-separated of in_progress, error, finished, canceled, paused, in_queue_to_start. Dates use yyyy-MM-dd HH:mm:ss. hasError is 1/0 or true/false. name matches a substring.",
        input: object({
          offset: number().optional(),
          limit: number().optional(),
          id: string().optional(),
          name: string().optional(),
          status: string().optional(),
          updatedAtFrom: string().optional(),
          updatedAtTo: string().optional(),
          createdateFrom: string().optional(),
          createdateTo: string().optional(),
          percentFrom: number().optional(),
          percentTo: number().optional(),
          hasError: string().optional(),
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(
            url(bulk, "/bulkapi/v2/filelist", "key", account, {
              offset: input.offset,
              limit: input.limit,
              id: input.id,
              name: input.name,
              status: input.status,
              updated_at_from: input.updatedAtFrom,
              updated_at_to: input.updatedAtTo,
              createdate_from: input.createdateFrom,
              createdate_to: input.createdateTo,
              percent_from: input.percentFrom,
              percent_to: input.percentTo,
              has_error: input.hasError,
            }),
            { signal },
          ),
          json(),
        ),
    ),
    bulkDownload: query(
      {
        description:
          "Download the verification report of a finished bulk file as CSV text. filter is one of ok, ok_and_catch_all, unknown, invalid, all, custom. With custom, narrow with statuses (comma-separated ok, catch_all, unknown, invalid, disposable), free (1/0) and role (1/0).",
        input: object({
          fileId: string(),
          filter: string(),
          statuses: string().optional(),
          free: string().optional(),
          role: string().optional(),
        }),
      },
      async ({ fetch }, { fileId, ...input }) => {
        const response = await fetch(url(bulk, "/bulkapi/v2/download", "key", account, { file_id: fileId, ...input }), { signal });
        return { status: response.status, contentType: response.headers.get("content-type") ?? "", body: await response.text() };
      },
    ),
    bulkStop: mutation(
      {
        description:
          "Cancel a bulk file that is being verified. Results for the addresses already verified can be downloaded shortly afterwards.",
        input: object({ fileId: string() }),
        approval: always(),
      },
      async ({ fetch }, { fileId }) =>
        decodeJson(await fetch(url(bulk, "/bulkapi/stop", "key", account, { file_id: fileId }), { signal }), json()),
    ),
    bulkDelete: mutation(
      {
        description: "Delete a file uploaded to the bulk API, including its results.",
        input: object({ fileId: string() }),
        approval: always(),
      },
      async ({ fetch }, { fileId }) =>
        decodeJson(await fetch(url(bulk, "/bulkapi/v2/delete", "key", account, { file_id: fileId }), { signal }), json()),
    ),
  });

export default defineApp({ user: { accounts: { millionverifier: millionverifier.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.millionverifier ?? [], (account) => millionverifierTools(account, signal), { signal }), {
    title: "MillionVerifier",
    description: "Verify email addresses in real time or in bulk files, download reports, and check remaining credits with MillionVerifier.",
    icons,
  }),
}));
