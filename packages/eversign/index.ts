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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.eversign.com";

const eversign = defineProvider({
  name: "Xodo Sign (eversign)",
  hosts: ["api.eversign.com"],
  auth: {
    apiKey: secrets({
      label: "API access key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing businesses is read-only and needs only the access key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/business?access_key=${encodeURIComponent(account.fields.token)}`, { signal });
    await decodeJson(response, array(object({ business_id: number() })));
  },
});

type Account = { fields: { token: string } };

const url = (account: Account, path: string, params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams({ access_key: account.fields.token });
  for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, String(value));
  return `${base}${path}?${search.toString()}`;
};

// Eversign reports failures as {success:false,error:{code,type,info}}, possibly with HTTP 200.
const checked = async (response: Parameters<typeof decodeJson>[0]): Promise<unknown> => {
  const body: unknown = await decodeJson(response, json());
  if (typeof body === "object" && body !== null && !Array.isArray(body) && (body as { success?: unknown }).success === false) {
    const error = (body as { error?: { code?: unknown; type?: unknown; info?: unknown } }).error;
    throw new Error(`eversign error ${String(error?.code ?? "")} ${String(error?.type ?? "")}: ${String(error?.info ?? "request failed")}`.trim());
  }
  return body;
};

const jsonBody = { "content-type": "application/json" };

const eversignTools = (account: Account, signal: AbortSignal) =>
  router({
    businesses: router(
      {
        list: query(
          {
            description:
              "List the businesses (workspaces) the access key can use. Returns business_id, business_name, business_identifier, business_status (1 active, 2 inactive) and is_primary. Other tools need a business_id from here.",
            input: object({}),
          },
          async ({ fetch }) => checked(await fetch(url(account, "/business", {}), { signal })),
        ),
      },
      { title: "Businesses", description: "Workspaces available to the access key." },
    ),
    documents: router(
      {
        list: query(
          {
            description:
              "List documents or templates. type is one of all, my_action_required, waiting_for_others, completed, drafts, cancelled, templates, templates_archived, template_drafts. limit defaults to and is capped at 500; page starts at 1.",
            input: object({
              businessId: number(),
              type: string().default("all"),
              limit: number().optional(),
              page: number().optional(),
            }),
          },
          async ({ fetch }, { businessId, type, limit, page }) =>
            checked(
              await fetch(url(account, "/document", { business_id: businessId, type, limit, page }), { signal }),
            ),
        ),
        get: query(
          {
            description:
              "Get one document or template by document_hash: status flags, files, signers with their progress, recipients, fields, meta and the event log.",
            input: object({ businessId: number(), documentHash: string(), documentLogLimit: number().optional() }),
          },
          async ({ fetch }, { businessId, documentHash, documentLogLimit }) =>
            checked(
              await fetch(
                url(account, "/document", {
                  business_id: businessId,
                  document_hash: documentHash,
                  document_log_limit: documentLogLimit,
                }),
                { signal },
              ),
            ),
        ),
        auditLog: query(
          {
            description:
              "Get the audit log of a document: event type, timestamp, associated signer, checksums and IP addresses.",
            input: object({ businessId: number(), documentHash: string() }),
          },
          async ({ fetch }, { businessId, documentHash }) =>
            checked(
              await fetch(
                url(account, `/document/${encodeURIComponent(documentHash)}/audit_log`, { business_id: businessId }),
                { signal },
              ),
            ),
        ),
        create: mutation(
          {
            description:
              "Create a document (sends it unless is_draft is 1). Pass the request body as document: title, message, files (each with name and one of file_url, file_id or file_base64), signers (id, name, email), optional recipients, fields (a 2-D array with one inner array per file), meta, sandbox (1 for free test mode), is_draft, use_signer_order, reminders, embedded_signing_enabled, expires, redirect, etc. Set is_template 1 to create a template (signers then use role instead of name and email).",
            input: object({ businessId: number(), document: json() }),
            approval: always(),
          },
          async ({ fetch }, { businessId, document }) =>
            checked(
              await fetch(url(account, "/document", { business_id: businessId }), {
                method: "POST",
                signal,
                headers: jsonBody,
                body: JSON.stringify(document),
              }),
            ),
        ),
        createFromTemplate: mutation(
          {
            description:
              "Create a document from a template. Pass the request body as document: template_id, title, message, signers (role plus name and email, one per required template role), optional recipients (role, name, email), fields ([{identifier, value}] for merge fields), sandbox, redirect, expires, embedded_signing_enabled.",
            input: object({ businessId: number(), document: json() }),
            approval: always(),
          },
          async ({ fetch }, { businessId, document }) =>
            checked(
              await fetch(url(account, "/document", { business_id: businessId }), {
                method: "POST",
                signal,
                headers: jsonBody,
                body: JSON.stringify(document),
              }),
            ),
        ),
        cancel: mutation(
          {
            description: "Cancel a pending document so signers can no longer sign it. Required before deleting a pending document.",
            input: object({ businessId: number(), documentHash: string() }),
            approval: always(),
          },
          async ({ fetch }, { businessId, documentHash }) =>
            checked(
              await fetch(
                url(account, "/document", { business_id: businessId, document_hash: documentHash, cancel: 1 }),
                { method: "DELETE", signal },
              ),
            ),
        ),
        trash: mutation(
          {
            description: "Move a document or template to the trash. Completed and draft documents must be trashed before deletion.",
            input: object({ businessId: number(), documentHash: string() }),
            approval: always(),
          },
          async ({ fetch }, { businessId, documentHash }) =>
            checked(
              await fetch(
                url(account, "/document", { business_id: businessId, document_hash: documentHash, trash: 1 }),
                { method: "DELETE", signal },
              ),
            ),
        ),
        delete: mutation(
          {
            description:
              "Permanently delete a document or template. Pending documents must be cancelled first; completed and draft documents must be trashed first.",
            input: object({ businessId: number(), documentHash: string() }),
            approval: always(),
          },
          async ({ fetch }, { businessId, documentHash }) =>
            checked(
              await fetch(url(account, "/document", { business_id: businessId, document_hash: documentHash }), {
                method: "DELETE",
                signal,
              }),
            ),
        ),
        finalDocumentUrl: query(
          {
            description:
              "Get a download URL for the final signed PDF (url_only). Set auditTrail to 1 to include the audit trail, or documentId to AT for only the audit trail, or 0, 1, ... for a single file.",
            input: object({
              businessId: number(),
              documentHash: string(),
              auditTrail: number().optional(),
              documentId: string().optional(),
            }),
          },
          async ({ fetch }, { businessId, documentHash, auditTrail, documentId }) =>
            checked(
              await fetch(
                url(account, "/download_final_document", {
                  business_id: businessId,
                  document_hash: documentHash,
                  audit_trail: auditTrail,
                  document_id: documentId,
                  url_only: 1,
                }),
                { signal },
              ),
            ),
        ),
      },
      { title: "Documents", description: "Create, send, inspect, cancel and delete documents and templates." },
    ),
    signers: router(
      {
        sendReminder: mutation(
          {
            description: "Send a reminder email to one signer of a pending document.",
            input: object({ businessId: number(), documentHash: string(), signerId: number() }),
            approval: always(),
          },
          async ({ fetch }, { businessId, documentHash, signerId }) =>
            checked(
              await fetch(url(account, "/send_reminder", { business_id: businessId }), {
                method: "POST",
                signal,
                headers: jsonBody,
                body: JSON.stringify({ document_hash: documentHash, signer_id: signerId }),
              }),
            ),
        ),
        reassign: mutation(
          {
            description:
              "Reassign a signer of a pending document to someone else. The owner, old signer and new signer all receive an email.",
            input: object({
              businessId: number(),
              documentHash: string(),
              signerId: number(),
              newSignerName: string(),
              newSignerEmail: string(),
              reason: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { businessId, documentHash, signerId, newSignerName, newSignerEmail, reason }) =>
            checked(
              await fetch(url(account, "/reassign", { business_id: businessId }), {
                method: "POST",
                signal,
                headers: jsonBody,
                body: JSON.stringify({
                  document_hash: documentHash,
                  signer_id: signerId,
                  new_signer_name: newSignerName,
                  new_signer_email: newSignerEmail,
                  ...(reason === undefined ? {} : { reason }),
                }),
              }),
            ),
        ),
      },
      { title: "Signers", description: "Remind or reassign signers." },
    ),
    bulk: router(
      {
        blankCsv: query(
          {
            description: "Get the blank CSV header row that matches a template, for bulk sending. Returned as text.",
            input: object({ businessId: number(), templateHash: string() }),
          },
          async ({ fetch }, { businessId, templateHash }) => {
            const response = await fetch(
              url(account, `/template/${encodeURIComponent(templateHash)}/bulk/csv/blank`, { business_id: businessId }),
              { signal },
            );
            if (!response.ok) throw new Error(`eversign blank CSV failed with HTTP ${response.status}`);
            return { csv: await response.text() };
          },
        ),
        createJob: mutation(
          {
            description:
              "Create a bulk sending job from a template. rows is the 2-D array (header row then data rows) returned by CSV validation, up to 250 documents. Documents count against the API quota.",
            input: object({ businessId: number(), templateHash: string(), rows: array(array(string())) }),
            approval: always(),
          },
          async ({ fetch }, { businessId, templateHash, rows }) =>
            checked(
              await fetch(
                url(account, `/template/${encodeURIComponent(templateHash)}/bulk/job`, { business_id: businessId }),
                { method: "POST", signal, headers: jsonBody, body: JSON.stringify(rows) },
              ),
            ),
        ),
        listJobs: query(
          {
            description: "List bulk sending jobs. limit is 0 to 1000 (default 100).",
            input: object({ businessId: number(), limit: number().optional(), offset: number().optional() }),
          },
          async ({ fetch }, { businessId, limit, offset }) =>
            checked(
              await fetch(url(account, "/bulk_job", { business_id: businessId, limit, offset }), { signal }),
            ),
        ),
        getJob: query(
          {
            description: "Get a bulk sending job by id.",
            input: object({ businessId: number(), jobId: string() }),
          },
          async ({ fetch }, { businessId, jobId }) =>
            checked(
              await fetch(url(account, `/bulk_job/${encodeURIComponent(jobId)}`, { business_id: businessId }), { signal }),
            ),
        ),
        jobStatus: query(
          {
            description: "Get the progress of a bulk sending job: completed, cancelled and in-progress document counts.",
            input: object({ businessId: number(), jobId: string() }),
          },
          async ({ fetch }, { businessId, jobId }) =>
            checked(
              await fetch(url(account, `/bulk_job/${encodeURIComponent(jobId)}/status`, { business_id: businessId }), {
                signal,
              }),
            ),
        ),
        jobDocuments: query(
          {
            description: "List the documents created by a bulk sending job. limit is 0 to 1000 (default 100).",
            input: object({
              businessId: number(),
              jobId: string(),
              limit: number().optional(),
              offset: number().optional(),
            }),
          },
          async ({ fetch }, { businessId, jobId, limit, offset }) =>
            checked(
              await fetch(
                url(account, `/bulk_job/${encodeURIComponent(jobId)}/documents`, { business_id: businessId, limit, offset }),
                { signal },
              ),
            ),
        ),
      },
      { title: "Bulk sending", description: "Send a template to many signers in one job." },
    ),
  });

export default defineApp({ user: { accounts: { eversign: eversign.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.eversign ?? [], (account) => eversignTools(account, signal), { signal }), {
    title: "Xodo Sign (eversign)",
    description:
      "Send documents for e-signature with Xodo Sign (formerly eversign): create documents and templates, track signers, send reminders, fetch signed PDFs and audit logs, and run bulk sends.",
    icons,
  }),
}));
