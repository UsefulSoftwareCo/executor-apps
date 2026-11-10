import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  oauth2,
  object,
  query,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://esignatures.com/api";
const mcpUrl = "https://esignatures.com/mcp";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

const mcpHeaders = (account: { fields: { access_token: string } }) => ({
  Authorization: `Bearer ${account.fields.access_token}`,
});

const esignatures = defineProvider({
  name: "eSignatures",
  hosts: ["esignatures.com"],
  auth: {
    // The hosted MCP server accepts OAuth only (Client ID Metadata Documents).
    oauth: oauth2({ discover: "https://esignatures.com" }),
    // The REST API takes the account secret token over HTTP Basic Auth.
    apiKey: secrets({
      label: "Secret token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") return mcpHealth(check, { url: mcpUrl, headers: mcpHeaders(account) });
    const response = await fetch(`${base}/templates`, { signal, headers: headers(account) });
    await decodeJson(response, object({ data: array(json()) }));
  },
});

type RestAccount = { fields: { token: string } };

// HTTP Basic Auth: the secret token is the username, the password is empty.
const headers = (account: RestAccount) => ({
  Authorization: `Basic ${btoa(`${account.fields.token}:`)}`,
  Accept: "application/json",
});

const id = (value: string) => encodeURIComponent(value);

const Signer = {
  name: string().optional(),
  email: string().optional(),
  mobile: string().optional(),
  company_name: string().optional(),
  signature_request_delivery_methods: array(string()).optional(),
  signed_document_delivery_method: string().optional(),
  multi_factor_authentications: array(string()).optional(),
  redirect_url: string().optional(),
};

const Placeholder = object({
  placeholder_key: string(),
  replace_with_text: string().optional(),
  replace_with_markdown: string().optional(),
  replace_with_template: string().optional(),
});

const Edits = array(object({ find_markdown: string(), replace_with_markdown: string() }));

const esignaturesTools = (account: RestAccount, signal: AbortSignal) => {
  const get = (path: string, fetch: typeof globalThis.fetch) =>
    fetch(`${base}${path}`, { signal, headers: headers(account) }).then((response) => decodeJson(response, json()));
  const post = (path: string, fetch: typeof globalThis.fetch, body?: unknown) =>
    fetch(`${base}${path}`, {
      method: "POST",
      signal,
      headers: { ...headers(account), "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).then((response) => decodeJson(response, json()));

  return router({
    contracts: router(
      {
        create: mutation(
          {
            description:
              "Create a contract from a template and, by default, send it to the signers. Each signer needs a name plus an email or mobile; signing_order sequences signers, auto_sign signs for your own account. placeholder_fields replace {{placeholders}} in the template with text, markdown or another template's content; signer_fields prefill signer inputs. Set test to \"yes\" for a free demo contract and save_as_draft to \"yes\" to save without sending. Returns each signer's sign_page_url.",
            input: object({
              template_id: string(),
              signers: array(
                object({
                  ...Signer,
                  name: string(),
                  signing_order: string().optional(),
                  auto_sign: string().optional(),
                }),
              ),
              title: string().optional(),
              locale: string().optional(),
              metadata: string().optional(),
              expires_in_hours: string().optional(),
              custom_webhook_url: string().optional(),
              assigned_user_email: string().optional(),
              labels: array(string()).optional(),
              test: string().optional(),
              save_as_draft: string().optional(),
              placeholder_fields: array(Placeholder).optional(),
              signer_fields: array(object({ signer_field_id: string(), default_value: string() })).optional(),
              emails: object({
                signature_request_subject: string().optional(),
                signature_request_text: string().optional(),
                final_contract_subject: string().optional(),
                final_contract_text: string().optional(),
                cc_email_addresses: array(string()).optional(),
                reply_to: string().optional(),
              }).optional(),
              custom_branding: object({ company_name: string().optional(), logo_url: string().optional() }).optional(),
            }),
            approval: always(),
          },
          ({ fetch }, input) => post("/contracts", fetch, input),
        ),
        get: query(
          {
            description:
              "Get a contract: status (draft, sent, signed, withdrawn), signers with their sign_page_url and entered signer_field_values, labels, and the signed PDF url once signed. Avoid polling; the API rate-limits it and data for contracts older than two weeks may be incomplete.",
            input: object({ contractId: string() }),
          },
          ({ fetch }, { contractId }) => get(`/contracts/${id(contractId)}`, fetch),
        ),
        withdraw: mutation(
          {
            description: "Withdraw a contract so it can no longer be signed. Signed contracts cannot be withdrawn.",
            input: object({ contractId: string() }),
            approval: always(),
          },
          ({ fetch }, { contractId }) => post(`/contracts/${id(contractId)}/withdraw`, fetch),
        ),
        sendDraft: mutation(
          {
            description: "Send a contract saved as a draft to its signers.",
            input: object({ contractId: string() }),
            approval: always(),
          },
          ({ fetch }, { contractId }) => post(`/contracts/${id(contractId)}/send_draft`, fetch),
        ),
        generatePdfPreview: mutation(
          {
            description:
              "Queue a PDF preview of the contract. The PDF url is delivered by the contract-pdf-generated webhook, not in the response.",
            input: object({ contractId: string() }),
            approval: always(),
          },
          ({ fetch }, { contractId }) => post(`/contracts/${id(contractId)}/generate_pdf_preview`, fetch),
        ),
        getContent: query(
          {
            description: "Get the contract text as markdown (extended markdown includes signer fields).",
            input: object({ contractId: string() }),
          },
          ({ fetch }, { contractId }) => get(`/contracts/${id(contractId)}/content`, fetch),
        ),
        updateContent: mutation(
          {
            description:
              "Edit the contract text. Each edit replaces find_markdown (literal match; a heading line followed by a newline matches the whole section; empty replaces the entire content) with replace_with_markdown. Set dry_run to \"yes\" to preview without saving.",
            input: object({ contractId: string(), edits: Edits, dry_run: string().optional() }),
            approval: always(),
          },
          ({ fetch }, { contractId, ...body }) => post(`/contracts/${id(contractId)}/content`, fetch, body),
        ),
        getPlaceholderFields: query(
          {
            description: "List the placeholder field values currently assigned to a contract.",
            input: object({ contractId: string() }),
          },
          ({ fetch }, { contractId }) => get(`/contracts/${id(contractId)}/placeholder_fields`, fetch),
        ),
        updatePlaceholderFields: mutation(
          {
            description:
              "Update placeholder field values on an unsigned contract. Only the fields included are changed; each is replaced with text, markdown or a template's content.",
            input: object({ contractId: string(), placeholder_fields: array(Placeholder) }),
            approval: always(),
          },
          ({ fetch }, { contractId, ...body }) => post(`/contracts/${id(contractId)}/placeholder_fields`, fetch, body),
        ),
        signers: router({
          add: mutation(
            {
              description:
                "Add a signer to a contract. This does not send the contract to them; use resendRequest afterwards.",
              input: object({ contractId: string(), ...Signer }),
              approval: always(),
            },
            ({ fetch }, { contractId, ...body }) => post(`/contracts/${id(contractId)}/signers`, fetch, body),
          ),
          update: mutation(
            {
              description: "Update a signer's contact details, signature request and signed-document delivery methods, multi-factor authentication and redirect URL. The contract is not re-sent automatically.",
              input: object({ contractId: string(), signerId: string(), ...Signer }),
              approval: always(),
            },
            ({ fetch }, { contractId, signerId, ...body }) =>
              post(`/contracts/${id(contractId)}/signers/${id(signerId)}`, fetch, body),
          ),
          resendRequest: mutation(
            {
              description: "Send (or resend) the signature request to one signer.",
              input: object({ contractId: string(), signerId: string() }),
              approval: always(),
            },
            ({ fetch }, { contractId, signerId }) =>
              post(`/contracts/${id(contractId)}/signers/${id(signerId)}/send_contract`, fetch),
          ),
          delete: mutation(
            {
              description: "Remove a signer from a contract.",
              input: object({ contractId: string(), signerId: string() }),
              approval: always(),
            },
            ({ fetch }, { contractId, signerId }) =>
              post(`/contracts/${id(contractId)}/signers/${id(signerId)}/delete`, fetch),
          ),
        }),
      },
      { title: "Contracts", description: "Create, send, edit and withdraw contracts, and manage their signers." },
    ),
    templates: router(
      {
        list: query(
          { description: "List templates with their ids and titles.", input: object({}) },
          ({ fetch }) => get("/templates", fetch),
        ),
        get: query(
          {
            description: "Get a template with its placeholder fields and signer field ids.",
            input: object({ templateId: string() }),
          },
          ({ fetch }, { templateId }) => get(`/templates/${id(templateId)}`, fetch),
        ),
        create: mutation(
          {
            description: "Create a template from extended markdown. Labels group templates and their contracts.",
            input: object({ title: string(), markdown: string(), labels: array(string()).optional() }),
            approval: always(),
          },
          ({ fetch }, input) => post("/templates", fetch, input),
        ),
        update: mutation(
          {
            description: "Update a template's title or labels.",
            input: object({ templateId: string(), title: string().optional(), labels: array(string()).optional() }),
            approval: always(),
          },
          ({ fetch }, { templateId, ...body }) => post(`/templates/${id(templateId)}`, fetch, body),
        ),
        duplicate: mutation(
          {
            description:
              "Duplicate a template under a new title, optionally filling its placeholder fields. The copy stays in your own account.",
            input: object({
              templateId: string(),
              title: string(),
              placeholder_fields: array(Placeholder).optional(),
            }),
            approval: always(),
          },
          ({ fetch }, { templateId, ...body }) => post(`/templates/${id(templateId)}/duplicate`, fetch, body),
        ),
        delete: mutation(
          {
            description: "Delete a template.",
            input: object({ templateId: string() }),
            approval: always(),
          },
          ({ fetch }, { templateId }) => post(`/templates/${id(templateId)}/delete`, fetch),
        ),
        getContent: query(
          {
            description: "Get the template text as markdown (extended markdown includes signer fields).",
            input: object({ templateId: string() }),
          },
          ({ fetch }, { templateId }) => get(`/templates/${id(templateId)}/content`, fetch),
        ),
        updateContent: mutation(
          {
            description:
              "Edit the template text. Each edit replaces find_markdown (literal match; a heading line followed by a newline matches the whole section; empty replaces the entire content) with replace_with_markdown. Set dry_run to \"yes\" to preview without saving.",
            input: object({ templateId: string(), edits: Edits, dry_run: string().optional() }),
            approval: always(),
          },
          ({ fetch }, { templateId, ...body }) => post(`/templates/${id(templateId)}/content`, fetch, body),
        ),
        collaborators: router({
          list: query(
            {
              description: "List a template's collaborators with their editor urls.",
              input: object({ templateId: string() }),
            },
            ({ fetch }, { templateId }) => get(`/templates/${id(templateId)}/collaborators`, fetch),
          ),
          add: mutation(
            {
              description:
                "Add a collaborator who can edit the template. An email invitation is sent when email is given; otherwise use the returned editor url.",
              input: object({ templateId: string(), name: string().optional(), email: string().optional() }),
              approval: always(),
            },
            ({ fetch }, { templateId, ...body }) => post(`/templates/${id(templateId)}/collaborators`, fetch, body),
          ),
          remove: mutation(
            {
              description: "Remove a collaborator's permission to edit the template.",
              input: object({ templateId: string(), collaboratorId: string() }),
              approval: always(),
            },
            ({ fetch }, { templateId, collaboratorId }) =>
              post(`/templates/${id(templateId)}/collaborators/${id(collaboratorId)}/remove`, fetch),
          ),
        }),
      },
      { title: "Templates", description: "Create, edit, duplicate and delete contract templates and their collaborators." },
    ),
  });
};

export default defineApp({ user: { accounts: { esignatures: esignatures.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.esignatures ?? [],
      async (account) =>
        account.method === "oauth"
          ? withApprovals(
              await mcpRouter({ url: mcpUrl, account, headers: mcpHeaders(account), signal }),
              (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
            )
          : esignaturesTools(account, signal),
      { signal },
    ),
    {
      title: "eSignatures",
      description:
        "Send contracts for e-signature with eSignatures.com: contracts, contract links, signers, placeholder fields, templates, collaborators and users.",
      icons,
    },
  ),
}));
