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
  plain,
  query,
  raw,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.ilovepdf.com/v1";
const maxDownloadBytes = 8 * 1024 * 1024;

const ilovepdf = defineProvider({
  name: "iLovePDF",
  hosts: ["api.ilovepdf.com", "*.ilovepdf.com"],
  auth: {
    // Project keys come from https://www.iloveapi.com/user/projects. Requests carry a JWT
    // that this app signs (HS256) with the secret key, so the secret key must be readable here.
    apiKey: secrets({
      label: "Project keys",
      fields: object({
        publicKey: plain(string({ minLength: 1 })),
        secretKey: raw(string({ minLength: 1 })),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/signature/list?page=0&per-page=1`, {
      signal,
      headers: { Authorization: `Bearer ${await signToken(account)}` },
    });
    if (!response.ok) throw new Error(`iLovePDF rejected the project keys (HTTP ${response.status})`);
    return { accountInfo: { externalId: account.fields.publicKey, displayName: account.fields.publicKey } };
  },
});

type Account = { fields: { publicKey: string; secretKey: string } };

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const encoder = new TextEncoder();

// The vendor's own SDKs sign HS256 with the secret key and put the public key in `jti`.
async function signToken(account: Account): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(encoder.encode(JSON.stringify({ typ: "JWT", alg: "HS256" })));
  const payload = b64url(
    encoder.encode(
      JSON.stringify({ iss: "", aud: "", iat: now - 60, nbf: now - 60, exp: now + 3600, jti: account.fields.publicKey }),
    ),
  );
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(account.fields.secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`${header}.${payload}`)));
  return `${header}.${payload}.${b64url(signature)}`;
}

const serverUrl = (server: string) => {
  if (!/^[a-z0-9-]+\.ilovepdf\.com$/i.test(server)) throw new Error(`Unexpected iLovePDF server: ${server}`);
  return `https://${server}/v1`;
};

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const asObject = (value: unknown, label: string): Record<string, unknown> => {
  if (typeof value === "string") {
    const parsed: unknown = JSON.parse(value);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error(`${label} must be a JSON object`);
    return parsed as Record<string, unknown>;
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be a JSON object`);
  return value as Record<string, unknown>;
};

const tools = ["compress", "extract", "htmlpdf", "imagepdf", "merge", "officepdf", "pagenumber", "pdfa", "pdfjpg", "pdfocr", "protect", "repair", "rotate", "split", "splitsmart", "unlock", "validatepdfa", "editpdf", "watermark", "summarize", "pdfextract", "pdfmarkdown", "compressimage", "cropimage", "convertimage", "removebackgroundimage", "repairimage", "resizeimage", "rotateimage", "upscaleimage", "watermarkimage", "sign"];
const toolNote = `tool is one of: ${tools.join(", ")}.`;
const serverNote =
  "server is the hostname returned by startTask (for example api11.ilovepdf.com); a task lives on that server only.";

const ilovepdfTools = (account: Account, signal: AbortSignal) => {
  const call = async (
    fetch: typeof globalThis.fetch,
    method: string,
    url: string,
    options: { body?: unknown; form?: FormData } = {},
  ) => {
    const headers: Record<string, string> = { Authorization: `Bearer ${await signToken(account)}`, Accept: "application/json" };
    let body: string | FormData | undefined;
    if (options.form !== undefined) body = options.form;
    else if (options.body !== undefined) {
      headers["content-type"] = "application/json";
      body = JSON.stringify(options.body);
    }
    const response = await fetch(url, { method, signal, headers, ...(body === undefined ? {} : { body }) });
    return decodeJson(response, json()) as Promise<any>;
  };

  return router({
    startTask: mutation(
      {
        description:
          "Open a new iLovePDF task for a tool and region. Returns the assigned server hostname, the task id and remaining_credits. Next: uploadFromUrl or uploadFile on that server, then processTask, then downloadTask. Regions: eu, us, fr, de, pl, in, sg (default eu). " +
          toolNote,
        input: object({ tool: string(), region: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        call(fetch, "GET", `${base}/start/${encodeURIComponent(input.tool)}/${encodeURIComponent(input.region ?? "eu")}`),
    ),
    uploadFromUrl: mutation(
      {
        description: `Add a file to a task from a public URL. Returns the server_filename to use in processTask. ${serverNote}`,
        input: object({ server: string(), task: string(), url: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => {
        const form = new FormData();
        form.append("task", input.task);
        form.append("cloud_file", input.url);
        return call(fetch, "POST", `${serverUrl(input.server)}/upload`, { form });
      },
    ),
    uploadFile: mutation(
      {
        description: `Add a file to a task from base64 content. Returns the server_filename to use in processTask. ${serverNote}`,
        input: object({ server: string(), task: string(), filename: string(), contentBase64: string(), contentType: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, input) => {
        const form = new FormData();
        const bytes = Uint8Array.from(atob(input.contentBase64), (char) => char.charCodeAt(0));
        form.append("task", input.task);
        form.append("file", new Blob([bytes], { type: input.contentType ?? "application/octet-stream" }), input.filename);
        return call(fetch, "POST", `${serverUrl(input.server)}/upload`, { form });
      },
    ),
    deleteUploadedFile: mutation(
      {
        description: `Remove an uploaded file from a task by its server_filename. ${serverNote}`,
        input: object({ server: string(), task: string(), serverFilename: string() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        call(
          fetch,
          "DELETE",
          `${serverUrl(input.server)}/upload/${encodeURIComponent(input.task)}/${encodeURIComponent(input.serverFilename)}`,
        ),
    ),
    processTask: mutation(
      {
        description:
          "Run the tool on the uploaded files of a task. files is an array of { server_filename, filename, rotate?, password? } in processing order. options is a JSON object of tool parameters, for example { compression_level: 'recommended' } (compress), { split_mode: 'ranges', ranges: '1,5,10-14' } (split), { password } (protect), { to: 'png' } (convertimage), { ocr_languages: ['eng'] } (pdfocr), { mode: 'text', text: 'DRAFT' } (watermark), { elements: [...] } (editpdf, watermarkimage), { language, output_format } (summarize); also output_filename, packaged_filename, meta, ignore_errors, ignore_password. Returns download_filename, filesize, output_filesize, output_filenumber, output_extensions, timer and status. " +
          serverNote +
          " " +
          toolNote,
        input: object({ server: string(), task: string(), tool: string(), files: json(), options: json().optional() }),
        approval: always(),
      },
      async ({ fetch }, input) => {
        const files = typeof input.files === "string" ? JSON.parse(input.files) : input.files;
        if (!Array.isArray(files)) throw new Error("files must be an array");
        const extra = input.options === undefined ? {} : asObject(input.options, "options");
        return call(fetch, "POST", `${serverUrl(input.server)}/process`, {
          body: { ...extra, task: input.task, tool: input.tool, files },
        });
      },
    ),
    downloadTask: query(
      {
        description: `Download the result of a processed task as base64 (a single file, or a ZIP when there are several outputs), up to 8 MB. Returns contentType, filename, size and contentBase64. ${serverNote}`,
        input: object({ server: string(), task: string() }),
      },
      async ({ fetch }, input) => {
        const response = await fetch(`${serverUrl(input.server)}/download/${encodeURIComponent(input.task)}`, {
          signal,
          headers: { Authorization: `Bearer ${await signToken(account)}` },
        });
        if (!response.ok) throw new Error(`iLovePDF download failed with ${response.status}: ${await response.text()}`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.length > maxDownloadBytes) throw new Error(`Result is ${bytes.length} bytes, over the 8 MB limit`);
        let binary = "";
        for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        const disposition = response.headers.get("content-disposition") ?? "";
        const filename = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)?.[1];
        return {
          contentType: response.headers.get("content-type") ?? "application/octet-stream",
          filename: filename === undefined ? null : decodeURIComponent(filename),
          size: bytes.length,
          contentBase64: btoa(binary),
        };
      },
    ),
    getTask: query(
      {
        description: `Get a task's status (TaskWaiting, TaskProcessing, TaskSuccess, TaskSuccessWithWarnings, TaskError) and its files. ${serverNote}`,
        input: object({ server: string(), task: string() }),
      },
      async ({ fetch }, input) => call(fetch, "GET", `${serverUrl(input.server)}/task/${encodeURIComponent(input.task)}`),
    ),
    listTasks: query(
      {
        description:
          "List recent tasks of the project, 50 per page (page starts at 1). Filter by tool, status or customInt.",
        input: object({ page: number().optional(), tool: string().optional(), status: string().optional(), customInt: number().optional() }),
      },
      async ({ fetch }, input) =>
        call(
          fetch,
          "GET",
          `${base}/task${search({ secret_key: account.fields.secretKey, page: input.page, tool: input.tool, status: input.status, custom_int: input.customInt })}`,
        ),
    ),
    createConnectedTask: mutation(
      {
        description: `Chain a new tool onto a finished task: returns a new task id and the files it inherits (server_filename to filename). ${serverNote} ${toolNote}`,
        input: object({ server: string(), task: string(), tool: string() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        call(fetch, "POST", `${serverUrl(input.server)}/task/next`, { body: { task: input.task, tool: input.tool } }),
    ),
    deleteTask: mutation(
      {
        description: `Delete a task and its files (tasks are deleted automatically two hours after processing). ${serverNote}`,
        input: object({ server: string(), task: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => call(fetch, "DELETE", `${serverUrl(input.server)}/task/${encodeURIComponent(input.task)}`),
    ),
    createSignatureRequest: mutation(
      {
        description:
          "Create an electronic signature request. First startTask with tool 'sign' and upload the PDFs (and an optional brand logo). signers is an array of { name, email, phone?, type?: signer|validator|viewer, access_code?, force_signature_type?: all|text|sign|image, files: [{ server_filename, elements: [{ type: signature|initials|name|date|text|input, position, pages, content?, size?, ... }] }] }. Other options: brand_name and brand_logo (both or neither), language, lock_order, subject_signer, message_signer, uuid_visible, expiration_days (1-130), signer_reminders, signer_reminder_days_cycle, verify_enabled. Sends emails to the signers. " +
          serverNote,
        input: object({
          server: string(),
          task: string(),
          files: json(),
          signers: json(),
          options: json().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => {
        const parse = (value: unknown) => (typeof value === "string" ? JSON.parse(value) : value);
        const extra = input.options === undefined ? {} : asObject(input.options, "options");
        return call(fetch, "POST", `${serverUrl(input.server)}/signature`, {
          body: { ...extra, task: input.task, files: parse(input.files), signers: parse(input.signers) },
        });
      },
    ),
    listSignatures: query(
      {
        description: "List signature requests, newest first. page starts at 0; perPage is 1 to 100 (default 20).",
        input: object({ page: number().optional(), perPage: number().optional() }),
      },
      async ({ fetch }, input) =>
        call(fetch, "GET", `${base}/signature/list${search({ page: input.page ?? 0, "per-page": input.perPage })}`),
    ),
    getSignature: query(
      {
        description: "Get a signature request, its signers and status by its token_requester.",
        input: object({ tokenRequester: string() }),
      },
      async ({ fetch }, input) =>
        call(fetch, "GET", `${base}/signature/requesterview/${encodeURIComponent(input.tokenRequester)}`),
    ),
    getSignatureReceiver: query(
      {
        description: "Get a signature receiver (signer, validator or viewer) by their token_requester.",
        input: object({ receiverTokenRequester: string() }),
      },
      async ({ fetch }, input) =>
        call(fetch, "GET", `${base}/signature/receiver/info/${encodeURIComponent(input.receiverTokenRequester)}`),
    ),
    downloadSignatureFiles: query(
      {
        description: `Download files of a signature request as base64: kind 'signed' (completed requests only), 'original' (PDF or ZIP) or 'audit' (completed requests only), up to 8 MB. ${serverNote}`,
        input: object({ server: string(), tokenRequester: string(), kind: string() }),
      },
      async ({ fetch }, input) => {
        if (!["signed", "original", "audit"].includes(input.kind)) throw new Error("kind must be signed, original or audit");
        const path = input.kind === "audit" ? "download-audit" : `download-${input.kind}`;
        const response = await fetch(
          `${serverUrl(input.server)}/signature/${encodeURIComponent(input.tokenRequester)}/${path}`,
          { signal, headers: { Authorization: `Bearer ${await signToken(account)}` } },
        );
        if (!response.ok) throw new Error(`iLovePDF download failed with ${response.status}: ${await response.text()}`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.length > maxDownloadBytes) throw new Error(`Result is ${bytes.length} bytes, over the 8 MB limit`);
        let binary = "";
        for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        return {
          contentType: response.headers.get("content-type") ?? "application/octet-stream",
          size: bytes.length,
          contentBase64: btoa(binary),
        };
      },
    ),
    sendSignatureReminder: mutation(
      {
        description: "Email a reminder to the pending signers (status must be 'sent'; at most twice a day).",
        input: object({ tokenRequester: string() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        call(fetch, "POST", `${base}/signature/sendReminder/${encodeURIComponent(input.tokenRequester)}`),
    ),
    voidSignature: mutation(
      {
        description: "Void a signature request so it can no longer be signed.",
        input: object({ tokenRequester: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => call(fetch, "POST", `${base}/signature/void/${encodeURIComponent(input.tokenRequester)}`),
    ),
    extendSignatureExpiration: mutation(
      {
        description: "Add days (1 to 130) to a signature request's expiration.",
        input: object({ tokenRequester: string(), days: number() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        call(fetch, "POST", `${base}/signature/increase-expiration-days/${encodeURIComponent(input.tokenRequester)}`, {
          body: { days: input.days },
        }),
    ),
    fixReceiverEmail: mutation(
      {
        description: "Correct the email of a receiver whose invitation bounced.",
        input: object({ receiverTokenRequester: string(), email: string() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        call(fetch, "POST", `${base}/signature/receiver/fix-email/${encodeURIComponent(input.receiverTokenRequester)}`, {
          body: { email: input.email },
        }),
    ),
    fixSignerPhone: mutation(
      {
        description: "Correct a signer's phone number (digits only, including the country prefix).",
        input: object({ signerTokenRequester: string(), phone: string() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        call(fetch, "POST", `${base}/signature/signer/fix-phone/${encodeURIComponent(input.signerTokenRequester)}`, {
          body: { phone: input.phone },
        }),
    ),
  });
};

export default defineApp({ user: { accounts: { ilovepdf: ilovepdf.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.ilovepdf ?? [], (account) => ilovepdfTools(account, signal), { signal }), {
    title: "iLovePDF",
    description:
      "Merge, split, compress, convert, OCR, protect, watermark and edit PDFs and images, and send e-signature requests, with the iLovePDF API.",
    icons,
    instructions:
      "Workflow: startTask (returns server and task) -> uploadFromUrl or uploadFile -> processTask -> downloadTask. Pass the same server to every later call for that task.",
  }),
}));
