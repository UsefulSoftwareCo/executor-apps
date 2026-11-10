import {
  accountRouter,
  boolean,
  decodeJson,
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
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// The subdomain is interpolated into the request host, so reject anything that could change the target.
const baseUrl = (subdomain: string) => {
  if (!/^[a-z0-9-]+$/.test(subdomain)) throw new Error("noCRM.io subdomain must contain only lowercase letters, digits and hyphens.");
  return `https://${subdomain}.nocrm.io/api/v2`;
};

const nocrm = defineProvider({
  name: "NoCRM.io",
  hosts: ["*.nocrm.io"],
  auth: {
    // An admin creates API keys in the account's admin section; the key grants admin rights.
    apiKey: secrets({
      label: "API key",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
      request: ({ token }) => header("x-api-key", token),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${baseUrl(account.fields.subdomain)}/ping`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    await decodeJson(response, object({ status: number() }));
    return { accountInfo: { externalId: account.fields.subdomain, displayName: account.fields.subdomain } };
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Where = "path" | "query";
type Field = [name: string, type: Type, required: boolean, where: Where];


const s = (name: string, required = false): Field => [name, "string", required, "query"];
const n = (name: string): Field => [name, "number", false, "query"];

const lim = [n("limit"), n("offset")];

// A write sends `body` as the JSON request body ("*"), as the vendor documents flat parameters.
type Row = [
  resource: string,
  action: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  description: string,
  fields: Field[],
  wrapper?: string,
];

const note = "body holds the parameters exactly as noCRM.io documents them (https://www.nocrm.io/api).";

const rows: Row[] = [
  ["account", "ping", "GET", "/ping", "Check that the API key is valid.", []],

  ["leads", "list", "GET", "/leads", "List leads. status is a comma-separated list of todo, standby, won, cancelled, lost; step is comma-separated names or ids (not mixed); order is id, creation_date, last_update, next_action, sale_step, amount, probability, probalized_amount or alphabetically; date_range_type is creation, update, next_action or closed. limit is at most 100.", [s("status"), s("step"), s("starred"), s("user_id"), s("email"), s("tags"), s("field_key"), s("field_value"), s("updated_after"), s("start_date"), s("end_date"), s("date_range_type"), s("include_unassigned"), s("order"), s("direction"), ...lim]],
  ["leads", "unassigned", "GET", "/leads/unassigned", "List unassigned leads.", [n("limit")]],
  ["leads", "get", "GET", "/leads/{id}", "Retrieve a lead.", []],
  ["leads", "create", "POST", "/leads", `Create a lead (title and description are required; optional user_id, tags, created_at, step, and fields). ${note}`, [], "*"],
  ["leads", "update", "PUT", "/leads/{id}", `Update a lead: title, description, status, remind_date, remind_time, reminder_duration, reminder_activity_id, reminder_note, amount, probability, starred, step (id or name), tags (array), created_at, estimated_closing_date, fields (array of { key, value }), append_desc, user_id. remind_date is mandatory when status becomes standby; description cannot be combined with fields or append_desc. ${note}`, [], "*"],
  ["leads", "assign", "POST", "/leads/{id}/assign", "Assign a lead. body is { user_id } (id or email).", [], "*"],
  ["leads", "duplicate", "POST", "/leads/{id}/duplicate_lead", "Duplicate a lead. body is optionally { step }.", [], "*"],
  ["leads", "addToClientFolder", "POST", "/leads/{id}/add_to_client", "Add a lead to a client folder. body is { client_id }.", [], "*"],
  ["leads", "businessCard", "GET", "/leads/{id}/business_card", "Retrieve a lead's business card.", []],
  ["leads", "duplicates", "GET", "/leads/{id}/duplicates", "List leads that duplicate this one (matched on title and key default fields).", []],
  ["leads", "actionHistories", "GET", "/leads/{id}/action_histories", "List a lead's action history. from and to are dates; action_type, action_value and user_ids filter; direction asc or desc; limit at most 100.", [s("from"), s("to"), s("action_type"), s("action_value"), s("user_ids"), s("direction"), ...lim]],
  ["leads", "sendEmailFromTemplate", "POST", "/leads/{id}/emails/send_email_from_template", "Send an email from a template (Dreamteam edition). body is { email_template_id, from_user_id }.", [], "*"],
  ["leads", "delete", "DELETE", "/leads/{id}", "Delete a lead.", []],
  ["leads", "deleteMultiple", "DELETE", "/leads/delete_multiple", "Delete several leads. body is { ids } with ids a comma-separated string. Returns the ids that could not be deleted.", [], "*"],

  ["comments", "list", "GET", "/leads/{lead_id}/comments", "List a lead's comments. direction is asc or desc.", [s("direction")]],
  ["comments", "create", "POST", "/leads/{lead_id}/comments", `Comment on a lead (content required; optional user_id, activity_id, created_at). ${note}`, [], "*"],
  ["comments", "update", "PUT", "/leads/{lead_id}/comments/{id}", `Update a comment (content required; optional activity_id, is_pinned). ${note}`, [], "*"],
  ["comments", "delete", "DELETE", "/leads/{lead_id}/comments/{id}", "Delete a comment.", []],

  ["attachments", "list", "GET", "/leads/{lead_id}/attachments", "List a lead's attachments.", []],
  ["attachments", "get", "GET", "/leads/{lead_id}/attachments/{id}", "Get an attachment's short-lived download URL.", []],
  ["attachments", "delete", "DELETE", "/leads/{lead_id}/attachments/{id}", "Delete an attachment.", []],

  ["followUps", "list", "GET", "/follow_ups", "List post-sales follow-ups. One of lead_id or user_id is required; status is todo, standby or done.", [n("lead_id"), s("user_id"), s("status")]],
  ["followUps", "createFromTemplate", "POST", "/leads/{lead_id}/follow_ups/create_from_template", "Create a post-sales process on a lead. body is { post_sales_template_id }.", [], "*"],
  ["followUps", "updateTask", "PUT", "/follow_ups/{follow_up_id}/tasks/{task_id}", `Update a post-sales task: status, remind_date (mandatory for standby), remind_time, reminder_duration. ${note}`, [], "*"],

  ["pipeline", "steps", "GET", "/steps", "List pipeline steps. direction is asc or desc.", [s("direction")]],
  ["pipeline", "step", "GET", "/steps/{id}", "Retrieve a step by id or URL-encoded name.", []],
  ["pipeline", "pipelines", "GET", "/pipelines", "List pipelines.", []],
  ["pipeline", "activities", "GET", "/activities", "List activity types.", []],

  ["clientFolders", "list", "GET", "/clients", "List client folders. order is name or id; direction asc or desc.", [s("order"), s("direction")]],
  ["clientFolders", "get", "GET", "/clients/{id}", "Retrieve a client folder.", []],
  ["clientFolders", "create", "POST", "/clients", `Create a client folder (name required; optional description, user_id). ${note}`, [], "*"],
  ["clientFolders", "update", "PUT", "/clients/{id}", `Update a client folder: name, description, is_active. ${note}`, [], "*"],
  ["clientFolders", "delete", "DELETE", "/clients/{id}", "Delete a client folder.", []],

  ["tags", "categories", "GET", "/categories", "List tag categories. include_tags is true or false.", [s("include_tags")]],
  ["tags", "createCategory", "POST", "/category", `Create a tag category (name required). ${note}`, [], "*"],
  ["tags", "list", "GET", "/predefined_tags", "List predefined tags.", []],
  ["tags", "create", "POST", "/predefined_tags", `Create a predefined tag (name and category_id required). ${note}`, [], "*"],

  ["fields", "list", "GET", "/fields", "List custom fields. type is lead or client.", [s("type")]],
  ["fields", "create", "POST", "/fields", `Create a field (name up to 32 chars, parent_type lead or client; optional type, is_key). ${note}`, [], "*"],

  ["users", "list", "GET", "/users", "List users. status is all, activated or deactivated.", [s("email"), s("lastname"), s("firstname"), s("status"), s("direction"), s("role"), s("teams")]],
  ["users", "get", "GET", "/users/{id}", "Retrieve a user by id or URL-encoded email.", []],
  ["users", "create", "POST", "/users", `Create a user (email required; optional lastname, firstname, is_admin, dont_send_email). Before creating the user noCRM.io tries to charge the account for the remaining days of the billing cycle, and creation fails if the charge fails or no payment method exists. ${note}`, [], "*"],
  ["users", "sendActivationEmail", "GET", "/users/{id}/send_activation_email", "Sends an activation email to the user (304 if already activated). Side effect: an email is delivered.", []],
  ["users", "disable", "PUT", "/users/{id}/disable", "Disable a user.", []],

  ["teams", "list", "GET", "/teams", "List teams (403 when the Teams feature is off).", []],
  ["teams", "get", "GET", "/teams/{id}", "Retrieve a team by id or name.", []],
  ["teams", "create", "POST", "/teams", `Create a team (name). ${note}`, [], "*"],
  ["teams", "update", "PUT", "/teams/{id}", `Rename a team (name). ${note}`, [], "*"],
  ["teams", "delete", "DELETE", "/teams/{id}", "Delete a team.", []],
  ["teams", "addMember", "POST", "/teams/{id}/add_member", "Add a member. body is { user_id, is_manager? }.", [], "*"],
  ["teams", "removeMember", "DELETE", "/teams/{id}/remove_member", "Remove a member. body is { user_id } (id or email).", [], "*"],

  ["prospectingLists", "list", "GET", "/spreadsheets", "List prospecting lists. order is id, created_at or updated_at.", [s("title"), s("order"), s("direction"), ...lim]],
  ["prospectingLists", "get", "GET", "/spreadsheets/{id}", "Retrieve a prospecting list.", []],
  ["prospectingLists", "create", "POST", "/spreadsheets", `Create a prospecting list (title and content required, first row is the header; max 5000 rows, 26 columns; optional description, tags, user_id, privacy). ${note}`, [], "*"],
  ["prospectingLists", "assign", "POST", "/spreadsheets/{id}/assign", "Assign a list. body is { user_id }.", [], "*"],
  ["prospectingLists", "comment", "POST", "/spreadsheets/{spreadsheet_id}/comments", `Comment on a list (content required). ${note}`, [], "*"],
  ["prospects", "find", "GET", "/rows", "Find prospects by email, or by field_key with field_value.", [s("email"), s("field_key"), s("field_value")]],
  ["prospects", "calledFrom", "GET", "/rows/called_from", "List prospects called from a phone number.", [["phone_number", "string", true, "query"]]],
  ["prospects", "add", "POST", "/spreadsheets/{spreadsheet_id}/rows", "Add prospects. body is { content } where content is a JSON-encoded string of an array of arrays, at most 100 rows.", [], "*"],
  ["prospects", "update", "PUT", "/spreadsheets/{spreadsheet_id}/rows/{id}", "Update a prospect. body is { content } where content is a JSON-encoded string of an array of column values.", [], "*"],
  ["prospects", "updateFields", "PUT", "/spreadsheets/{spreadsheet_id}/rows/{id}/update_fields", "Update a prospect's fields. body is { fields } where fields is a JSON hash keyed by column name, encoded as a string.", [], "*"],
  ["prospects", "createLead", "POST", "/spreadsheets/{spreadsheet_id}/rows/{id}/create_lead", "Create a lead from a prospect.", []],
  ["prospects", "comment", "POST", "/spreadsheets/{spreadsheet_id}/rows/{id}/comments", `Comment on a prospect (content required). ${note}`, [], "*"],
  ["prospects", "updateComment", "PUT", "/spreadsheets/{spreadsheet_id}/rows/{prospect_id}/comments/{id}", `Update a prospect comment (content required; optional activity_id, is_pinned). ${note}`, [], "*"],
  ["prospects", "delete", "DELETE", "/spreadsheets/{spreadsheet_id}/rows/{id}", "Delete a prospect.", []],

  ["webhooks", "list", "GET", "/webhooks", "List webhooks.", []],
  ["webhooks", "create", "POST", "/webhooks", `Create a webhook (event, target_type url or email, target; optional name, add_to_lead_action_menu). ${note}`, [], "*"],
  ["webhooks", "activate", "PUT", "/webhooks/{id}/activate", "Activate a webhook.", []],
  ["webhooks", "disable", "DELETE", "/webhooks/{id}", "Disable a webhook.", []],
  ["webhookEvents", "list", "GET", "/webhook_events", "List webhook events of the last 10 days (admin only).", []],
  ["webhookEvents", "get", "GET", "/webhook_events/{id}", "Retrieve a webhook event.", []],
];

// GET endpoints that nonetheless have side effects are built as mutations so they require approval.
const sideEffects = new Set(["users.sendActivationEmail"]);

type Account = {
  fields: { subdomain: string };
  headers(): Record<string, string>;
  url(input: string): string;
};

function fieldsOf(path: string, extra: Field[], wrapper: string | undefined): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)].map((m) => [m[1]!, "string", true, "path"]);
  const body: Field[] = wrapper === undefined ? [] : [["body", "json", true, "query"]];
  return [...pathFields, ...extra, ...body];
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

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (
    method: string,
    path: string,
    fields: Field[],
    wrapper: string | undefined,
    input: Record<string, unknown>,
  ) => {
    let target = path;
    const params = new URLSearchParams();
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (name === "body" || value === undefined || value === null) continue;
      if (where === "path") target = target.replace(`{${name}}`, encodeURIComponent(String(value)));
      else params.set(name, String(value));
    }
    const hasBody = wrapper !== undefined && input.body !== undefined;
    const payload = hasBody ? (wrapper === "*" ? input.body : { [wrapper]: input.body }) : undefined;
    const url = `${baseUrl(account.fields.subdomain)}${target}${params.size > 0 ? `?${params.toString()}` : ""}`;
    const response = await fetcher(account.url(url), {
      method,
      signal,
      headers: {
        ...account.headers(),
        Accept: "application/json",
        ...(hasBody ? { "content-type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(payload) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`noCRM.io answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, description, extra, wrapper] of rows) {
    const fields = fieldsOf(path, extra, wrapper);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, wrapper, input);
    const tool = method === "GET" && !sideEffects.has(`${resource}.${action}`) ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { nocrm: nocrm.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.nocrm ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "NoCRM.io",
        description:
          "noCRM.io lead management: leads, comments, client folders, pipelines, tags, fields, users, teams, prospecting lists and webhooks.",
        instructions:
          "Writes take a body of the parameters noCRM.io documents. Lists are paged with limit (max 100) and offset. The API allows 2000 requests per day per account; unassigned leads accept only user_id, title and description updates.",
        icons,
      },
    ),
  }),
);
