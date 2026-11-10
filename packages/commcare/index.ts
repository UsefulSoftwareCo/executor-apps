import { icons } from "./icon.js";
import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  query,
  router,
  secrets,
  string,
  number,
  record,
} from "apps";

const host = "https://www.commcarehq.org";

const commcare = defineProvider({
  name: "CommCare",
  hosts: ["www.commcarehq.org"],
  auth: {
    apiKey: secrets({
      label: "Username and API key",
      fields: object({
        username: string({ minLength: 1 }),
        token: string({ minLength: 1 }),
        domain: string({ minLength: 1 }),
      }),
    }),
  },
  // /api/identity/v1/ returns the authenticated user and needs no project permission.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${host}/api/identity/v1/`, {
      signal,
      headers: { Authorization: `ApiKey ${account.fields.username}:${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

// Case v2 and messaging events use cursor pagination: the response carries a `next` link.
// Accept only a link that points back at this account's endpoint, so credentials never go elsewhere.
function nextParams(next: string | undefined, fields: { domain: string }, endpoint: string): Params {
  if (next === undefined || next === "") return {};
  const url = new URL(next, host);
  if (url.origin !== host || url.pathname !== `/a/${fields.domain}/api/${endpoint}`) {
    throw new Error(`next must be a "next" link returned by the ${endpoint} endpoint of this project space`);
  }
  return Object.fromEntries(url.searchParams.entries());
}

function client(
  fields: { username: string; token: string; domain: string },
  fetcher: Fetch,
  signal: AbortSignal | undefined,
) {
  return async (path: string, params: Params = {}) => {
    const url = new URL(
      path.startsWith("/") ? `${host}${path}` : `${host}/a/${encodeURIComponent(fields.domain)}/api/${path}`,
    );
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      signal,
      headers: { Authorization: `ApiKey ${fields.username}:${fields.token}`, Accept: "application/json" },
    });
    return decodeJson(response, json());
  };
}

const page = {
  limit: number().optional(),
  offset: number().optional(),
};

function build(get: ReturnType<typeof client>, fields: { domain: string }) {
  return router({
    identity: query(
      {
        description: "Return the CommCare HQ user the API key belongs to (id, email, name).",
        input: object({}),
      },
      async () => get("/api/identity/v1/"),
    ),
    userDomains: query(
      {
        description: "List the project spaces (domains) the authenticated web user is a member of.",
        input: object({}),
      },
      async () => get("/api/user_domains/v1/"),
    ),
    applications: router(
      {
        list: query(
          {
            description:
              "List applications in the project space with their modules, forms, questions, case types and case properties (Application Structure API). Set extras to include the full application dump. Needs the Edit Apps permission.",
            input: object({ ...page, extras: string().optional() }),
          },
          async (_ctx, i) => get("application/v1/", { limit: i.limit, offset: i.offset, extras: i.extras }),
        ),
        get: query(
          {
            description: "Get one application's structure by app ID. Set extras to true to include the full application dump. Needs the Edit Apps permission.",
            input: object({ appId: string({ minLength: 1 }), extras: string().optional() }),
          },
          async (_ctx, i) => get(`application/v1/${encodeURIComponent(i.appId)}/`, { extras: i.extras }),
        ),
      },
      { title: "Applications", description: "Application structure: modules, forms, questions and case schemas." },
    ),
    cases: router(
      {
        list: query(
          {
            description:
              "List cases (Case Data API v2, cursor pagination). Filters: caseType, ownerId, externalId, caseName, closed (\"true\"/\"false\"), parentCaseId (children of that case), and ISO 8601 bounds for last_modified, server_last_modified, indexed_on, date_opened and date_closed (suffix .gt/.gte/.lt/.lte, passed in `range`, e.g. {\"indexed_on.gte\": \"2024-01-01\"}). `properties` filters exact case-property matches. `fields` and `exclude` are comma-separated lists to trim the response. limit defaults to 20, max 5000. The response holds `matching_records`, `cases` and `next`; pass `next` back to get the following page. Needs the Edit Data permission.",
            input: object({
              limit: number().optional(),
              caseType: string().optional(),
              ownerId: string().optional(),
              externalId: string().optional(),
              caseName: string().optional(),
              closed: string().optional(),
              parentCaseId: string().optional(),
              range: record(string()).optional(),
              properties: record(string()).optional(),
              fields: string().optional(),
              exclude: string().optional(),
              next: string().optional(),
            }),
          },
          async (_ctx, i) => {
            const params: Params = {
              limit: i.limit,
              case_type: i.caseType,
              owner_id: i.ownerId,
              external_id: i.externalId,
              case_name: i.caseName,
              closed: i.closed,
              "indices.parent": i.parentCaseId,
              fields: i.fields,
              exclude: i.exclude,
            };
            for (const [key, value] of Object.entries(i.range ?? {})) params[key] = value;
            for (const [key, value] of Object.entries(i.properties ?? {})) params[`properties.${key}`] = value;
            return get("case/v2/", { ...params, ...nextParams(i.next, fields, "case/v2/") });
          },
        ),
        get: query(
          {
            description:
              "Get one case by case ID (Case Data API v2), including its properties and indices. fields/exclude trim the response. Needs the Edit Data permission.",
            input: object({ caseId: string({ minLength: 1 }), fields: string().optional(), exclude: string().optional() }),
          },
          async (_ctx, i) => get(`case/v2/${encodeURIComponent(i.caseId)}`, { fields: i.fields, exclude: i.exclude }),
        ),
        getByExternalId: query(
          {
            description: "Get one case by external ID (Case Data API v2). If the external ID is not unique only one case is returned. Needs the Edit Data permission.",
            input: object({ externalId: string({ minLength: 1 }) }),
          },
          async (_ctx, { externalId }) => get(`case/v2/ext/${encodeURIComponent(externalId)}/`),
        ),
      },
      { title: "Cases", description: "Case records (patients, households, clients...) in the project space." },
    ),
    forms: router(
      {
        list: query(
          {
            description:
              "List form submissions (List Forms API v1). Filters: xmlns, appId, appVersion, caseId (forms that updated that case), includeArchived (\"true\"), receivedOnStart/End and indexedOnStart/End (ISO 8601), orderBy (indexed_on, server_modified_on or received_on). limit defaults to 20, max 1000. Paginate with offset or the meta.next link. Needs the Edit Data permission.",
            input: object({
              ...page,
              xmlns: string().optional(),
              appId: string().optional(),
              appVersion: string().optional(),
              caseId: string().optional(),
              includeArchived: string().optional(),
              receivedOnStart: string().optional(),
              receivedOnEnd: string().optional(),
              indexedOnStart: string().optional(),
              indexedOnEnd: string().optional(),
              orderBy: string().optional(),
            }),
          },
          async (_ctx, i) =>
            get("form/v1/", {
              limit: i.limit,
              offset: i.offset,
              xmlns: i.xmlns,
              app_id: i.appId,
              appVersion: i.appVersion,
              case_id: i.caseId,
              include_archived: i.includeArchived,
              received_on_start: i.receivedOnStart,
              received_on_end: i.receivedOnEnd,
              indexed_on_start: i.indexedOnStart,
              indexed_on_end: i.indexedOnEnd,
              order_by: i.orderBy,
            }),
        ),
        get: query(
          {
            description: "Get one form submission by form ID (Form Data API), including the submitted question values, metadata and attachment list. Needs the Edit Data permission.",
            input: object({ formId: string({ minLength: 1 }) }),
          },
          async (_ctx, { formId }) => get(`form/v1/${encodeURIComponent(formId)}/`),
        ),
      },
      { title: "Forms", description: "Submitted form data." },
    ),
    users: router(
      {
        list: query(
          {
            description:
              "List mobile workers (List Mobile Workers API v1). Filters: group (group UUID), archived (\"true\" lists archived workers), extras (\"true\" adds recent-activity fields, slower). Paginate with limit and offset. Needs the Edit Mobile Workers permission.",
            input: object({ ...page, group: string().optional(), archived: string().optional(), extras: string().optional() }),
          },
          async (_ctx, i) =>
            get("user/v1/", { limit: i.limit, offset: i.offset, group: i.group, archived: i.archived, extras: i.extras }),
        ),
        get: query(
          {
            description: "Get one mobile worker by user ID. Needs the Edit Mobile Workers permission.",
            input: object({ userId: string({ minLength: 1 }) }),
          },
          async (_ctx, { userId }) => get(`user/v1/${encodeURIComponent(userId)}/`),
        ),
      },
      { title: "Mobile workers", description: "Mobile worker accounts." },
    ),
    webUsers: router(
      {
        list: query(
          {
            description: "List web users (project members) with roles and permissions. Filter by webUsername. Paginate with limit and offset. Needs the Edit Web Users permission.",
            input: object({ ...page, webUsername: string().optional() }),
          },
          async (_ctx, i) => get("web-user/v1/", { limit: i.limit, offset: i.offset, web_username: i.webUsername }),
        ),
        get: query(
          {
            description: "Get one web user by user ID. Needs the Edit Web Users permission.",
            input: object({ userId: string({ minLength: 1 }) }),
          },
          async (_ctx, { userId }) => get(`web-user/v1/${encodeURIComponent(userId)}/`),
        ),
      },
      { title: "Web users", description: "Web users (project members)." },
    ),
    groups: router(
      {
        list: query(
          {
            description: "List case-sharing and reporting groups. Paginate with limit and offset. Needs the Edit Mobile Workers permission.",
            input: object({ ...page }),
          },
          async (_ctx, i) => get("group/v1/", { limit: i.limit, offset: i.offset }),
        ),
        get: query(
          {
            description: "Get one group by ID, including its member user IDs.",
            input: object({ groupId: string({ minLength: 1 }) }),
          },
          async (_ctx, { groupId }) => get(`group/v1/${encodeURIComponent(groupId)}/`),
        ),
      },
      { title: "Groups", description: "Case-sharing and reporting groups." },
    ),
    locations: router(
      {
        list: query(
          {
            description:
              "List locations (Location API v2). Filters: name (case sensitive), siteCode, locationTypeCode, parentLocationId, lastModifiedGte/Gt/Lte/Lt (date or datetime), orderBy (last_modified or -last_modified). Paginate with limit and offset.",
            input: object({
              ...page,
              name: string().optional(),
              siteCode: string().optional(),
              locationTypeCode: string().optional(),
              parentLocationId: string().optional(),
              lastModifiedGte: string().optional(),
              lastModifiedGt: string().optional(),
              lastModifiedLte: string().optional(),
              lastModifiedLt: string().optional(),
              orderBy: string().optional(),
            }),
          },
          async (_ctx, i) =>
            get("location/v2/", {
              limit: i.limit,
              offset: i.offset,
              name: i.name,
              site_code: i.siteCode,
              location_type_code: i.locationTypeCode,
              parent_location_id: i.parentLocationId,
              "last_modified.gte": i.lastModifiedGte,
              "last_modified.gt": i.lastModifiedGt,
              "last_modified.lte": i.lastModifiedLte,
              "last_modified.lt": i.lastModifiedLt,
              order_by: i.orderBy,
            }),
        ),
        get: query(
          {
            description: "Get one location by location ID (Location API v2).",
            input: object({ locationId: string({ minLength: 1 }) }),
          },
          async (_ctx, { locationId }) => get(`location/v2/${encodeURIComponent(locationId)}/`),
        ),
        listTypes: query(
          {
            description: "List the location types (hierarchy levels) of the project space.",
            input: object({ ...page }),
          },
          async (_ctx, i) => get("location_type/v1/", { limit: i.limit, offset: i.offset }),
        ),
        getType: query(
          {
            description: "Get one location type by its numeric ID.",
            input: object({ locationTypeId: string({ minLength: 1 }) }),
          },
          async (_ctx, { locationTypeId }) => get(`location_type/v1/${encodeURIComponent(locationTypeId)}/`),
        ),
      },
      { title: "Locations", description: "Organization locations and location types." },
    ),
    lookupTables: router(
      {
        list: query(
          {
            description: "List lookup tables (fixture data types) with their tags and fields. Paginate with limit and offset. Needs the Edit Apps permission.",
            input: object({ ...page }),
          },
          async (_ctx, i) => get("lookup_table/v1/", { limit: i.limit, offset: i.offset }),
        ),
        listRows: query(
          {
            description: "List lookup table rows (items) across tables; each row carries its data_type_id. Paginate with limit and offset.",
            input: object({ ...page }),
          },
          async (_ctx, i) => get("lookup_table_item/v1/", { limit: i.limit, offset: i.offset }),
        ),
      },
      { title: "Lookup tables", description: "Reference data tables used by apps." },
    ),
    reports: router(
      {
        list: query(
          {
            description: "List configurable reports in the project space with their columns and filters (List Reports API). Use an id with reports.data.",
            input: object({}),
          },
          async () => get("simplereportconfiguration/v1/", { format: "json" }),
        ),
        data: query(
          {
            description:
              "Run a configurable report and return its columns and rows (Download Report Data API). `filters` maps report filter slugs to values, e.g. {\"state\": \"vermont\", \"form_date-start\": \"2015-01-01\", \"form_date-end\": \"2015-02-01\", \"age-operator\": \">\", \"age-operand\": \"10\"}; separate several values of one filter with the %1F character. limit max 50. Needs View Data and Access All Reports.",
            input: object({ reportId: string({ minLength: 1 }), ...page, filters: record(string()).optional() }),
          },
          async (_ctx, i) =>
            get(`configurablereportdata/v1/${encodeURIComponent(i.reportId)}/`, {
              ...(i.filters ?? {}),
              limit: i.limit,
              offset: i.offset,
            }),
        ),
      },
      { title: "Reports", description: "Configurable reports and their data." },
    ),
    messagingEvents: query(
      {
        description:
          "List SMS/email messaging events (Messaging Events API v1, cursor pagination). Filters: contentType (sms, sms-survey, email...), source (broadcast, keyword, reminder, conditional-alert...), status, errorCode, phoneNumber, emailAddress, caseId, dateGte/dateGt/dateLte/dateLt, orderBy (date_last_activity or -date_last_activity). limit defaults to 20, max 1000. Pass the `next` link from the previous response to continue. Needs the Edit Data permission.",
        input: object({
          limit: number().optional(),
          contentType: string().optional(),
          source: string().optional(),
          status: string().optional(),
          errorCode: string().optional(),
          phoneNumber: string().optional(),
          emailAddress: string().optional(),
          caseId: string().optional(),
          dateGte: string().optional(),
          dateGt: string().optional(),
          dateLte: string().optional(),
          dateLt: string().optional(),
          orderBy: string().optional(),
          next: string().optional(),
        }),
      },
      async (_ctx, i) =>
        get("messaging-event/v1/", {
          limit: i.limit,
          content_type: i.contentType,
          source: i.source,
          status: i.status,
          error_code: i.errorCode,
          phone_number: i.phoneNumber,
          email_address: i.emailAddress,
          case_id: i.caseId,
          "date.gte": i.dateGte,
          "date.gt": i.dateGt,
          "date.lte": i.dateLte,
          "date.lt": i.dateLt,
          order_by: i.orderBy,
          ...nextParams(i.next, fields, "messaging-event/v1/"),
        }),
    ),
  });
}

export default defineApp(
  { user: { accounts: { commcare: commcare.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.commcare ?? [], (account) => build(client(account.fields, fetch, signal), account.fields), { signal }),
      {
        title: "CommCare",
        description:
          "Read CommCare HQ project data: applications, cases, form submissions, mobile workers, web users, groups, locations, lookup tables, reports and messaging events.",
        icons,
      },
    ),
  }),
);
