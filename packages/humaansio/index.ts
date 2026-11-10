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

const base = "https://app.humaans.io/api";

const humaans = defineProvider({
  name: "Humaans",
  hosts: ["app.humaans.io"],
  auth: {
    // Humaans offers API access tokens only; there is no OAuth app registration for customers.
    apiKey: secrets({
      label: "API access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const me = await decodeJson(response, object({ id: string() }));
    return { accountInfo: { externalId: me.id } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: "GET" | "POST" | "PATCH" | "DELETE", path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (typeof value === "object" && !Array.isArray(value)) {
        // Operator filters such as { "$gte": "2024-01-01" } become key[$gte]=...
        for (const [op, inner] of Object.entries(value as Params)) url.searchParams.set(`${key}[${op}]`, String(inner));
      } else url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const filters = record(json()).optional();
const payload = record(json());

function list(call: Call, path: string, noun: string, extra = "") {
  return query(
    {
      description: `List ${noun}. Pass $limit (max 250, default 100) and $skip to page; the response has total, limit, skip and data.${extra} Other filters go in query; operators nest, e.g. { updatedAt: { "$gt": "2024-01-01T00:00:00Z" } }.`,
      input: object({ limit: number().optional(), skip: number().optional(), query: filters }),
    },
    async (_ctx, input: Params) =>
      call("GET", path, { ...((input.query as Params | undefined) ?? {}), $limit: input.limit, $skip: input.skip }),
  );
}

function get(call: Call, path: string, noun: string) {
  return query(
    { description: `Retrieve one ${noun} by id.`, input: object({ id: string({ minLength: 1 }) }) },
    async (_ctx, input: Params) => call("GET", `${path}/${encodeURIComponent(String(input.id))}`),
  );
}

function create(call: Call, path: string, noun: string) {
  return mutation(
    { description: `Create ${noun}. body holds the fields documented in the Humaans API reference.`, input: object({ body: payload }) },
    async (_ctx, input: Params) => call("POST", path, {}, input.body as Params),
  );
}

function update(call: Call, path: string, noun: string) {
  return mutation(
    { description: `Update ${noun}. body holds only the fields to change.`, input: object({ id: string({ minLength: 1 }), body: payload }) },
    async (_ctx, input: Params) => call("PATCH", `${path}/${encodeURIComponent(String(input.id))}`, {}, input.body as Params),
  );
}

function remove(call: Call, path: string, noun: string) {
  return mutation(
    { description: `Delete ${noun} by id.`, input: object({ id: string({ minLength: 1 }) }) },
    async (_ctx, input: Params) => call("DELETE", `${path}/${encodeURIComponent(String(input.id))}`),
  );
}

type Verbs = { get?: boolean; create?: boolean; update?: boolean; delete?: boolean; list?: boolean };

// One router per Humaans resource; verbs follow what the API reference documents for each.
function resource(call: Call, path: string, noun: string, plural: string, verbs: Verbs, listExtra = "") {
  return router({
    ...(verbs.list === false ? {} : { list: list(call, path, plural, listExtra) }),
    ...(verbs.get ? { get: get(call, path, noun) } : {}),
    ...(verbs.create ? { create: create(call, path, `a ${noun}`) } : {}),
    ...(verbs.update ? { update: update(call, path, `a ${noun}`) } : {}),
    ...(verbs.delete ? { delete: remove(call, path, `a ${noun}`) } : {}),
  });
}

const R = { get: true } satisfies Verbs;
const CRUD = { get: true, create: true, update: true, delete: true } satisfies Verbs;

function build(call: Call) {
  return router({
    me: query({ description: "The person behind the API access token.", input: object({}) }, async () => call("GET", "/me")),
    tokenInfo: query(
      { description: "Details of the API access token in use, including when it expires.", input: object({}) },
      async () => call("GET", "/token-info"),
    ),
    people: resource(call, "/people", "person", "people", CRUD, " Filter by email, personalEmail, employeeId, status and more via query."),
    jobRoles: resource(call, "/job-roles", "job role", "job roles", CRUD),
    companies: resource(call, "/companies", "company", "companies", { get: true, update: true }),
    spaces: resource(call, "/spaces", "space", "spaces", CRUD),
    locations: resource(call, "/locations", "location", "locations", CRUD),
    compensationTypes: resource(call, "/compensation-types", "compensation type", "compensation types", R),
    compensations: resource(call, "/compensations", "compensation", "compensations", CRUD),
    bankAccounts: resource(call, "/bank-accounts", "bank account", "bank accounts", CRUD),
    emergencyContacts: resource(call, "/emergency-contacts", "emergency contact", "emergency contacts", CRUD),
    orgHierarchies: resource(call, "/org-hierarchies", "org hierarchy", "org hierarchies", R),
    orgUnits: resource(call, "/org-units", "org unit", "org units", R),
    orgUnitAssignments: resource(call, "/org-unit-assignments", "org unit assignment", "org unit assignments", R),
    jobLibraryProfiles: resource(call, "/job-library-profiles", "job library profile", "job library profiles", CRUD),
    jobLibraryRoles: resource(call, "/job-library-roles", "job library role", "job library roles", CRUD),
    jobLibraryLevels: resource(call, "/job-library-levels", "job library level", "job library levels", CRUD),
    workingPatterns: resource(call, "/working-patterns", "working pattern", "working patterns", CRUD),
    workingPatternAllocations: resource(call, "/working-pattern-allocations", "working pattern allocation", "working pattern allocations", CRUD),
    timeAway: resource(call, "/time-away", "time away entry", "time away entries", CRUD),
    timeAwayTypes: resource(call, "/time-away-types", "time away type", "time away types", CRUD),
    timeAwayPolicies: resource(call, "/time-away-policies", "time away policy", "time away policies", CRUD),
    timeAwayPeriods: resource(call, "/time-away-periods", "time away period", "time away periods", {}),
    timeAwayAllocations: resource(call, "/time-away-allocations", "time away allocation", "time away allocations", CRUD),
    timeAwayAdjustments: resource(call, "/time-away-adjustments", "time away adjustment", "time away adjustments", CRUD),
    timesheetEntries: resource(call, "/timesheet-entries", "timesheet entry", "timesheet entries", CRUD),
    timesheetSubmissions: resource(call, "/timesheet-submissions", "timesheet submission", "timesheet submissions", CRUD),
    publicHolidayCalendars: resource(call, "/public-holiday-calendars", "public holiday calendar", "public holiday calendars", {}),
    publicHolidayCalendarDays: resource(call, "/public-holiday-calendar-days", "public holiday calendar day", "public holiday calendar days", CRUD),
    publicHolidays: resource(call, "/public-holidays", "public holiday", "public holidays", {}, " Pass publicHolidayCalendarId in query."),
    documents: resource(call, "/documents", "document", "documents", CRUD),
    documentTypes: resource(call, "/document-types", "document type", "document types", { create: true, update: true, delete: true }),
    identityDocuments: resource(call, "/identity-documents", "identity document", "identity documents", CRUD),
    identityDocumentTypes: resource(call, "/identity-document-types", "identity document type", "identity document types", {}),
    files: router({
      get: get(call, "/files", "file"),
      create: create(call, "/files", "a file record"),
    }),
    equipment: resource(call, "/equipment", "equipment item", "equipment items", CRUD),
    equipmentNames: resource(call, "/equipment-names", "equipment name", "equipment names", {}),
    equipmentTypes: resource(call, "/equipment-types", "equipment type", "equipment types", {}),
    performanceCycles: resource(call, "/performance-cycles", "performance cycle", "performance cycles", R),
    performanceInstances: resource(call, "/performance-cycle-instances", "performance cycle instance", "performance cycle instances", R),
    performanceTemplates: resource(call, "/performance-cycle-review-templates", "performance review template", "performance review templates", R),
    performanceReviews: resource(call, "/performance-cycle-reviews", "performance review", "performance reviews", R),
    customFields: resource(call, "/custom-fields", "custom field", "custom fields", CRUD),
    customValues: resource(call, "/custom-values", "custom value", "custom values", CRUD),
    dataExports: router({
      get: get(call, "/data-exports", "data export"),
      create: create(call, "/data-exports", "a data export"),
      delete: remove(call, "/data-exports", "a data export"),
    }),
    webhooks: resource(call, "/webhooks", "webhook", "webhooks", CRUD),
  });
}

export default defineApp(
  { user: { accounts: { humaans: humaans.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.humaans ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Humaans",
        description:
          "Humaans HR: people, job roles, time away, timesheets, compensation, documents, equipment, performance reviews, custom fields and webhooks. List tools page with limit/skip; filters go in query, fields in body.",
        icons,
      },
    ),
  }),
);
