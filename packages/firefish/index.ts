import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  router,
  string,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const origin = "https://api.firefishsoftware.com";

// Every standard scope Firefish documents (partner-only salesBehaviourAPI-readWrite and
// commsBehaviourAPI-readWrite are omitted). Each one must also be granted to the Custom API credentials
// inside Firefish; a tool whose scope was not granted answers 401/403.
const scopes = [
  "candidatesAPI-read",
  "candidatesAPI-write",
  "contactsAPI-read",
  "contactsAPI-write",
  "companiesAPI-read",
  "companiesAPI-write",
  "placementdetailsAPI-read",
  "placementdetailsAPI-write",
  "jobsAPI-read",
  "jobsAPI-write",
  "actionsAPI-read",
  "advertsAPI-read",
  "commsAPI-readWrite",
  "usersAPI-read",
  "leadsAPI-readWrite",
  "teamsAPI-read",
];

const firefish = defineProvider({
  name: "Firefish",
  hosts: ["api.firefishsoftware.com"],
  auth: {
    // Firefish issues a Client ID and Secret under Custom API settings and exchanges them for a
    // short-lived bearer token (client credentials grant). There is no user sign-in.
    customApi: oauth2({
      grant: "client_credentials",
      tokenUrl: `${origin}/authorization/token`,
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "form",
      scopes,
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin}/api/v1.0/users/active`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Where = "path" | "query";
type Field = [name: string, type: Type, required: boolean, where: Where];

const q = (name: string, type: Type = "string"): Field => [name, type, false, "query"];
const page = [q("page", "number"), q("page-size", "number")];
const dates = [q("from-date"), q("to-date"), q("use-updated-dates", "boolean")];
const lastAction = [q("last-action-date-from"), q("last-action-date-to"), q("last-action-name")];

type Row = [
  group: string,
  action: string,
  method: "GET" | "POST" | "PUT" | "PATCH",
  path: string,
  description: string,
  fields: Field[],
  hasBody?: boolean,
];

const body = "body is the JSON request body with the field names Firefish documents (PascalCase for most endpoints).";

const rows: Row[] = [
  // Candidates (candidatesAPI-read / candidatesAPI-write)
  ["candidates", "search", "GET", "/api/v1.0/candidates/search", "Search candidates by date range, name, email, address, phone, discipline, location or specialisation. Returns up to 1,000 records; use page and page-size for more.", [
    ...dates, q("include-archived", "boolean"), q("name"), q("email-address"), q("candidate-address-line"), q("candidate-post-code"), q("candidate-town"), q("candidate-county"), q("candidate-country"), q("candidate-phone-number"), q("discipline"), q("location"), q("specialisation"), ...lastAction, q("Page", "number"), q("Page-Size", "number")]],
  ["candidates", "get", "GET", "/api/v1.0/candidates/{CandidateRef}", "Retrieve a candidate profile.", []],
  ["candidates", "getDetails", "GET", "/api/v1.0/candidates/{CandidateRef}/details", "Retrieve a candidate's compliance details.", []],
  ["candidates", "getReferences", "GET", "/api/v1.0/candidates/{CandidateRef}/references", "Retrieve a candidate's references.", []],
  ["candidates", "getPreferences", "GET", "/api/v1.0/candidates/{CandidateRef}/preferences", "Retrieve a candidate's preferences, status, salary, package and rate preferences.", []],
  ["candidates", "getPayDetails", "GET", "/api/v1.0/candidates/{CandidateRef}/pay-details", "Retrieve a candidate's pay details.", []],
  ["candidates", "getEmployment", "GET", "/api/v1.0/candidates/{CandidateRef}/employment", "Retrieve a candidate's employment history.", []],
  ["candidates", "getEducation", "GET", "/api/v1.0/candidates/{CandidateRef}/education", "Retrieve a candidate's education.", []],
  ["candidates", "getProfessionalMemberships", "GET", "/api/v1.0/candidates/{CandidateRef}/professional-memberships", "Retrieve a candidate's professional memberships.", []],
  ["candidates", "getCertifications", "GET", "/api/v1.0/candidates/{CandidateRef}/certifications", "Retrieve a candidate's certifications.", []],
  ["candidates", "getActions", "GET", "/api/v1.0/candidates/{CandidateRef}/actions", "Retrieve a candidate's recent activity.", []],
  ["candidates", "listSavedSearches", "GET", "/api/v1.0/candidates/saved-searches", "List saved candidate search definitions created by Firefish users.", [q("owner-ref"), q("search-name")]],
  ["candidates", "getSavedSearchResults", "GET", "/api/v1.0/candidates/saved-searches/{ref}/results", "Run a saved candidate search and return its results.", page],
  ["candidates", "create", "POST", "/api/v1.0/candidates/", `Create a candidate profile (FirstName, Surname, Source, JobTitle, EmailAddress, Address). ${body}`, [], true],
  ["candidates", "update", "PUT", "/api/v1.0/candidates/{CandidateRef}", `Update a candidate profile. ${body}`, [], true],
  ["candidates", "updatePreferences", "PATCH", "/api/v1.0/candidates/{CandidateRef}/preferences", `Update a candidate's preferences using values from preferences.getProperties. ${body}`, [], true],
  ["candidates", "addEmployment", "POST", "/api/v1.0/candidates/{CandidateRef}/employment", `Add an employment history entry (CompanyRef, JobTitle, IsCurrent, FromMonth, FromYear, ToMonth, ToYear, Notes). ${body}`, [], true],
  ["candidates", "addEducation", "POST", "/api/v1.0/candidates/{CandidateRef}/education", `Add an education entry (Establishment, Qualification, Course, dates, Notes). ${body}`, [], true],
  ["candidates", "addNote", "POST", "/api/v1.0/candidates/{CandidateRef}/activity/notes", `Add a note to a candidate (body: { "note": "..." }).`, [], true],

  // Contacts
  ["contacts", "search", "GET", "/api/v1.0/contacts/search/", "Search contacts by date range, name, email, company name or phone number.", [
    ...dates, q("include-archived", "boolean"), q("name"), q("email-address"), q("company-name"), q("contact-phone-number"), ...lastAction, ...page]],
  ["contacts", "get", "GET", "/api/v1.0/contacts/{ContactRef}", "Retrieve a contact profile.", []],
  ["contacts", "getHiringPreferences", "GET", "/api/v1.0/contacts/{ContactRef}/hiring-preferences", "Retrieve a contact's hiring preferences.", []],
  ["contacts", "getActions", "GET", "/api/v1.0/contacts/{ContactRef}/actions", "Retrieve a contact's recent activity.", []],
  ["contacts", "listSavedSearches", "GET", "/api/v1.0/contacts/saved-searches", "List saved contact search definitions created by Firefish users.", [q("owner-ref"), q("search-name")]],
  ["contacts", "getSavedSearchResults", "GET", "/api/v1.0/contacts/saved-searches/{ref}/results", "Run a saved contact search and return its results.", page],
  ["contacts", "create", "POST", "/api/v1.0/contacts/", `Create a contact (FirstName, Surname, JobTitle, CompanyRef, EmailAddress, MobileNumber, WorkNumber, marketing flags, LinkedIn, OwnerUserEmail). ${body}`, [], true],
  ["contacts", "update", "PUT", "/api/v1.0/contacts/{ContactRef}", `Update a contact profile. ${body}`, [], true],
  ["contacts", "updateHiringPreferences", "PATCH", "/api/v1.0/contacts/{ContactRef}/hiring-preferences", `Update a contact's hiring preferences using values from preferences.getProperties. ${body}`, [], true],
  ["contacts", "addNote", "POST", "/api/v1.0/contacts/{ContactRef}/activity/notes", `Add a note to a contact (body: { "note": "..." }).`, [], true],

  // Companies
  ["companies", "search", "GET", "/api/v1.1/companies/search/", "Search companies by date range, name, town, postcode, email or phone number.", [
    ...dates, q("include-archived", "boolean"), q("name"), q("town"), q("postcode"), q("email-address"), q("company-phone-number"), ...lastAction]],
  ["companies", "get", "GET", "/api/v1.1/companies/{CompanyRef}", "Retrieve a company profile.", []],
  ["companies", "getTerms", "GET", "/api/v1.1/companies/{CompanyRef}/terms", "Retrieve a company's terms of business.", []],
  ["companies", "getBenefits", "GET", "/api/v1.1/companies/{CompanyRef}/benefits", "Retrieve a company's benefits.", []],
  ["companies", "getContacts", "GET", "/api/v1.1/companies/{CompanyRef}/company-contacts", "Retrieve a company's contacts.", []],
  ["companies", "getAssociatedCompanies", "GET", "/api/v1.1/companies/{CompanyRef}/associated-companies", "Retrieve companies associated with a company.", []],
  ["companies", "getActions", "GET", "/api/v1.1/companies/{CompanyRef}/actions", "Retrieve a company's recent activity.", []],
  ["companies", "create", "POST", "/api/v1.1/companies/", `Create a company (Name, Source, Address). ${body}`, [], true],
  ["companies", "update", "PUT", "/api/v1.1/companies/{CompanyRef}", `Update a company profile. ${body}`, [], true],
  ["companies", "addNote", "POST", "/api/v1.1/companies/{CompanyRef}/activity/notes", `Add a note to a company (body: { "note": "..." }).`, [], true],

  // Leads (leadsAPI-readWrite)
  ["leads", "getProperties", "GET", "/api/v1.0/leads/properties", "Retrieve the lead types and stages available in this Firefish database.", []],
  ["leads", "search", "GET", "/api/v1.0/leads/search", "Search open leads.", [...dates, q("owner-ref"), q("lead-stage"), q("lead-type"), q("company-ref"), q("contact-ref"), ...page]],
  ["leads", "get", "GET", "/api/v1.0/leads/{leadRef}", "Retrieve a single lead.", []],
  ["leads", "create", "POST", "/api/v1.0/leads", `Create a lead (leadName, leadType, ownerRef, contactRef, leadStage, estimatedValue, notes). ${body}`, [], true],
  ["leads", "update", "PUT", "/api/v1.0/leads/{leadRef}", `Update a lead. ${body}`, [], true],

  // Jobs (jobsAPI-read / jobsAPI-write)
  ["jobs", "search", "GET", "/api/v1.1/jobs/search", "Search jobs (permanent, contract and shift) by date range, title, status, type, company or stage.", [
    ...dates, q("title"), q("status"), q("job-type"), q("company-name"), q("stage"), ...lastAction]],
  ["jobs", "get", "GET", "/api/v1.1/jobs/{JobRef}", "Retrieve job details.", []],
  ["jobs", "getDropdownValues", "GET", "/api/v1.1/jobs/dropdownvalues", "Retrieve the dropdown values accepted when creating or updating jobs.", []],
  ["jobs", "getWorkflowProperties", "GET", "/api/v1.1/properties/{JobType}", "Retrieve job workflow properties for a job type.", []],
  ["jobs", "getActions", "GET", "/api/v1.0/jobs/{JobRef}/actions", "Retrieve a job's recent activity.", []],
  ["jobs", "getCustomFields", "GET", "/api/v1.0/jobs/{JobRef}/custom-fields", "Retrieve a job's custom fields.", []],
  ["jobs", "create", "POST", "/api/v1.1/jobs", `Create a permanent, contract or shift job. ${body}`, [], true],
  ["jobs", "update", "PATCH", "/api/v1.1/jobs/{JobRef}", `Update a job (Title, Status, ReasonIfClosed, ClosedComment and others). ${body}`, [], true],
  ["jobs", "addShifts", "POST", "/api/v1.1/jobs/{JobRef}/shifts", "Add shifts to a shift job. body is a JSON array of shift objects (ShiftName, ShiftStart, ShiftEnd, Frequency, Interval, Days, End and others).", [], true],
  ["jobs", "considerCandidate", "POST", "/api/v1.0/jobs/{JobRef}/considerations", `Consider a candidate for a job (body: { "CandidateRef": "..." }).`, [], true],

  // Placements (placementdetailsAPI-read)
  ["placements", "search", "GET", "/api/v1.1/placements/search", "Search placements and offers.", [...dates, q("job-type"), q("placement-type"), q("team-ref"), q("company-ref")]],
  ["placements", "getOffer", "GET", "/api/v1.1/placements/offer/{JobType}/{ID}", "Retrieve offer details.", []],
  ["placements", "getPlacement", "GET", "/api/v1.1/placements/placement/{JobType}/{OriginalPlacementID}", "Retrieve placement details.", []],
  ["placements", "getPlacementPart", "GET", "/api/v1.1/placements/placement/part/{JobType}/{ID}", "Retrieve placement part details.", []],
  ["teams", "search", "GET", "/api/v1.1/teams/search", "Find team IDs by name.", [q("name")]],

  // Shift bookings (v1.2 adds resolved pay and charge rates)
  ["bookings", "search", "GET", "/api/v1.2/bookings/search", "Search shift bookings.", [
    ...dates, q("shift-start-from"), q("shift-start-to"), q("status"), q("website-name"), q("team-ref"), q("owneruser-ref"), q("company-ref"), ...page]],
  ["bookings", "get", "GET", "/api/v1.2/bookings/{bookingID}", "Retrieve booking details including resolved pay and charge rates.", []],
  ["bookings", "update", "PATCH", "/api/v1.2/bookings/update/{bookingID}/{shiftDate}", `Record actual worked times against a confirmed shift occurrence (ShiftStart, ShiftEnd, ShiftBreakInMinutes). ${body}`, [], true],
  ["bookings", "cancel", "PUT", "/api/v1.2/bookings/cancel/{bookingID}", `Cancel a shift booking (CancelledReason, CancelledReasonNotes). ${body}`, [], true],

  // Timesheets (placementdetailsAPI-read / placementdetailsAPI-write)
  ["timesheets", "search", "GET", "/api/v1.0/timesheets/search", "Search timesheets.", [q("placement-part-id"), q("period-from"), q("period-to"), q("timesheet-status")]],
  ["timesheets", "get", "GET", "/api/v1.0/timesheets/{TimesheetRef}", "Retrieve a timesheet.", []],
  ["timesheets", "createOrUpdate", "POST", "/api/v1.0/timesheets/{PlacementPartID}", `Create or update a timesheet for a placement part (TimesheetRef, PeriodFrom, PeriodTo, Entries[EntryDate, Units, RateType, RateCode]). ${body}`, [], true],

  // Comms (commsAPI-readWrite)
  ["comms", "lookupCaller", "GET", "/api/v1.0/comms/search", "Caller ID lookup: find the candidate or contact for an E.164 phone number.", [["phone-number", "string", true, "query"]]],
  ["comms", "listCallTypes", "GET", "/api/v1.0/comms/calltypes", "List the call and message types available for notes.", []],
  ["comms", "listMessages", "GET", "/api/v1.0/comms/messages", "Message queue: messages between two date-times.", [q("from-date-time"), q("to-date-time"), q("include-sent", "boolean")]],
  ["comms", "getNote", "GET", "/api/v1.0/comms/note/{NoteRef}", "Retrieve a call or message note.", []],
  ["comms", "createNote", "POST", "/api/v1.0/comms/note", `Create a call or message note (EntityRef, EntityType, CommsType, UserEmail, CommsNote, CommsDate, CommsFollowUpDate). ${body}`, [], true],
  ["comms", "updateNote", "PUT", "/api/v1.0/comms/note/{NoteRef}", `Update a call or message note. ${body}`, [], true],

  // Actions, adverts, users, preferences
  ["actions", "search", "GET", "/api/v1.0/actions/search/", "Search actions (activity records) across candidates, contacts, companies, jobs and adverts.", [
    q("action-date-from"), q("action-date-to"), q("use-updated-dates", "boolean"), q("action-name"), q("user-name"), q("follow-up-date-to"), q("follow-up-date-from"), q("has-candidate", "boolean"), q("has-contact", "boolean"), q("has-company", "boolean"), q("has-job", "boolean"), q("has-advert", "boolean"), q("has-friendly-placement", "boolean"), q("exclude-email-actions", "boolean"), q("Page", "number"), q("Page-Size", "number")]],
  ["adverts", "search", "GET", "/api/v1.0/adverts/search/", "Search job adverts.", [
    q("from-date"), q("to-date"), q("use-updated-date", "boolean"), q("use-closing-date", "boolean"), q("use-posted-date", "boolean"), q("status"), q("advert-title"), q("company-ref"), q("contact-ref"), q("job-ref"), q("user"), q("discipline"), q("role"), q("location-area"), q("sub-location"), q("specialty"), q("sub-specialty"), q("type"), q("last-action-date-from"), q("last-action-date-to"), q("last-action-name")]],
  ["adverts", "get", "GET", "/api/v1.0/adverts/{Ref}", "Retrieve advert details.", []],
  ["users", "listActive", "GET", "/api/v1.0/users/active", "List active Firefish users.", []],
  ["preferences", "getProperties", "GET", "/api/v1.0/preferences/properties", "Retrieve the preference values valid for candidate and contact preference updates in this database.", []],
];

function fieldsOf(path: string, extra: Field[], hasBody: boolean | undefined): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1]!)
    .map((name) => [name, "string", true, "path"] as Field);
  const bodyField: Field[] = hasBody === true ? [["body", "json", true, "query"]] : [];
  return [...pathFields, ...extra, ...bodyField];
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

type Account = { fields: { access_token: string } };

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, fields: Field[], input: Record<string, unknown>) => {
    let target = path;
    const params = new URLSearchParams();
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (name === "body" || value === undefined || value === null) continue;
      if (where === "path") target = target.replace(`{${name}}`, encodeURIComponent(String(value)));
      else params.set(name, String(value));
    }
    const hasBody = input.body !== undefined && input.body !== null;
    const response = await fetcher(`${origin}${target}${params.size > 0 ? `?${params.toString()}` : ""}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.access_token}`,
        Accept: "application/json",
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(input.body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Firefish answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [group, action, method, path, description, extra, hasBody] of rows) {
    const fields = fieldsOf(path, extra, hasBody);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, input);
    const tool = method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const tools = groups.get(group) ?? {};
    tools[action] = tool;
    groups.set(group, tools);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { firefish: firefish.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.firefish ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Firefish",
        description:
          "Firefish recruitment CRM: candidates, contacts, companies, leads, jobs, placements, shift bookings, timesheets, adverts, actions and call notes.",
        instructions:
          "Search endpoints return at most 1,000 records; narrow with from-date/to-date or page with page and page-size. Dates are ISO-8601 UTC. Write tools take body as the JSON the Firefish API documents. The API is rate limited to 10 requests per second and 200 per minute per endpoint.",
        icons,
      },
    ),
  }),
);
