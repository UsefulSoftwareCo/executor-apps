import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  oauth2,
  object,
  query,
  record,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const origin = "https://api.emarsys.net";

const emarsys = defineProvider({
  name: "Emarsys",
  hosts: ["api.emarsys.net", "auth.emarsys.net"],
  auth: {
    // API credentials created by the account owner under Management > Security Settings > API Credentials
    // (OpenID Connect). The client ID and secret are exchanged for a short-lived JWT with the client credentials
    // grant; the token endpoint authenticates the client with HTTP Basic. There are no scopes.
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://auth.emarsys.net/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [],
    }),
  },
  // Returns {replyCode, replyText, data}; only the envelope's existence is checked.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin}/api/v3/settings`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;

function client(token: () => string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: unknown) => {
    const url = new URL(`${origin}${path.startsWith("/") ? path : `/${path}`}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const headers: Record<string, string> = { Authorization: `Bearer ${token()}`, Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return null;
    return decodeJson(response, json());
  };
}

type Client = ReturnType<typeof client>;

const fields = record(json());
const text = string({ minLength: 1 });

// Builds one tool from an endpoint template. `{name}` segments of the path become required string inputs; `query`
// carries the query string and `body` the JSON payload when the endpoint takes them.
function endpoint(
  c: Client,
  kind: "query" | "mutation",
  method: Method,
  path: string,
  description: string,
  opts: { query?: boolean; body?: boolean } = {},
) {
  const names = [...path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
  const shape: Record<string, unknown> = {};
  for (const name of names) shape[name] = text;
  if (opts.query === true) shape.query = fields.optional();
  if (opts.body === true) shape.body = fields;
  const definition = { description: `${description} (${method} ${path})`, input: object(shape as never) };
  const run = (input: Record<string, unknown>) => {
    let resolved = path;
    for (const name of names) resolved = resolved.replace(`{${name}}`, encodeURIComponent(String(input[name])));
    return c(method, resolved, (input.query as Params | undefined) ?? {}, input.body);
  };
  return kind === "query"
    ? query(definition, async (_ctx, input: Record<string, unknown>) => run(input))
    : mutation(definition, async (_ctx, input: Record<string, unknown>) => run(input));
}

function build(c: Client) {
  const q = (method: Method, path: string, description: string, opts?: { query?: boolean; body?: boolean }) =>
    endpoint(c, "query", method, path, description, opts);
  const m = (method: Method, path: string, description: string, opts?: { query?: boolean; body?: boolean }) =>
    endpoint(c, "mutation", method, path, description, opts);
  const v3 = "/api/v3";
  return router({
    settings: router(
      {
        get: q("GET", `${v3}/settings`, "Account settings: name, timezone, currency, default language and contact keys.", {}),
        linkCategories: q("GET", `${v3}/settings/linkcategories`, "List link categories."),
      },
      { title: "Settings", description: "Customer account settings." },
    ),
    contacts: router(
      {
        query: q(
          "GET",
          `${v3}/contact/query/`,
          "Find contacts by a key field and return selected fields. query: return (field id to return), the key field id as a parameter name with the value (for example 3=jane@example.com for the email field) and excludeempty.",
          { query: true },
        ),
        getData: q(
          "POST",
          `${v3}/contact/getdata`,
          "Read contact data. body: keyId, keyValues (array) and fields (array of field ids).",
          { body: true },
        ),
        create: m("POST", `${v3}/contact`, "Create contacts. body: keyId and contacts (array of objects keyed by field id).", {
          body: true,
        }),
        update: m(
          "PUT",
          `${v3}/contact`,
          "Update contacts. query: create_if_not_exists=1 to create missing contacts. body: keyId and contacts (array keyed by field id).",
          { query: true, body: true },
        ),
        delete: m("POST", `${v3}/contact/delete`, "Delete a contact. body: keyId and the key value, for example {keyId: 3, 3: \"jane@example.com\"}.", {
          body: true,
        }),
        internalId: q(
          "GET",
          `${v3}/contact/query/{keyId}={keyValue}`,
          "Get the internal contact id for a key field value (keyId is the field id, such as 3 for email).",
        ),
        checkIds: q("POST", `${v3}/contact/checkids`, "Verify that internal contact ids exist. body: {contactIds: [...]}.", {
          body: true,
        }),
        history: q(
          "POST",
          `${v3}/contact/getcontacthistory`,
          "Email history of contacts. body: contactIds (array) and optional fromDate, toDate.",
          { body: true },
        ),
        lastChange: q("GET", `${v3}/contact/last_change`, "Query field changes. query: keyId, keyValue, fieldId, fromDate and so on.", {
          query: true,
        }),
      },
      { title: "Contacts", description: "Create, read, update and delete contacts." },
    ),
    fields: router(
      {
        list: q("GET", `${v3}/field/translate/{languageId}`, "List contact fields with names translated to a language (for example en)."),
        choices: q(
          "GET",
          `${v3}/field/{fieldId}/choice/translate/{languageId}`,
          "List the choices of a single-choice or multiple-choice field.",
        ),
        create: m("POST", `${v3}/field`, "Create a custom field. body: name, application_type and string_id.", { body: true }),
        delete: m("DELETE", `${v3}/field/{fieldId}`, "Delete a custom field."),
      },
      { title: "Fields", description: "Contact field definitions." },
    ),
    contactLists: router(
      {
        list: q("GET", `${v3}/contactlist`, "List contact lists."),
        create: m("POST", `${v3}/contactlist`, "Create a contact list. body: name, description, keyId, externalIds or ids.", { body: true }),
        add: m("POST", `${v3}/contactlist/{listId}/add`, "Add contacts to a list. body: keyId and externalIds (or ids).", { body: true }),
        remove: m("POST", `${v3}/contactlist/{listId}/delete`, "Remove contacts from a list. body: keyId and externalIds (or ids).", {
          body: true,
        }),
        replace: m("POST", `${v3}/contactlist/{listId}/replace`, "Replace the contents of a list. body: keyId and externalIds.", { body: true }),
        rename: m("POST", `${v3}/contactlist/{listId}/rename`, "Rename a list. body: {name}.", { body: true }),
        count: q("GET", `${v3}/contactlist/{listId}/count`, "Count the contacts in a list."),
        contacts: q("GET", `${v3}/contactlist/{listId}`, "List the contacts in a list. query: offset and limit.", { query: true }),
        contactIds: q(
          "GET",
          "/api/v2/contactlist/{listId}/contactIds",
          "Fetch contact ids in a list. query: $skiptoken and $top (v2 endpoint).",
          { query: true },
        ),
        lookup: q("GET", `${v3}/contactlist/{listId}/contacts/{contactId}`, "Check whether a contact is in a list."),
        deleteList: m("POST", `${v3}/contactlist/{listId}/deletelist`, "Delete a contact list."),
      },
      { title: "Contact lists", description: "Static contact lists." },
    ),
    segments: router(
      {
        list: q("GET", `${v3}/filter`, "List segments."),
        create: m("PUT", `${v3}/filter`, "Create a segment. body: name, description and criteria.", { body: true }),
        count: q("GET", `${v3}/filter/{segmentId}/contacts/count`, "Count contacts in a segment."),
        contacts: q("GET", `${v3}/filter/{segmentId}/contacts`, "List contacts in a segment. query: limit and offset.", { query: true }),
        lookup: q("GET", `${v3}/filter/{segmentId}/contacts/{contactId}`, "Check whether a contact is in a segment."),
        criteria: q("GET", `${v3}/filter/{segmentId}/contact_criteria`, "Read a segment's contact criteria."),
        delete: m("GET", `${v3}/filter/{segmentId}/delete`, "Delete a segment."),
        listCombined: q("GET", `${v3}/combinedsegments`, "List combined segments."),
        getCombined: q("GET", `${v3}/combinedsegments/{combinedSegmentId}`, "Get a combined segment."),
        createCombined: m("POST", `${v3}/combinedsegments`, "Create a combined segment. body: name and the segment expression.", { body: true }),
        updateCombined: m("POST", `${v3}/combinedsegments/{combinedSegmentId}`, "Update a combined segment.", { body: true }),
      },
      { title: "Segments", description: "Contact segments and combined segments." },
    ),
    sources: router(
      {
        list: q("GET", `${v3}/source`, "List contact sources."),
        create: m("POST", `${v3}/source/create`, "Create a contact source. body: {name}.", { body: true }),
        delete: m("GET", `${v3}/source/{sourceId}`, "Delete a contact source."),
        forms: q("GET", `${v3}/form`, "List customer forms."),
      },
      { title: "Sources and forms", description: "Contact sources and customer forms." },
    ),
    emails: router(
      {
        list: q(
          "GET",
          `${v3}/email`,
          "List email campaigns. query: status, launched, contactlist, showdeleted, fromdate, todate, template, content_type, campaign_type, behavior_channel and email_category.",
          { query: true },
        ),
        get: q("GET", `${v3}/email/{emailId}`, "Get an email campaign. query: raw=1 for the unrendered source.", { query: true }),
        create: m("POST", `${v3}/email`, "Create an email campaign. body: name, language, subject, sender, html_source or template, and recipient source.", {
          body: true,
        }),
        update: m("POST", `${v3}/email/{emailId}/patch`, "Update an email campaign.", { body: true }),
        version: m("POST", `${v3}/email/{emailId}/version`, "Add a language version to an email campaign.", { body: true }),
        finalize: m("POST", `${v3}/email/{emailId}/finalize`, "Finalize a multi-language email campaign."),
        copy: m("POST", `${v3}/email/{emailId}/copy`, "Copy an email campaign. query: name for the copy.", { query: true }),
        updateSource: m("POST", `${v3}/email/{emailId}/updatesource`, "Change the recipient source of a campaign.", { body: true }),
        delete: m("POST", `${v3}/email/delete`, "Delete email campaigns. body: {emailId}.", { body: true }),
        preview: m("POST", `${v3}/email/{emailId}/preview`, "Render a preview of campaign content. body: version and optionally a contact.", { body: true }),
        sendTest: m("POST", `${v3}/email/{emailId}/sendtestmail`, "Send a test email. body: recipientemail or recipientlist, and version.", {
          body: true,
        }),
        launch: m("POST", `${v3}/email/{emailId}/launch`, "Launch an email campaign. Sends to real recipients; body may set schedule.", { body: true }),
        unsubscribe: m("POST", `${v3}/email/unsubscribe`, "Unsubscribe a contact from a campaign. body: launch_list_id, contact_id and launch_id.", {
          body: true,
        }),
        blacklist: m("POST", `${v3}/blacklist`, "Add emails or domains to the blocklist. body: replace and emails or domains.", { body: true }),
        languages: q("GET", `${v3}/language`, "Languages available for email campaigns."),
        categories: q("GET", `${v3}/emailcategory`, "Email campaign categories."),
        templates: q("GET", `${v3}/email/templates`, "List email templates."),
        template: q("GET", `${v3}/email/templates/{templateId}`, "Get an email template."),
        conditions: q("GET", `${v3}/condition`, "List conditional text rules."),
        personalization: q("GET", `${v3}/email/{emailId}/personalization`, "List personalization alternate texts."),
        contentUrl: m("POST", `${v3}/email/{emailId}/url`, "Get the URL of launched campaign content. body: contact_id and launch_id.", { body: true }),
      },
      { title: "Email campaigns", description: "Email campaign lifecycle, templates and recipient sources." },
    ),
    emailContent: router(
      {
        trackedLinks: q("GET", `${v3}/email/{emailId}/trackedlinks/{linkId}`, "Get tracked links of a campaign (linkId may be 0 for all)."),
        createTrackedLink: m("POST", `${v3}/email/{emailId}/trackedlinks`, "Create a tracked link.", { body: true }),
        updateTrackedLink: m("POST", `${v3}/email/{emailId}/trackedlinks/{linkId}`, "Update a tracked link.", { body: true }),
        deleteTrackedLink: m("POST", `${v3}/email/{emailId}/deletetrackedlinks/{linkId}`, "Delete a tracked link."),
        sections: q("GET", `${v3}/email/{emailId}/sections`, "List sections of a template-based campaign."),
        section: q("GET", `${v3}/email/{emailId}/sections/{sectionId}`, "Get a section."),
        createSection: m("POST", `${v3}/email/{emailId}/sections`, "Create a section.", { body: true }),
        updateSection: m("POST", `${v3}/email/{emailId}/sections/{sectionId}`, "Update a section.", { body: true }),
        deleteSection: m("POST", `${v3}/email/{emailId}/sections/{sectionId}/delete`, "Delete a section."),
      },
      { title: "Email content", description: "Tracked links and sections of email campaigns." },
    ),
    reports: router(
      {
        deliveryStatus: q("POST", `${v3}/email/getdeliverystatus`, "Delivery status of launches. body: filters such as launch_id or emailId and a date range.", {
          body: true,
        }),
        launches: q("POST", `${v3}/email/getlaunchesofemail`, "List launches of a campaign. body: {emailId}.", { body: true }),
        responseSummary: q(
          "GET",
          `${v3}/email/{emailId}/responsesummary`,
          "Response summary of a campaign. query: launch_id, start_date and end_date.",
          { query: true },
        ),
        queryResponses: q("POST", `${v3}/email/responses`, "Start an asynchronous email response metrics query. Returns a query id. body: the metrics and filters.", {
          body: true,
        }),
        queryResults: q("GET", `${v3}/email/{queryId}/responses`, "Get the results of a response metrics query."),
        mailEvents: q(
          "GET",
          "/api/rtm/mail_events/{eventType}",
          "Query real-time mail events (for example sent, delivered, opened, clicked). query: from, to, email and external_id.",
          { query: true },
        ),
      },
      { title: "Reports", description: "Delivery status and email response metrics." },
    ),
    media: router(
      {
        folders: q("GET", `${v3}/folder`, "List Media Database folders. query: folder (parent id).", { query: true }),
        createFolder: m("POST", `${v3}/folder`, "Create a Media Database folder. body: name and folder.", { body: true }),
        files: q("GET", `${v3}/file`, "List Media Database files. query: folder.", { query: true }),
        getFile: q("GET", `${v3}/file/{fileId}`, "Get a Media Database file."),
        uploadFile: m("POST", `${v3}/file`, "Upload a file by URL or base64. body: name, folder and url or file (base64).", { body: true }),
        deleteFile: m("POST", `${v3}/file/{fileId}/delete`, "Delete a Media Database file."),
      },
      { title: "Media Database", description: "Folders and files." },
    ),
    externalEvents: router(
      {
        list: q("GET", `${v3}/event/{eventId}`, "List external events (eventId may be 0 for all) or get one."),
        usages: q("GET", `${v3}/event/{eventId}/usages`, "List the programs that use an external event."),
        create: m("POST", `${v3}/event`, "Create an external event. body: name.", { body: true }),
        update: m("POST", `${v3}/event/{eventId}`, "Update an external event.", { body: true }),
        trigger: m("POST", `${v3}/event/{eventId}/trigger`, "Trigger an external event for a contact. body: key_id, external_id and data.", { body: true }),
        delete: m("POST", `${v3}/event/{eventId}/delete`, "Delete an external event."),
      },
      { title: "External events", description: "Trigger Automation Center programs from your systems." },
    ),
    programs: router(
      {
        list: q("GET", `${v3}/ac/programs`, "List Automation Center programs."),
        abort: m("POST", `${v3}/ac/programs/{program_id}/abort`, "Abort a running program."),
        delete: m("POST", `${v3}/ac/programs/{program_id}/delete`, "Delete a program."),
        start: m(
          "POST",
          `${v3}/ac/programs/entrypoints/{nodeType}/resources/{resourceId}/runs`,
          "Start a program from a pre-defined entry point. body: the contact or data payload.",
          { body: true },
        ),
        resources: q("GET", "/api/api/v2/programresource", "List program resources in use. query: service_id and resource_id.", { query: true }),
      },
      { title: "Programs", description: "Automation Center programs." },
    ),
    exports: router(
      {
        changedContacts: m("POST", `${v3}/contact/getchanges`, "Export contacts changed in a period. body: distribution method, time range and fields.", { body: true }),
        contactList: m("POST", `${v3}/email/getcontacts`, "Export a contact list. body: contactlist id, distribution method.", { body: true }),
        segment: m("POST", `${v3}/export/filter`, "Export a segment. body: segment id, fields and distribution method.", { body: true }),
        registrations: m("POST", `${v3}/contact/getregistrations`, "Export contact registrations. body: time range.", { body: true }),
        responses: m("POST", `${v3}/email/getresponses`, "Export email responses. body: response type, time range and campaign filters.", { body: true }),
        status: q("GET", `${v3}/export/{exportId}`, "Check an export's status."),
        data: q("GET", `${v3}/export/{exportId}/data`, "Download export data. query: offset and limit.", { query: true }),
      },
      { title: "Exports", description: "Asynchronous data exports; check status, then download." },
    ),
    rds: router(
      {
        query: q(
          "GET",
          "/api/rds/v1/connections/{connectionName}/tables/{tableName}/records",
          "Query records of a Relational Data Storage table. query: the key field name with the value to match.",
          { query: true },
        ),
        insert: m("POST", "/api/rds/v1/connections/{connectionName}/tables/{tableName}/records", "Insert records. body: array of records.", { body: true }),
        upsert: m("POST", "/api/rds/v1/connections/{connectionName}/tables/{tableName}/records/upsert", "Upsert records.", { body: true }),
        update: m("PATCH", "/api/rds/v1/connections/{connectionName}/tables/{tableName}/records", "Update records.", { body: true }),
        replace: m("PUT", "/api/rds/v1/connections/{connectionName}/tables/{tableName}/records", "Replace the whole table contents.", { body: true }),
        remove: m("POST", "/api/rds/v1/connections/{connectionName}/tables/{tableName}/records/remove", "Delete records.", { body: true }),
      },
      { title: "Relational Data Storage", description: "RDS connection tables." },
    ),
    administrators: router(
      {
        list: q("GET", `${v3}/administrator`, "List administrator accounts."),
        get: q("GET", `${v3}/administrator/query/{administratorId}`, "Get an administrator's details."),
        accessLevels: q("GET", `${v3}/administrator/getaccesslevels`, "List access levels."),
        languages: q("GET", `${v3}/administrator/getinterfacelanguages`, "List interface languages."),
        startPages: q("GET", `${v3}/administrator/getstartpages`, "List start pages."),
        create: m("POST", `${v3}/administrator`, "Create an administrator account.", { body: true }),
        update: m("POST", `${v3}/administrator/{administratorId}/patch`, "Update an administrator account.", { body: true }),
        delete: m("POST", `${v3}/administrator/{administratorId}/delete`, "Delete an administrator account."),
      },
      { title: "Administrators", description: "Administrator accounts and access levels." },
    ),
    events: router(
      {
        ingest: m(
          "POST",
          "/api/engagementevent/v1/integrations/{integrationId}/eventConfigurations/{eventConfigurationId}/events",
          "Ingest an engagement event.",
          { body: true },
        ),
        storeBehavioral: m(
          "POST",
          "/api/hds/events/customers/{customerId}/events/providers/{provider}/channels/{channel}/campaign_types/{campaignType}/event_types/{eventType}",
          "Store behavioral data in the Historical Data Store.",
          { body: true },
        ),
      },
      { title: "Engagement events", description: "Send events and behavioral data into Emarsys." },
    ),
    api: router(
      {
        get: query(
          {
            description:
              "Call any other Emarsys API GET endpoint. path starts with /api, for example /api/v3/settings.",
            input: object({ path: text, query: fields.optional() }),
          },
          async (_ctx, input) => {
            if (!input.path.startsWith("/api/")) throw new Error("path must start with /api/.");
            return c("GET", input.path, input.query ?? {});
          },
        ),
        send: mutation(
          {
            description:
              "Call any other Emarsys API endpoint that changes data (POST, PUT, PATCH or DELETE). path starts with /api.",
            input: object({ method: string().default("POST"), path: text, query: fields.optional(), body: json().optional() }),
          },
          async (_ctx, input) => {
            const method = input.method.toUpperCase();
            if (method !== "POST" && method !== "PUT" && method !== "PATCH" && method !== "DELETE")
              throw new Error("method must be POST, PUT, PATCH or DELETE.");
            if (!input.path.startsWith("/api/")) throw new Error("path must start with /api/.");
            return c(method, input.path, input.query ?? {}, input.body);
          },
        ),
      },
      { title: "Generic REST", description: "Any other Emarsys API endpoint." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { emarsys: emarsys.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.emarsys ?? [],
        (account) =>
          withApprovals(build(client(() => String(account.fields.access_token), fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Emarsys",
        description:
          "SAP Emarsys marketing platform: contacts, fields, contact lists, segments, email campaigns, reports, external events, Automation Center programs, exports and the Media Database.",
        instructions:
          "Responses wrap results as {replyCode, replyText, data}; replyCode 0 means success, and errors can arrive with HTTP 200. Contacts are addressed by a key field id (for example 3 for email, 1 for first name). Exports are asynchronous: start one, poll exports.status, then call exports.data. Launching a campaign sends real email.",
        icons,
      },
    ),
  }),
);
