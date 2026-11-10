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

// Every Qualtrics brand lives on its own datacenter host: https://<datacenter>.qualtrics.com
// (for example fra1.qualtrics.com or yourorg.co1.qualtrics.com).
const siteUrl = (datacenter: string) => {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9.-]{0,100}[a-z0-9])\/?$/.exec(datacenter.trim().toLowerCase());
  if (match === null || !match[1]!.endsWith(".qualtrics.com"))
    throw new Error("Enter your Qualtrics host, for example yourorg.co1.qualtrics.com or fra1.qualtrics.com.");
  return `https://${match[1]}`;
};

const WhoAmI = object({ result: object({ userId: string() }) });

const qualtrics = defineProvider({
  name: "Qualtrics",
  hosts: ["*.qualtrics.com"],
  auth: {
    // Qualtrics API tokens go in the X-API-TOKEN header. Qualtrics OAuth endpoints are per-datacenter
    // (https://<host>/oauth2/...), which an app cannot declare statically, so OAuth is not offered.
    apiToken: secrets({
      label: "API token",
      fields: object({
        host: plain(string({ minLength: 1 })),
        apiToken: string({ minLength: 1 }),
      }),
      request: ({ apiToken }) => header("x-api-token", apiToken),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${siteUrl(account.fields.host)}/API/v3/whoami`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    const me = await decodeJson(response, WhoAmI);
    return { accountInfo: { externalId: me.result.userId } };
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Field = [name: string, type: Type, required: boolean, where: "path" | "query" | "body"];

const s = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "string", required, where];
const n = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "number", required, where];
const b = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "boolean", required, where];
const j = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "json", required, where];

type Row = [resource: string, action: string, method: string, path: string, description: string, fields: Field[]];

const rows: Row[] = [
  // Account
  ["account", "whoami", "GET", "/whoami", "Details about the authenticated user and brand (user id, brand id, account type).", []],

  // Surveys
  ["surveys", "list", "GET", "/surveys", "List surveys the user can access. Page with offset (the nextPage url in the result carries the next offset).", [s("offset", "query")]],
  ["surveys", "get", "GET", "/surveys/{surveyId}", "Retrieve a survey's metadata (name, owner, status, dates).", []],
  ["surveys", "create", "POST", "/survey-definitions", "Create a new survey. SurveyName and Language (for example EN) are required; ProjectCategory is CORE, EX or similar.", [s("SurveyName", "body", true), s("Language", "body", true), s("ProjectCategory")]],
  ["surveys", "updateMetadata", "PUT", "/survey-definitions/{surveyId}/metadata", "Update a survey's metadata. SurveyMetadata is an object of properties to change (SurveyName, SurveyStatus, SurveyDescription ...).", [j("SurveyMetadata", "body", true)]],
  ["surveys", "delete", "DELETE", "/survey-definitions/{surveyId}", "Permanently delete a survey.", []],
  ["surveys", "getDefinition", "GET", "/survey-definitions/{surveyId}", "Retrieve the full survey definition: questions, blocks, flow and options.", [s("format", "query")]],
  ["surveys", "getMetadata", "GET", "/survey-definitions/{surveyId}/metadata", "Retrieve a survey's definition metadata. select is a comma-separated list of metadata keys to return.", [s("select", "query")]],
  ["surveys", "getOptions", "GET", "/survey-definitions/{surveyId}/options", "Retrieve a survey's options (look and feel, expiry, back button, etc.).", []],
  ["surveys", "updateOptions", "PUT", "/survey-definitions/{surveyId}/options", "Update a survey's options. Send the option properties to set at the top level.", [j("options", "body", true)]],
  ["surveys", "getFlow", "GET", "/survey-definitions/{surveyId}/flow", "Retrieve a survey's flow.", []],
  ["surveys", "updateFlow", "PUT", "/survey-definitions/{surveyId}/flow", "Replace a survey's flow. Send the full flow object as `flow`.", [j("flow", "body", true)]],

  // Questions and blocks
  ["questions", "list", "GET", "/survey-definitions/{surveyId}/questions", "List a survey's questions.", []],
  ["questions", "get", "GET", "/survey-definitions/{surveyId}/questions/{questionId}", "Retrieve one question definition.", []],
  ["questions", "create", "POST", "/survey-definitions/{surveyId}/questions", "Create a question. question is the question definition (QuestionText, QuestionType, Selector, Choices ...); blockId optionally places it in a block.", [j("question", "body", true), s("blockId", "query")]],
  ["questions", "update", "PUT", "/survey-definitions/{surveyId}/questions/{questionId}", "Update a question. question is the full updated question definition.", [j("question", "body", true)]],
  ["questions", "delete", "DELETE", "/survey-definitions/{surveyId}/questions/{questionId}", "Delete a question.", []],
  ["blocks", "list", "GET", "/survey-definitions/{surveyId}/blocks", "List a survey's blocks.", []],
  ["blocks", "get", "GET", "/survey-definitions/{surveyId}/blocks/{blockId}", "Retrieve one block.", []],
  ["blocks", "create", "POST", "/survey-definitions/{surveyId}/blocks", "Create a block. Type is Default or Trash; Description names it; BlockElements lists elements.", [s("Type", "body", true), s("Description", "body", true), j("BlockElements")]],
  ["blocks", "update", "PUT", "/survey-definitions/{surveyId}/blocks/{blockId}", "Update a block. Send the block properties (Type, Description, BlockElements ...).", [s("Type"), s("Description"), j("BlockElements")]],
  ["blocks", "delete", "DELETE", "/survey-definitions/{surveyId}/blocks/{blockId}", "Delete a block.", []],

  // Responses
  ["responses", "startExport", "POST", "/surveys/{surveyId}/export-responses", "Start an asynchronous response export. format is csv, tsv, json, ndjson, spss or xml. Returns a progressId to poll with getExportProgress.", [s("format", "body", true), s("startDate"), s("endDate"), j("questionIds"), j("embeddedDataIds"), n("limit"), b("compress"), b("useLabels"), s("lastResponseId"), s("filterId")]],
  ["responses", "getExportProgress", "GET", "/surveys/{surveyId}/export-responses/{exportProgressId}", "Check an export job. When status is complete the result carries a fileId for getExportFile.", []],
  ["responses", "getExportFile", "GET", "/surveys/{surveyId}/export-responses/{fileId}/file", "Download a finished export. Only text formats (json, ndjson, csv, tsv, xml) are readable; compressed exports return an error, so start the export with compress=false.", []],
  ["responses", "get", "GET", "/surveys/{surveyId}/responses/{responseId}", "Retrieve a single survey response.", [b("useLabels", "query")]],
  ["responses", "create", "POST", "/surveys/{surveyId}/responses", "Create a survey response. values maps question export tags (QID1) to answers; embeddedData adds embedded data fields.", [j("values", "body", true), j("embeddedData"), s("startDate"), s("endDate")]],
  ["responses", "update", "PUT", "/surveys/{surveyId}/responses/{responseId}", "Update a response's embedded data and/or values. resetRecordedDate=true resets the recorded date.", [j("embeddedData"), j("values"), b("resetRecordedDate")]],
  ["responses", "delete", "DELETE", "/surveys/{surveyId}/responses/{responseId}", "Delete a response.", []],
  ["responses", "startImport", "POST", "/surveys/{surveyId}/import-responses", "Start an asynchronous response import from a file URL. format is csv, tsv or json; fileUrl must be publicly readable.", [s("format", "body", true), s("fileUrl", "body", true), b("ignoreMissingQuestions")]],
  ["responses", "getImportProgress", "GET", "/surveys/{surveyId}/import-responses/{importProgressId}", "Check a response import job.", []],

  // Distributions
  ["distributions", "list", "GET", "/distributions", "List distributions for a survey. surveyId is required; distributionRequestType is Invite, Reminder, ThankYou or GeneratedInvite; mailingListId filters.", [s("surveyId", "query", true), s("distributionRequestType", "query"), s("mailingListId", "query"), s("sendStartDate", "query"), s("sendEndDate", "query"), s("skipToken", "query")]],
  ["distributions", "get", "GET", "/distributions/{distributionId}", "Retrieve a distribution. surveyId is required.", [s("surveyId", "query", true)]],
  ["distributions", "create", "POST", "/distributions", "Create an email distribution. Needs message ({libraryId, messageId}), recipients ({mailingListId, contactId}), header (fromEmail, fromName, replyToEmail, subject), surveyLink ({surveyId, expirationDate, type}) and sendDate (ISO 8601).", [j("message", "body", true), j("recipients", "body", true), j("header", "body", true), j("surveyLink", "body", true), s("sendDate", "body", true), s("embeddedData")]],
  ["distributions", "delete", "DELETE", "/distributions/{distributionId}", "Delete a distribution.", []],
  ["distributions", "createReminder", "POST", "/distributions/{distributionId}/reminders", "Send a reminder for a distribution. Needs header, message ({libraryId, messageId}) and sendDate.", [j("header", "body", true), j("message", "body", true), s("sendDate", "body", true), s("embeddedData")]],
  ["distributions", "createThankYou", "POST", "/distributions/{distributionId}/thankyous", "Send a thank-you for a distribution. Needs header, message ({libraryId, messageId}) and sendDate.", [j("header", "body", true), j("message", "body", true), s("sendDate", "body", true)]],
  ["distributions", "listLinks", "GET", "/distributions/{distributionId}/links", "List the unique survey links generated for a distribution. surveyId is required.", [s("surveyId", "query", true), s("skipToken", "query")]],
  ["distributions", "createLinks", "POST", "/distributions", "Generate personal links for a mailing list. Needs surveyId, linkType (Individual), description, action (CreateDistribution), mailingListId and expirationDate.", [s("surveyId", "body", true), s("linkType", "body", true), s("description", "body", true), s("action", "body", true), s("mailingListId", "body", true), s("expirationDate", "body", true), s("embeddedData")]],
  ["messages", "list", "GET", "/libraries/{libraryId}/messages", "List messages in a library. category filters (invite, inactiveSurvey, reminder, thankYou, ...).", [s("category", "query"), s("offset", "query")]],
  ["messages", "get", "GET", "/libraries/{libraryId}/messages/{messageId}", "Retrieve a library message.", []],

  // Mailing lists
  ["mailingLists", "list", "GET", "/mailinglists", "List the user's mailing lists.", [s("offset", "query")]],
  ["mailingLists", "get", "GET", "/mailinglists/{mailingListId}", "Retrieve a mailing list.", []],
  ["mailingLists", "create", "POST", "/mailinglists", "Create a mailing list in a library.", [s("libraryId", "body", true), s("name", "body", true), s("category")]],
  ["mailingLists", "update", "PUT", "/mailinglists/{mailingListId}", "Rename or recategorize a mailing list.", [s("libraryId", "body", true), s("name"), s("category")]],
  ["mailingLists", "delete", "DELETE", "/mailinglists/{mailingListId}", "Delete a mailing list.", []],
  ["mailingListContacts", "list", "GET", "/mailinglists/{mailingListId}/contacts", "List contacts in a mailing list.", [s("offset", "query"), s("skipToken", "query")]],
  ["mailingListContacts", "get", "GET", "/mailinglists/{mailingListId}/contacts/{contactId}", "Retrieve a contact in a mailing list.", []],
  ["mailingListContacts", "create", "POST", "/mailinglists/{mailingListId}/contacts", "Add a contact to a mailing list.", [s("firstName"), s("lastName"), s("email"), s("phone"), s("externalDataRef"), j("embeddedData"), s("language"), b("unsubscribed")]],
  ["mailingListContacts", "update", "PUT", "/mailinglists/{mailingListId}/contacts/{contactId}", "Update a contact in a mailing list.", [s("firstName"), s("lastName"), s("email"), s("phone"), s("externalDataRef"), j("embeddedData"), s("language"), b("unsubscribed")]],
  ["mailingListContacts", "delete", "DELETE", "/mailinglists/{mailingListId}/contacts/{contactId}", "Remove a contact from a mailing list.", []],

  // XM Directory
  ["directories", "list", "GET", "/directories", "List XM Directories (contact databases) for the brand.", [s("pageSize", "query"), s("offset", "query")]],
  ["directories", "listContacts", "GET", "/directories/{directoryId}/contacts", "List contacts in an XM Directory.", [s("pageSize", "query"), s("skipToken", "query"), s("includeEmbedded", "query")]],
  ["directories", "getContact", "GET", "/directories/{directoryId}/contacts/{contactId}", "Retrieve a directory contact.", []],
  ["directories", "createContact", "POST", "/directories/{directoryId}/contacts", "Create a directory contact.", [s("firstName"), s("lastName"), s("email"), s("phone"), s("extRef"), s("language"), b("unsubscribed"), j("embeddedData")]],
  ["directories", "updateContact", "PUT", "/directories/{directoryId}/contacts/{contactId}", "Update a directory contact.", [s("firstName"), s("lastName"), s("email"), s("phone"), s("extRef"), s("language"), b("unsubscribed"), j("embeddedData")]],
  ["directories", "deleteContact", "DELETE", "/directories/{directoryId}/contacts/{contactId}", "Delete a directory contact.", []],
  ["directories", "listContactMailingListMembership", "GET", "/directories/{directoryId}/contacts/{contactId}/mailinglistmembership", "List the mailing lists a directory contact belongs to.", []],
  ["directories", "listMailingLists", "GET", "/directories/{directoryId}/mailinglists", "List mailing lists in an XM Directory.", [s("pageSize", "query"), s("skipToken", "query")]],
  ["directories", "createMailingList", "POST", "/directories/{directoryId}/mailinglists", "Create a mailing list in an XM Directory.", [s("name", "body", true), s("ownerId")]],

  // Users and groups
  ["users", "list", "GET", "/users", "List users in the brand.", [s("offset", "query")]],
  ["users", "get", "GET", "/users/{userId}", "Retrieve a user.", []],
  ["users", "create", "POST", "/users", "Create a user. username, userType (for example UT_xxx), email, firstName, lastName and password are required.", [s("username", "body", true), s("userType", "body", true), s("email", "body", true), s("password", "body", true), s("firstName"), s("lastName"), s("language"), s("timeZone"), s("divisionId")]],
  ["users", "update", "PUT", "/users/{userId}", "Update a user.", [s("email"), s("firstName"), s("lastName"), s("language"), s("timeZone"), s("divisionId"), j("permissions")]],
  ["users", "delete", "DELETE", "/users/{userId}", "Delete a user.", []],
  ["groups", "list", "GET", "/groups", "List groups.", [s("offset", "query")]],
  ["groups", "get", "GET", "/groups/{groupId}", "Retrieve a group.", []],
  ["groups", "create", "POST", "/groups", "Create a group. type is GT_xxx; name is required; division optionally scopes it.", [s("type", "body", true), s("name", "body", true), s("divisionId")]],
  ["groups", "update", "PUT", "/groups/{groupId}", "Rename a group.", [s("name", "body", true)]],
  ["groups", "delete", "DELETE", "/groups/{groupId}", "Delete a group.", []],
  ["groups", "addUser", "POST", "/groups/{groupId}/members", "Add a user to a group.", [s("userId", "body", true)]],
  ["groups", "removeUser", "DELETE", "/groups/{groupId}/members/{userId}", "Remove a user from a group.", []],
  ["divisions", "list", "GET", "/divisions", "List divisions.", [s("offset", "query")]],
  ["divisions", "get", "GET", "/divisions/{divisionId}", "Retrieve a division.", []],

  // Event subscriptions (webhooks)
  ["eventSubscriptions", "list", "GET", "/eventsubscriptions", "List event subscriptions (webhooks).", [s("offset", "query")]],
  ["eventSubscriptions", "get", "GET", "/eventsubscriptions/{subscriptionId}", "Retrieve an event subscription.", []],
  ["eventSubscriptions", "create", "POST", "/eventsubscriptions", "Create an event subscription. topics is a topic string such as surveyengine.completedResponse.<surveyId>; publicationUrl receives the events; encrypt toggles encryption.", [s("topics", "body", true), s("publicationUrl", "body", true), b("encrypt")]],
  ["eventSubscriptions", "delete", "DELETE", "/eventsubscriptions/{subscriptionId}", "Delete an event subscription.", []],
];

// Qualtrics ids are strings (SV_..., UR_..., CG_...).
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
  fields: { host: string };
  url: (url: string) => string;
  headers: () => Record<string, string>;
};

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const base = siteUrl(account.fields.host);

  const call = async (method: string, path: string, fields: Field[], input: Record<string, unknown>) => {
    let url = path;
    const search = new URLSearchParams();
    const body: Record<string, unknown> = {};
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (value === undefined || value === null) continue;
      if (where === "path") url = url.replace(`{${name}}`, encodeURIComponent(String(value)));
      else if (where === "query") search.set(name, String(value));
      else body[name] = value;
    }
    const hasBody = method !== "GET" && method !== "DELETE" && Object.keys(body).length > 0;
    const queryString = search.size > 0 ? `?${search.toString()}` : "";
    const response = await fetcher(account.url(`${base}/API/v3${url}${queryString}`), {
      method,
      signal,
      headers: {
        ...account.headers(),
        Accept: "application/json",
        ...(hasBody ? { "content-type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Qualtrics answered ${response.status}: ${text.slice(0, 1000)}`);
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
  { user: { accounts: { qualtrics: qualtrics.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.qualtrics ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Qualtrics",
        description:
          "Qualtrics surveys, questions, blocks, responses, distributions, mailing lists, XM Directory contacts, users, groups and event subscriptions.",
        icons,
      },
    ),
  }),
);
