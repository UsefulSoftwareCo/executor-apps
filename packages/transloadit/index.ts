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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api2.transloadit.com";

const transloadit = defineProvider({
  name: "Transloadit",
  hosts: ["api2.transloadit.com"],
  auth: {
    apiKey: secrets({
      label: "Auth Key and Auth Secret",
      fields: object({ key: string({ minLength: 1 }), secret: string({ minLength: 1 }) }),
    }),
  },
  // A signed, read-only list of one Assembly; a wrong key or secret is answered with INVALID_SIGNATURE or 403.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/assemblies?${await signedQuery(account.fields, { pagesize: 1 })}`, { signal });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Credentials = { key: string; secret: string };

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Signature authentication: HMAC-SHA384 over the exact JSON of `params`, keyed by the Auth Secret.
async function sign({ key, secret }: Credentials, params: Record<string, unknown>) {
  const body = JSON.stringify({
    ...params,
    auth: { key, expires: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
    nonce: crypto.randomUUID(),
  });
  const hmac = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-384" }, false, [
    "sign",
  ]);
  const digest = await crypto.subtle.sign("HMAC", hmac, new TextEncoder().encode(body));
  return { params: body, signature: `sha384:${hex(digest)}` };
}

async function signedQuery(credentials: Credentials, params: Record<string, unknown>) {
  return new URLSearchParams(await sign(credentials, params)).toString();
}

function client(credentials: Credentials, fetcher: Fetch, signal: AbortSignal | undefined) {
  const read = async (path: string, params: Record<string, unknown> = {}) =>
    decodeJson(await fetcher(`${base}${path}?${await signedQuery(credentials, params)}`, { signal }), json());
  const write = async (method: "POST" | "PUT" | "DELETE", path: string, params: Record<string, unknown> = {}) =>
    decodeJson(
      await fetcher(`${base}${path}`, {
        method,
        signal,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: await signedQuery(credentials, params),
      }),
      json(),
    );
  return { read, write };
}

const enc = encodeURIComponent;
const Id = object({ id: string({ minLength: 1 }) });

function build({ read, write }: ReturnType<typeof client>) {
  return router({
    assemblies: router(
      {
        list: query(
          {
            description:
              "List Assemblies, newest first. type is one of all, canceled, completed, executing, expired, failed, fixable, problematic, request_aborted, uploading. fromdate and todate are UTC 'YYYY-MM-DD HH:MM:SS'; fromdate defaults to 7 days ago. keywords matches an Assembly ID or ID prefix, an error code or a custom field. pagesize is 1-5000 (default 50).",
            input: object({
              page: number().optional(),
              pagesize: number().optional(),
              type: string().optional(),
              fromdate: string().optional(),
              todate: string().optional(),
              keywords: string().optional(),
              assembly_id: string().optional(),
              template_id: string().optional(),
              order: string().optional(),
              sort: string().optional(),
            }),
          },
          async (_ctx, input) => read("/assemblies", input),
        ),
        get: query(
          {
            description:
              "Get the status of one Assembly: lifecycle state (ok), uploads, results, errors and warnings. Temporary result URLs expire after a few hours.",
            input: Id,
          },
          async (_ctx, { id }) => read(`/assemblies/${enc(id)}`),
        ),
        create: mutation(
          {
            description:
              "Create an Assembly that processes files the service fetches itself (use an import robot such as /http/import, /s3/import or /ftp/import as the first Step; this tool cannot upload local files). Provide steps (an object of Steps keyed by name, each with a robot and parameters), template_id, or both (steps are then merged into the Template's Steps). fields are Assembly Variables. notify_url receives a webhook on completion. The response means the Assembly was accepted, not that it finished; poll assemblies.get.",
            input: object({
              steps: json().optional(),
              template_id: string().optional(),
              fields: json().optional(),
              notify_url: string().optional(),
              quiet: json().optional(),
            }),
          },
          async (_ctx, input) => write("POST", "/assemblies", input),
        ),
        replay: mutation(
          {
            description:
              "Replay a finished Assembly: re-run it with its original input files and, unless overridden, its original instructions. steps, template_id, fields and notify_url override the original; reparse_template (1) re-reads the Template.",
            input: object({
              id: string({ minLength: 1 }),
              steps: json().optional(),
              template_id: string().optional(),
              fields: json().optional(),
              notify_url: string().optional(),
              reparse_template: number().optional(),
            }),
          },
          async (_ctx, { id, ...params }) => write("POST", `/assemblies/${enc(id)}/replay`, params),
        ),
        cancel: mutation(
          { description: "Cancel a running Assembly.", input: Id },
          async (_ctx, { id }) => write("DELETE", `/assemblies/${enc(id)}`),
        ),
        stats: query(
          {
            description: "Assembly statistics. Accepts the same optional filters as assemblies.list (fromdate, todate, type).",
            input: object({ fromdate: string().optional(), todate: string().optional(), type: string().optional() }),
          },
          async (_ctx, input) => read("/assembly_stats", input),
        ),
      },
      { title: "Assemblies", description: "Run, inspect, replay and cancel file-processing Assemblies." },
    ),
    templates: router(
      {
        list: query(
          {
            description: "List Templates. page, pagesize, sort (id, name, created, modified) and order (asc, desc) are optional.",
            input: object({
              page: number().optional(),
              pagesize: number().optional(),
              sort: string().optional(),
              order: string().optional(),
              keywords: string().optional(),
            }),
          },
          async (_ctx, input) => read("/templates", input),
        ),
        get: query(
          { description: "Get a Template by ID or name, including its stored instructions.", input: Id },
          async (_ctx, { id }) => read(`/templates/${enc(id)}`),
        ),
        create: mutation(
          {
            description:
              "Create a Template. name is 3-200 characters of lowercase letters, digits and dashes. template is the Assembly Instructions object (steps, fields, notify_url, allow_steps_override...). require_signature_auth 1 requires signed requests when creating Assemblies from it.",
            input: object({
              name: string({ minLength: 3 }),
              template: json(),
              require_signature_auth: number().optional(),
            }),
          },
          async (_ctx, input) => write("POST", "/templates", input),
        ),
        update: mutation(
          {
            description: "Edit a Template by ID or name. Send only the fields to change; template replaces the stored instructions.",
            input: object({
              id: string({ minLength: 1 }),
              name: string().optional(),
              template: json().optional(),
              require_signature_auth: number().optional(),
            }),
          },
          async (_ctx, { id, ...params }) => write("PUT", `/templates/${enc(id)}`, params),
        ),
        delete: mutation(
          { description: "Delete a Template by ID or name.", input: Id },
          async (_ctx, { id }) => write("DELETE", `/templates/${enc(id)}`),
        ),
      },
      { title: "Templates", description: "Reusable Assembly Instructions that keep processing logic out of your app." },
    ),
    templateCredentials: router(
      {
        types: query(
          { description: "List the supported credential types and the content fields each needs.", input: object({}) },
          async () => read("/template_credentials/types"),
        ),
        list: query(
          {
            description: "List saved Template Credentials (stored access to S3, GCS, FTP, Dropbox and other services).",
            input: object({ page: number().optional(), pagesize: number().optional() }),
          },
          async (_ctx, input) => read("/template_credentials", input),
        ),
        get: query(
          { description: "Get a Template Credential by ID.", input: Id },
          async (_ctx, { id }) => read(`/template_credentials/${enc(id)}`),
        ),
        create: mutation(
          {
            description:
              "Save a Template Credential. name is 3-255 characters (letters, digits, '.', '_', '-'). type is a service such as s3, azure, google, ftp, sftp, dropbox or supabase (see templateCredentials.types). content holds the key/value pairs that type needs, for S3 key, secret, bucket and bucket_region.",
            input: object({ name: string({ minLength: 3 }), type: string({ minLength: 1 }), content: json() }),
          },
          async (_ctx, input) => write("POST", "/template_credentials", input),
        ),
        update: mutation(
          {
            description: "Edit a Template Credential. type must be resent unchanged; to switch service create a new credential.",
            input: object({ id: string({ minLength: 1 }), name: string().optional(), type: string({ minLength: 1 }), content: json() }),
          },
          async (_ctx, { id, ...params }) => write("PUT", `/template_credentials/${enc(id)}`, params),
        ),
        delete: mutation(
          { description: "Delete a Template Credential by ID.", input: Id },
          async (_ctx, { id }) => write("DELETE", `/template_credentials/${enc(id)}`),
        ),
      },
      { title: "Template credentials", description: "Stored credentials for the storage services Assemblies import from and export to." },
    ),
    account: router(
      {
        bill: query(
          {
            description: "Get the bill for one month. month is 'YYYY-MM'.",
            input: object({ month: string({ minLength: 7 }) }),
          },
          async (_ctx, { month }) => read(`/bill/${enc(month)}`),
        ),
        jobSlots: query(
          { description: "Priority job slots currently in use.", input: object({}) },
          async () => read("/queues/job_slots"),
        ),
        priorityJobSlotStats: query(
          { description: "Priority job slot usage statistics.", input: object({}) },
          async () => read("/priority_job_slot_stats"),
        ),
      },
      { title: "Account", description: "Billing and queue capacity." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { transloadit: transloadit.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.transloadit ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Transloadit",
        description:
          "Process files with Transloadit: run, replay and cancel Assemblies (encoding, resizing, importing, exporting), manage Templates and storage Template Credentials, and read billing and queue stats.",
        icons,
      },
    ),
  }),
);
