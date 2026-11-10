import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  literal,
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

const base = "https://oksign.be/services/rest/v1";

const oksign = defineProvider({
  name: "OK!Sign",
  hosts: ["oksign.be"],
  auth: {
    apiKey: secrets({
      label: "API credentials",
      fields: object({
        accountnbr: string({ minLength: 1 }),
        authtoken: string({ minLength: 1 }),
        orgtoken: string({ minLength: 1 }),
      }),
    }),
  },
  // Reading the credit balance is read-only and has the generous 10 requests/second limit.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/credits/retrieve`, {
      signal,
      headers: headers(account),
    });
    await decodeJson(response, object({ status: literal("OK") }));
    return { accountInfo: { externalId: account.fields.accountnbr, displayName: `OK!Sign ${account.fields.accountnbr}` } };
  },
});

type Account = { fields: { accountnbr: string; authtoken: string; orgtoken: string } };

const headers = (account: Account, extra: Record<string, string | undefined> = {}) => {
  const out: Record<string, string> = {
    "x-oksign-authorization": `${account.fields.accountnbr};${account.fields.authtoken};${account.fields.orgtoken}`,
    accept: "application/json; charset=utf-8",
  };
  for (const [key, value] of Object.entries(extra)) if (value !== undefined) out[key] = value;
  return out;
};

const docid = (account: Account, id: string) => headers(account, { "x-oksign-docid": id });
const jsonHeaders = (account: Account, extra: Record<string, string | undefined> = {}) =>
  headers(account, { "content-type": "application/json; charset=utf-8", ...extra });

const Signer = object({
  id: string(),
  name: string().optional(),
  email: string().optional(),
  mobile: string().optional(),
  actingas: string().optional(),
  readonly: boolean().optional(),
});

const bytesFromBase64 = (value: string) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
const toBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};

const oksignTools = (account: Account, signal: AbortSignal) =>
  router(
    {
      documents: router(
        {
          upload: mutation(
            {
              description:
                "Upload a PDF or Word document (max 10 MB) from base64 content. Returns the new docid in reason. Word files are converted to PDF, which takes 10-50 seconds. filename must be US-ASCII (use formdesc.upload filename for other names). Uploading does not send anything to signers; follow with formdesc.upload.",
              input: object({
                filename: string(),
                contentBase64: string(),
                contentType: string({}).default("application/pdf"),
              }),
              approval: always(),
            },
            async ({ fetch }, { filename, contentBase64, contentType }) =>
              decodeJson(
                await fetch(`${base}/document/upload`, {
                  method: "POST",
                  signal,
                  headers: headers(account, { "x-oksign-filename": filename, "content-type": contentType }),
                  body: bytesFromBase64(contentBase64),
                }),
                json(),
              ),
          ),
          retrieve: query(
            {
              description:
                "Download a document (the source or signed PDF) by docid. Returns the PDF as base64 in contentBase64. Limited to 3 requests per second.",
              input: object({ docid: string() }),
            },
            async ({ fetch }, { docid: id }) => {
              const response = await fetch(`${base}/document/retrieve`, {
                signal,
                headers: headers(account, { "x-oksign-docid": id, accept: "application/pdf" }),
              });
              if (!response.ok) throw new Error(`OK!Sign document retrieve failed with HTTP ${response.status}`);
              return { contentBase64: toBase64(await response.arrayBuffer()) };
            },
          ),
          exists: query(
            {
              description: "Check whether a docid exists. Returns reason with filename and template flag.",
              input: object({ docid: string() }),
            },
            async ({ fetch }, { docid: id }) =>
              decodeJson(await fetch(`${base}/document/exists`, { signal, headers: docid(account, id) }), json()),
          ),
          remove: mutation(
            {
              description:
                "Permanently delete a document by docid. Right after a signing callback it can fail with 'Too soon'; retry later.",
              input: object({ docid: string() }),
              approval: always(),
            },
            async ({ fetch }, { docid: id }) =>
              decodeJson(
                await fetch(`${base}/document/remove`, { method: "DELETE", signal, headers: docid(account, id) }),
                json(),
              ),
          ),
          active: query(
            {
              description:
                "List active documents of the account with docid, filename, creator, status, signature counts and signed_docid. Rate limited to one call per 3 minutes.",
              input: object({}),
            },
            async ({ fetch }) =>
              decodeJson(await fetch(`${base}/documents/active`, { signal, headers: headers(account) }), json()),
          ),
          signed: query(
            {
              description:
                "Poll documents signed in a time window (documents uploaded via the API). startTime and endTime are ISO 8601 timestamps. Rate limited to one call per 3 minutes; slide the window forward on each call.",
              input: object({ startTime: string(), endTime: string() }),
            },
            async ({ fetch }, { startTime, endTime }) =>
              decodeJson(
                await fetch(`${base}/documents/signed`, {
                  signal,
                  headers: headers(account, { "x-oksign-starttime": startTime, "x-oksign-endtime": endTime }),
                }),
                json(),
              ),
          ),
          linked: query(
            {
              description:
                "Given a source or signed docid, return the linked source_docid and signed_docid (absent while unsigned). Empty reason means unknown or expired.",
              input: object({ docid: string() }),
            },
            async ({ fetch }, { docid: id }) =>
              decodeJson(await fetch(`${base}/linkedlist/retrieve`, { signal, headers: docid(account, id) }), json()),
          ),
          metadata: query(
            {
              description:
                "Retrieve metadata of a signed document (v2): filename, size, required and valid signature counts, completed fields and signers. Pass the signed docid. Limited to 3 requests per second.",
              input: object({ docid: string() }),
            },
            async ({ fetch }, { docid: id }) =>
              decodeJson(
                await fetch("https://oksign.be/services/rest/v2/metadata/retrieve", {
                  signal,
                  headers: docid(account, id),
                }),
                json(),
              ),
          ),
          auditTrail: query(
            {
              description:
                "Retrieve the audit trail report of a signed document as JSON (reason report plus reasonSignature). Only for documents uploaded after 2023-10-02; kept about 18 months.",
              input: object({ docid: string() }),
            },
            async ({ fetch }, { docid: id }) =>
              decodeJson(
                await fetch(`${base}/audittrail/retrieve`, {
                  signal,
                  headers: headers(account, { "x-oksign-docid": id, "x-oksign-format": "json" }),
                }),
                json(),
              ),
          ),
        },
        { title: "Documents", description: "Upload, download, list and inspect documents and their audit trails." },
      ),
      forms: router(
        {
          upload: mutation(
            {
              description:
                "Upload the form descriptor for an uploaded document: fields (inputtype Text, TextArea, Select, Date, Checkbox or CanvasSIG, with name, pagenbr/posX/posY/width/height or marker, signerid), signersinfo, notifications ({smtp:{to,subject,body,...}, sms:{...}, workflow}), logo, sendtomeonly, filename, assignto. Provide the descriptor as the JSON object `descriptor`. The response reason lists one signing URL per signer; email/SMS notifications are sent if configured (SMS costs 0.2 credits each).",
              input: object({ docid: string(), descriptor: json() }),
              approval: always(),
            },
            async ({ fetch }, { docid: id, descriptor }) =>
              decodeJson(
                await fetch(`${base}/formdesc/upload`, {
                  method: "POST",
                  signal,
                  headers: jsonHeaders(account, { "x-oksign-docid": id }),
                  body: JSON.stringify(descriptor),
                }),
                json(),
              ),
          ),
          retrieve: query(
            {
              description: "Retrieve a document's form descriptor, including fields, reusable flag and signerurls.",
              input: object({ docid: string() }),
            },
            async ({ fetch }, { docid: id }) =>
              decodeJson(await fetch(`${base}/formdesc/retrieve`, { signal, headers: docid(account, id) }), json()),
          ),
          notify: mutation(
            {
              description:
                "Replace pending notifications for a document or briefcase and send new ones. notifications holds smtp and sms settings; optional signersinfo overrides the descriptor's signers. Costs credits.",
              input: object({ docid: string(), notifications: json(), signersinfo: array(Signer).optional() }),
              approval: always(),
            },
            async ({ fetch }, { docid: id, ...body }) =>
              decodeJson(
                await fetch(`${base}/notifications/upload`, {
                  method: "POST",
                  signal,
                  headers: jsonHeaders(account, { "x-oksign-docid": id }),
                  body: JSON.stringify(body),
                }),
                json(),
              ),
          ),
          uploadEmailAttachment: mutation(
            {
              description:
                "Upload a file (base64) to attach to signing emails of a document. Max 7 MB total per document; must happen before formdesc.upload. Returns the attachid.",
              input: object({ docid: string(), filename: string(), contentType: string(), contentBase64: string() }),
              approval: always(),
            },
            async ({ fetch }, { docid: id, filename, contentType, contentBase64 }) =>
              decodeJson(
                await fetch(`${base}/emailattachment/upload`, {
                  method: "POST",
                  signal,
                  headers: headers(account, {
                    "x-oksign-docid": id,
                    "x-oksign-filename": filename,
                    "content-type": contentType,
                  }),
                  body: bytesFromBase64(contentBase64),
                }),
                json(),
              ),
          ),
          removeEmailAttachment: mutation(
            {
              description: "Remove an email attachment by attachid. Fails once the form descriptor has been uploaded.",
              input: object({ attachid: string() }),
              approval: always(),
            },
            async ({ fetch }, { attachid }) =>
              decodeJson(
                await fetch(`${base}/emailattachment/remove`, {
                  method: "DELETE",
                  signal,
                  headers: headers(account, { "x-oksign-attachid": attachid }),
                }),
                json(),
              ),
          ),
        },
        { title: "Forms", description: "Define signature fields, signers and notifications for uploaded documents." },
      ),
      briefcases: router(
        {
          create: mutation(
            {
              description:
                "Bundle several uploaded docids into a briefcase so signers sign them in one session. Optional returnurl, callbackurl, webhookurl, packagename. Returns the briefcase docid and signing URLs.",
              input: object({
                list: array(string()),
                returnurl: string().optional(),
                callbackurl: string().optional(),
                webhookurl: string().optional(),
                packagename: string().optional(),
              }),
              approval: always(),
            },
            async ({ fetch }, input) =>
              decodeJson(
                await fetch(`${base}/briefcase/create`, {
                  method: "POST",
                  signal,
                  headers: jsonHeaders(account),
                  body: JSON.stringify(input),
                }),
                json(),
              ),
          ),
          retrieve: query(
            {
              description: "Retrieve a briefcase (callbackurl, list, orgtoken, packagename, returnurl) by its id.",
              input: object({ docid: string() }),
            },
            async ({ fetch }, { docid: id }) =>
              decodeJson(await fetch(`${base}/briefcase/retrieve`, { signal, headers: docid(account, id) }), json()),
          ),
          remove: mutation(
            {
              description: "Delete a briefcase. The documents inside are kept.",
              input: object({ docid: string() }),
              approval: always(),
            },
            async ({ fetch }, { docid: id }) =>
              decodeJson(
                await fetch(`${base}/briefcase/remove`, { method: "DELETE", signal, headers: docid(account, id) }),
                json(),
              ),
          ),
        },
        { title: "Briefcases", description: "Group documents into one signing package." },
      ),
      signExpress: router(
        {
          create: mutation(
            {
              description:
                "Create a SignExpress token: a signing link for a list of docids and one signer (signerinfo.id required). Optional returnurl, callbackurl, validityperiod (seconds, default 90 days), packagename. Returns id, name, token and url.",
              input: object({
                list: array(string()),
                signerinfo: Signer,
                returnurl: string().optional(),
                callbackurl: string().optional(),
                validityperiod: number().optional(),
                packagename: string().optional(),
              }),
              approval: always(),
            },
            async ({ fetch }, input) =>
              decodeJson(
                await fetch(`${base}/signexpress/create`, {
                  method: "POST",
                  signal,
                  headers: jsonHeaders(account),
                  body: JSON.stringify(input),
                }),
                json(),
              ),
          ),
          retrieve: query(
            {
              description: "Retrieve SignExpress token info, including valid_until and validityperiod.",
              input: object({ token: string() }),
            },
            async ({ fetch }, { token }) =>
              decodeJson(
                await fetch(`${base}/signexpress/retrieve`, {
                  signal,
                  headers: headers(account, { "x-oksign-token": token }),
                }),
                json(),
              ),
          ),
          remove: mutation(
            {
              description: "Revoke a SignExpress token.",
              input: object({ token: string() }),
              approval: always(),
            },
            async ({ fetch }, { token }) =>
              decodeJson(
                await fetch(`${base}/signexpress/remove`, {
                  method: "DELETE",
                  signal,
                  headers: headers(account, { "x-oksign-token": token }),
                }),
                json(),
              ),
          ),
        },
        { title: "SignExpress", description: "Signing links for a signer over a list of documents." },
      ),
      editorExpress: router(
        {
          create: mutation(
            {
              description:
                "Create an EditorExpress token: a link to the OK!Sign editor for exactly one docid in list. Optional contacts [{name,email}], returnurl, validityperiod (seconds, default 1 day), showAnonymousSigners, showTeammembers, showSigningOptions {eid,itsme,smartid,pen,tan}. Returns token and url.",
              input: object({
                list: array(string()),
                contacts: array(object({ name: string(), email: string() })).optional(),
                returnurl: string().optional(),
                validityperiod: number().optional(),
                showAnonymousSigners: boolean().optional(),
                showTeammembers: boolean().optional(),
                showSigningOptions: json().optional(),
              }),
              approval: always(),
            },
            async ({ fetch }, input) =>
              decodeJson(
                await fetch(`${base}/editorexpress/create`, {
                  method: "POST",
                  signal,
                  headers: jsonHeaders(account),
                  body: JSON.stringify(input),
                }),
                json(),
              ),
          ),
          retrieve: query(
            {
              description: "Retrieve EditorExpress token info (list, contacts, returnurl, validityperiod).",
              input: object({ token: string() }),
            },
            async ({ fetch }, { token }) =>
              decodeJson(
                await fetch(`${base}/editorexpress/retrieve`, {
                  signal,
                  headers: headers(account, { "x-oksign-token": token }),
                }),
                json(),
              ),
          ),
          remove: mutation(
            {
              description: "Revoke an EditorExpress token.",
              input: object({ token: string() }),
              approval: always(),
            },
            async ({ fetch }, { token }) =>
              decodeJson(
                await fetch(`${base}/editorexpress/remove`, {
                  method: "DELETE",
                  signal,
                  headers: headers(account, { "x-oksign-token": token }),
                }),
                json(),
              ),
          ),
        },
        { title: "EditorExpress", description: "Links that open the OK!Sign editor for a document." },
      ),
      contacts: router(
        {
          list: query(
            { description: "List the account's saved contacts.", input: object({}) },
            async ({ fetch }) =>
              decodeJson(await fetch(`${base}/contacts/retrieve`, { signal, headers: headers(account) }), json()),
          ),
          upload: mutation(
            {
              description:
                "Insert or update contacts, identified by email plus name. Each contact: email, name, optional actingas, mobile (E.164), group. clean=true replaces the whole contact list. Invalid contacts are skipped and reported.",
              input: object({
                contacts: array(
                  object({
                    email: string(),
                    name: string(),
                    actingas: string().optional(),
                    mobile: string().optional(),
                    group: string().optional(),
                  }),
                ),
                clean: boolean().default(false),
              }),
              approval: always(),
            },
            async ({ fetch }, { contacts, clean }) =>
              decodeJson(
                await fetch(`${base}/contacts/upload`, {
                  method: "POST",
                  signal,
                  headers: jsonHeaders(account, { "x-oksign-clean": String(clean) }),
                  body: JSON.stringify(contacts),
                }),
                json(),
              ),
          ),
          remove: mutation(
            {
              description: "Delete contacts, each identified by email and name.",
              input: object({ contacts: array(object({ email: string(), name: string() })) }),
              approval: always(),
            },
            async ({ fetch }, { contacts }) =>
              decodeJson(
                await fetch(`${base}/contacts/remove`, {
                  method: "POST",
                  signal,
                  headers: jsonHeaders(account),
                  body: JSON.stringify(contacts),
                }),
                json(),
              ),
          ),
        },
        { title: "Contacts", description: "The account's address book of signers." },
      ),
      account: router(
        {
          credits: query(
            {
              description: "Credit and storage information: account_size, max_account_size, paid, quantity, subscription, validuntil.",
              input: object({}),
            },
            async ({ fetch }) =>
              decodeJson(await fetch(`${base}/credits/retrieve`, { signal, headers: headers(account) }), json()),
          ),
          users: query(
            { description: "List the account's users (actingas, email, language, mobile, name, role, signerid, status).", input: object({}) },
            async ({ fetch }) =>
              decodeJson(await fetch(`${base}/users/retrieve`, { signal, headers: headers(account) }), json()),
          ),
          emailTemplates: query(
            { description: "List the account's email templates (id, name, subject, body, repeat, reminder_days).", input: object({}) },
            async ({ fetch }) =>
              decodeJson(await fetch(`${base}/email-templates/retrieve`, { signal, headers: headers(account) }), json()),
          ),
          webhookErrors: query(
            {
              description:
                "Poll email and SMS delivery errors (event: hard_bounce, soft_bounce, blocked, spam, invalid_email or deferred; type smtp or sms) in a window. startTime and endTime are ISO 8601. One call per 3 minutes.",
              input: object({ startTime: string(), endTime: string() }),
            },
            async ({ fetch }, { startTime, endTime }) =>
              decodeJson(
                await fetch(`${base}/webhooks/retrieve`, {
                  signal,
                  headers: headers(account, { "x-oksign-starttime": startTime, "x-oksign-endtime": endTime }),
                }),
                json(),
              ),
          ),
          updateOrgToken: mutation(
            {
              description:
                "Set the callback, return and webhook URLs linked to the organisation token in use. All three are required; use an empty string to clear one.",
              input: object({ callbackurl: string(), returnurl: string(), webhookurl: string() }),
              approval: always(),
            },
            async ({ fetch }, input) =>
              decodeJson(
                await fetch(`${base}/orgtokeninfo/update`, {
                  method: "POST",
                  signal,
                  headers: jsonHeaders(account),
                  body: JSON.stringify(input),
                }),
                json(),
              ),
          ),
        },
        { title: "Account", description: "Credits, users, templates, delivery errors and URL settings." },
      ),
    },
  );

export default defineApp({ user: { accounts: { oksign: oksign.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.oksign ?? [], (account) => oksignTools(account, signal), { signal }), {
    title: "OK!Sign",
    description: "Send documents for legal e-signature: upload documents, define signature forms, track signing, retrieve signed PDFs and audit trails.",
    icons,
  }),
}));
