import {
  accountRouter,
  boolean,
  defineApp,
  defineProvider,
  header,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  t,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every FuseDesk account lives on its own host: https://<appname>.fusedesk.com.
const siteUrl = (appName: string) => {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]{0,61}[a-z0-9])(?:\.fusedesk\.com)?\/?$/.exec(
    appName.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter the <appname> of <appname>.fusedesk.com (letters, digits, hyphens).");
  return `https://${match[1]}.fusedesk.com`;
};

const fusedesk = defineProvider({
  name: "FuseDesk",
  hosts: ["*.fusedesk.com"],
  auth: {
    // FuseDesk admins create keys under Settings > API Keys; each key carries its own permissions.
    // FuseDesk offers no OAuth for third-party apps.
    apiKey: secrets({
      label: "API key",
      fields: object({
        appName: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
      request: ({ apiKey }) => header("x-fusedesk-api-key", t`${apiKey}`),
    }),
  },
  // Reps are listed on the public API page under v1. Listing them needs no special permission beyond a valid key; a bad key answers 401.
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${siteUrl(account.fields.appName)}/api/v1/reps/`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`FuseDesk answered ${response.status}: ${(await response.text()).slice(0, 300)}`);
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Field = [name: string, type: Type, required: boolean, where: "path" | "query" | "body"];

const s = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "string", required, where];
const n = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "number", required, where];
const b = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "boolean", required, where];
const j = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "json", required, where];

// Search endpoints take limit/offset paging.
const paging = [n("limit", "query"), n("offset", "query")];

type Row = [resource: string, action: string, method: string, path: string, description: string, fields: Field[]];

const caseBody = [
  s("summary"), s("details"), s("contactid"), s("contactUuid"), s("companyid"), s("repid"), s("depid"),
];

const contactBody = [
  s("firstName"), s("lastName"), s("emailAddress"), s("emailAddress2"), s("emailAddress3"), s("phone1"), s("phoneExt1"),
  s("phone2"), s("phoneExt2"), s("company"), s("timeZone"), s("website"), s("street1Billing"), s("street2Billing"),
  s("cityBilling"), s("stateBilling"), s("postalBilling"), s("countryBilling"),
];

const departmentBody = [
  b("allReps"), j("repUserIds"), s("replyTemplateId"), s("templateCategory"), n("stale"), n("staleWarning"),
  n("feedbackDelay"), n("feedbackSample"), s("feedbackTemplateId"),
];

const rows: Row[] = [
  // Cases
  ["cases", "search", "GET", "/api/v1/cases/", "Search cases. Filter by contactid, contactUuid, email, companyid, status (new, open, closed), repid, createdByRep, depid, from, subject and the date fields (date_opened, date_assigned, date_firstresponse, date_closed, date_updated). Page with limit and offset; orderby sets the sort column.", [s("contactid", "query"), s("contactUuid", "query"), s("email", "query"), s("companyid", "query"), s("status", "query"), s("repid", "query"), s("createdByRep", "query"), s("depid", "query"), s("from", "query"), s("subject", "query"), s("date_opened", "query"), s("date_assigned", "query"), s("date_firstresponse", "query"), s("date_closed", "query"), s("date_updated", "query"), s("orderby", "query"), ...paging]],
  ["cases", "get", "GET", "/api/v1/cases/{caseId}", "Retrieve one case.", []],
  ["cases", "create", "POST", "/api/v1/cases/", "Create a case. Requires openedby (who opened it, such as the customer's name), summary, details and depid (department id). Optional: repid, contactUuid, contactid (CRM contact), companyid (CRM company), status (new, open or closed; default new), casetags (CSV or array of case tag ids or names; unknown names are created), date_opened, date_assigned.", [s("openedby", "body", true), s("summary", "body", true), s("details", "body", true), s("depid", "body", true), s("repid"), s("contactUuid"), s("contactid"), s("companyid"), s("status"), j("casetags"), s("date_opened"), s("date_assigned")]],
  ["cases", "update", "POST", "/api/v1/cases/{caseId}", "Update a case. Send only the fields to change. status is one of new, open, closed, keepclosed or unopen; repid transfers to a rep; depid transfers to a department; contactid, contactUuid and companyid relink it.", [...caseBody, s("status")]],
  ["cases", "bulkUpdate", "POST", "/api/v1/cases/update/", "Take one action on many cases at once. caseids is a comma-separated list of case ids; set one of status, repid, depid, tagid, crmAutomationId, crmTagId, snooze or merge to say what to do.", [s("caseids", "query", true), s("tagid", "query"), s("status", "query"), s("repid", "query"), s("depid", "query"), s("crmAutomationId", "query"), s("crmTagId", "query"), s("snooze", "query"), s("merge", "query")]],
  ["cases", "applyTag", "POST", "/api/v1/cases/{caseId}/tag/{caseTagId}", "Apply a case tag to a case.", []],
  ["cases", "removeTag", "POST", "/api/v1/cases/{caseId}/untag/{caseTagId}", "Remove a case tag from a case.", []],
  ["cases", "addNote", "POST", "/api/v1/cases/{caseId}/addnote", "Add a note or logged call to a case. type is note or call; status optionally sets the case status afterwards (new, open or closed).", [s("type", "body", true), s("title", "body", true), s("note", "body", true), s("repid"), s("templateid"), s("status")]],
  ["cases", "reply", "POST", "/api/v1/cases/{caseId}/reply", "Reply to a case by email. to, from, cc and bcc are required (cc and bcc may be empty strings; an empty to defaults to the contact's email) unless templateid names an email template, which supplies defaults. Each address can be user@domain.tld or \"Name\" <user@domain.tld>. Give body (plain text) and/or html.", [s("to"), s("from"), s("cc"), s("bcc"), s("body"), s("html"), s("templateid")]],
  ["cases", "snooze", "POST", "/api/v1/cases/{caseId}/snooze", "Snooze a case until a later date and time. until may be relative, for example \"+3 days\".", [s("until", "body", true)]],
  ["cases", "getFeedback", "GET", "/api/v1/cases/{caseId}/feedback/", "Get the customer feedback data for a case.", []],
  ["cases", "disableFeedback", "POST", "/api/v1/cases/{caseId}/feedback/dontask", "Stop asking for feedback when this case closes.", []],
  ["cases", "enableFeedback", "POST", "/api/v1/cases/{caseId}/feedback/doask", "Resume asking for feedback when this case closes.", []],
  ["cases", "requestFeedback", "POST", "/api/v1/cases/{caseId}/feedback/request", "Send the feedback request for a case now.", []],

  // Case tags
  ["caseTags", "list", "GET", "/api/v1/casetags/", "List case tags.", []],
  ["caseTags", "create", "POST", "/api/v1/casetags/", "Create a case tag.", [s("tagname", "body", true)]],
  ["caseTags", "delete", "DELETE", "/api/v1/casetags/{caseTagId}", "Delete (archive) a case tag.", []],

  // Emails
  ["emails", "listUnassigned", "GET", "/api/v1/emails/unassigned/", "List or search emails not yet assigned to a case. Filter with subject, from and content; bodylimit sets how many characters of each body to return (default 150, or all).", [s("orderby", "query"), s("bodylimit", "query"), s("content", "query"), s("subject", "query"), s("from", "query"), ...paging]],
  ["emails", "get", "GET", "/api/v1/emails/{emailId}", "Retrieve one email.", []],

  // Contacts
  ["contacts", "search", "GET", "/api/v2/contacts/", "Search contacts with the search term.", [s("search", "query", true)]],
  ["contacts", "get", "GET", "/api/v2/contacts/{contactId}", "Retrieve a contact.", []],
  ["contacts", "create", "POST", "/api/v2/contacts/", "Create a contact. Linked to a matching CRM contact when one exists, otherwise created in the CRM too.", [...contactBody]],
  ["contacts", "update", "POST", "/api/v2/contacts/{contactId}", "Update a contact. Send only the fields to change; the linked CRM contact is updated too.", [...contactBody]],

  // Reps
  ["reps", "list", "GET", "/api/v2/reps/", "List reps (support agents).", []],
  ["reps", "get", "GET", "/api/v2/reps/{userId}", "Retrieve one rep by user id.", []],

  // Departments
  ["departments", "list", "GET", "/api/v2/departments/", "List active departments.", []],
  ["departments", "listArchived", "GET", "/api/v2/departments/archived/", "List archived departments.", []],
  ["departments", "listAll", "GET", "/api/v2/departments/all/", "List all departments, active and archived.", []],
  ["departments", "get", "GET", "/api/v2/departments/{departmentId}", "Retrieve a department.", []],
  ["departments", "create", "POST", "/api/v2/departments/", "Create a department. Departments cannot be renamed afterwards.", [s("name", "body", true)]],
  ["departments", "update", "POST", "/api/v2/departments/{departmentId}", "Update a department. Send only the fields to change. repUserIds is an array or CSV of rep ids; allReps includes all current and future reps. stale and staleWarning are hours before a case turns red and yellow; feedbackDelay is days after closing before asking for feedback; feedbackSample is the percent of cases to ask (0-100).", [...departmentBody]],
  ["departments", "archive", "DELETE", "/api/v2/departments/{departmentId}", "Archive a department.", []],
  ["departments", "restore", "POST", "/api/v2/departments/{departmentId}/restore", "Restore an archived department.", []],

  // Chats
  ["chats", "list", "GET", "/api/v1/chats/", "List chats.", [...paging]],
  ["chats", "get", "GET", "/api/v1/chats/{chatId}", "Retrieve a chat.", []],
  ["chats", "update", "POST", "/api/v1/chats/{chatId}", "Update a chat: rename it (title), transfer it (repId, departmentId), relink it (contactUuid, caseId), rename the client (clientName) or set the unseen message count (unseen, 0 marks all seen).", [s("title"), s("repId"), s("departmentId"), s("contactUuid"), s("clientName"), s("caseId"), s("unseen")]],
  ["chats", "close", "POST", "/api/v1/chats/{chatId}/close", "Close (resolve) a chat. Optionally create a case from it by giving repid and depid; status is the new case's status (new, open or closed).", [s("repid"), s("depid"), s("status")]],

  // Webhooks
  ["webhooks", "list", "GET", "/api/v2/webhooks/", "List webhook subscriptions.", []],
  ["webhooks", "create", "POST", "/api/v2/webhooks/", "Subscribe a URL to events. objectType is case, contact, rep or department; action is create or update (cases also support status, close and transfer); url is where FuseDesk POSTs.", [s("objectType", "body", true), s("action", "body", true), s("url", "body", true)]],
  ["webhooks", "delete", "DELETE", "/api/v2/webhooks/{webhookId}", "Delete a webhook subscription.", []],
];

function fieldsOf(path: string, extra: Field[]): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)].map((m) => [
    m[1]!,
    "string",
    true,
    "path",
  ]);
  return [...pathFields, ...extra];
}

function schemaFor(fields: Field[]) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [name, type, required] of fields) {
    const base: Schema<unknown, boolean> =
      type === "number" ? number() : type === "boolean" ? boolean() : type === "json" ? json() : string();
    shape[name] = required ? base : base.optional();
  }
  return object(shape);
}

// The schema builders carry no per-field descriptions, so parameter docs go in the tool description.
function describe(description: string, fields: Field[]): string {
  if (fields.length === 0) return description;
  const params = fields.map(([name, type, required]) => `- ${name} (${type}${required ? ", required" : ""})`);
  return `${description}\n\nParameters:\n${params.join("\n")}`;
}

type Account = {
  fields: { appName: string };
  url: (url: string) => string;
  headers: () => Record<string, string>;
};

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const base = siteUrl(account.fields.appName);

  const call = async (method: string, path: string, fields: Field[], input: Record<string, unknown>) => {
    let url = path;
    const search = new URLSearchParams();
    const body: Record<string, unknown> = {};
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (value === undefined || value === null) continue;
      if (where === "path") url = url.replace(`{${name}}`, encodeURIComponent(String(value)));
      else if (where === "query") search.set(name, String(value));
      else body[name] = Array.isArray(value) ? value.join(",") : value;
    }
    const hasBody = method !== "GET" && method !== "DELETE" && Object.keys(body).length > 0;
    const queryString = search.size > 0 ? `?${search.toString()}` : "";
    const response = await fetcher(account.url(`${base}${url}${queryString}`), {
      method,
      signal,
      headers: {
        ...account.headers(),
        Accept: "application/json",
        ...(hasBody ? { "content-type": "application/x-www-form-urlencoded" } : {}),
      },
      body: hasBody ? new URLSearchParams(Object.entries(body).map(([k, v]) => [k, String(v)])).toString() : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`FuseDesk answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, description, extra] of rows) {
    const fields = fieldsOf(path, extra);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, input);
    const tool = method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { fusedesk: fusedesk.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.fusedesk ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "FuseDesk",
        description:
          "FuseDesk help desk: cases, notes and email replies, contacts, departments, reps, case tags, chats, unassigned emails and webhooks.",
        icons,
      },
    ),
  }),
);
