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
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.signaturely.com/api/v1";

const signaturely = defineProvider({
  name: "Signaturely",
  hosts: ["api.signaturely.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/user/by-api`, {
      signal,
      headers: { Authorization: `Api-Key ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Api-Key ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    const text = await response.text();
    if (!response.ok) throw new Error(`Signaturely ${method} ${path} failed with ${response.status}: ${text.slice(0, 500)}`);
    if (text === "") return { ok: true };
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { text };
    }
  };
}

type Call = ReturnType<typeof client>;

const filters = record(json()).optional();
const payload = record(json());
const optionalPayload = record(json()).optional();
const page = { limit: number().default(20), page: number().default(1) };

type Spec = { method: Method; path: string; description: string; ids?: readonly string[]; body?: boolean | "optional"; paged?: boolean };

// Path ids are substituted into {name} placeholders. `query` carries filters, `body` the JSON payload.
function tool(call: Call, spec: Spec) {
  const ids = spec.ids ?? [];
  const shape = {
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    ...(spec.paged ? page : {}),
    query: filters,
    ...(spec.body === "optional" ? { body: optionalPayload } : spec.body ? { body: payload } : {}),
  };
  const handler = async (_ctx: unknown, input: Params) => {
    let path = spec.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(input[id])));
    const search = {
      ...(spec.paged ? { limit: input.limit, page: input.page } : {}),
      ...((input.query as Params | undefined) ?? {}),
    };
    return call(spec.method, path, search, spec.body ? (input.body as Params | undefined) : undefined);
  };
  const options = { description: spec.description, input: object(shape) };
  return spec.method === "GET" ? query(options, handler) : mutation(options, handler);
}

function build(call: Call) {
  const t = (spec: Spec) => tool(call, spec);
  return router({
    me: query(
      { description: "The user and account behind the API key.", input: object({}) },
      async () => call("GET", "/user/by-api"),
    ),
    documents: router(
      {
        list: t({ method: "GET", path: "/documents", paged: true, description: "List documents. limit and page are required; extra filters go in query." }),
        signers: t({ method: "GET", path: "/documents/{documentId}/signers", ids: ["documentId"], description: "List the signers of a document." }),
        activities: t({ method: "GET", path: "/documents/{id}/activities", ids: ["id"], description: "Activity log of a document." }),
        downloadUrl: t({ method: "GET", path: "/document_sign/documents/{documentId}/signed_download_url/api", ids: ["documentId"], description: "Download link: the signed PDF when the document is completed, otherwise the source file." }),
        shareUrl: t({ method: "GET", path: "/document_sign/documents/{id}/share_url", ids: ["id"], description: "Share link of a document." }),
        recent: t({ method: "GET", path: "/api-integrations/recent_document", description: "Most recent document. Pass query.recentDocumentType as sent or completed." }),
        rename: t({ method: "PATCH", path: "/documents/{id}/rename", ids: ["id"], body: true, description: "Rename a document. body: the new name as the Signaturely API expects (for example { name })." }),
        cancel: t({ method: "PATCH", path: "/documents/{documentId}/revert", ids: ["documentId"], body: "optional", description: "Cancel (revert) a pending signature request." }),
        sendReminders: t({ method: "POST", path: "/document_sign/documents/{id}/send_reminders", ids: ["id"], body: true, description: "Send reminders to signers. body: { signersIds: string[] }." }),
        share: t({ method: "POST", path: "/document_sign/documents/{id}/share", ids: ["id"], body: true, description: "Share a document by email. body holds the recipient emails." }),
        delete: t({ method: "DELETE", path: "/documents", body: true, description: "Delete a document. body: { documentId }." }),
      },
      { title: "Documents", description: "Signature requests, signers, download and share links." },
    ),
    signingRequests: router(
      {
        fromTemplate: t({ method: "POST", path: "/document_sign/api/request_by_template", body: true, description: "Create a signing request from a template. body: templateId, signers and fields per the Signaturely API reference; testMode: true sends a test request." }),
        bulkSend: t({ method: "POST", path: "/document_sign/api/bulk_send", body: true, description: "Bulk send a single-signer template to many recipients. body per the Signaturely API reference; testMode is supported." }),
      },
      { title: "Signing requests", description: "Send documents for signature from templates." },
    ),
    templates: router(
      {
        list: t({ method: "GET", path: "/documents/api/templates", paged: true, description: "List templates. limit and page are required." }),
        downloadUrl: t({ method: "GET", path: "/document_sign/documents/{templateId}/signed_download_url/api", ids: ["templateId"], description: "Download link for a template PDF." }),
        delete: t({ method: "DELETE", path: "/documents/api/templates", body: true, description: "Delete a template. body: { templateId }." }),
      },
      { title: "Templates", description: "Reusable document templates." },
    ),
    folders: router(
      {
        list: t({ method: "GET", path: "/api-integrations/folders", description: "List folders." }),
        get: t({ method: "GET", path: "/api-integrations/folders/{id}", ids: ["id"], description: "Retrieve a folder." }),
        create: t({ method: "POST", path: "/api-integrations/folders", body: true, description: "Create a folder. body: { name }." }),
        rename: t({ method: "PATCH", path: "/api-integrations/folders/{id}", ids: ["id"], body: true, description: "Rename a folder. body: { name }." }),
        move: t({ method: "PATCH", path: "/api-integrations/folders/move", body: true, description: "Move documents or folders into a folder." }),
      },
      { title: "Folders", description: "Organize documents into folders." },
    ),
    team: router(
      {
        members: t({ method: "GET", path: "/teams/members", description: "List team members." }),
        add: t({ method: "POST", path: "/add-teammates/with-role", body: true, description: "Add team members with a role (user or admin)." }),
        remove: t({ method: "DELETE", path: "/remove-teammates/email", body: true, description: "Remove team members by email." }),
        changeRole: t({ method: "PATCH", path: "/teams/members/role", body: true, description: "Change a member's role (user or admin)." }),
      },
      { title: "Team", description: "Team members and roles." },
    ),
    webhooks: router(
      {
        subscribe: t({ method: "POST", path: "/hooks/subscribe", body: true, description: "Subscribe a webhook URL. Events: document_sent, document_completed." }),
        unsubscribe: t({ method: "DELETE", path: "/hooks/unsubscribe/{id}", ids: ["id"], description: "Remove a webhook subscription." }),
      },
      { title: "Webhooks", description: "Event subscriptions for sent and completed documents." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { signaturely: signaturely.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.signaturely ?? [],
        (account) => withApprovals(build(client(account.fields.token, fetch, signal)), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Signaturely",
        description: "E-signature platform: documents, signers, templates, signing requests, folders, team members and webhooks.",
        icons,
      },
    ),
  }),
);
