import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
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

const base = "https://rest.ripplingapis.com";

const rippling = defineProvider({
  name: "Rippling",
  hosts: ["rest.ripplingapis.com"],
  auth: {
    // OAuth is only for App Shop partner apps (the authorize URL is per listed app), so the API token is the user-completable method.
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/companies/?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
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
const payload = record(json()).optional();

const resolve = (path: string, ids: readonly string[], input: Params) => {
  let out = path;
  for (const id of ids) out = out.replace(`{${id}}`, encodeURIComponent(String(input[id])));
  return out;
};

// Every tool takes its path ids, `query` (limit, cursor, filter, expand, order_by) and, for writes, a JSON `body`.
function read(c: Call, path: string, description: string, ids: readonly string[] = []) {
  return query(
    { description, input: object({ ...Object.fromEntries(ids.map((id) => [id, string()])), query: filters }) },
    async (_ctx, input: Params) => c("GET", resolve(path, ids, input), (input.query as Params | undefined) ?? {}),
  );
}

function write(c: Call, method: Exclude<Method, "GET">, path: string, description: string, ids: readonly string[] = []) {
  return mutation(
    {
      description,
      input: object({
        ...Object.fromEntries(ids.map((id) => [id, string()])),
        query: filters,
        ...(method === "DELETE" ? {} : { body: payload }),
      }),
    },
    async (_ctx, input: Params) =>
      c(method, resolve(path, ids, input), (input.query as Params | undefined) ?? {}, method === "DELETE" ? undefined : ((input.body as Params | undefined) ?? {})),
  );
}

function build(c: Call) {
  return router({
    activityLog: router(
      {
        list: read(c, "/activity-log/", "List activity log. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/activity-log/{id}/", "Retrieve one activity log record by id. expand can go in query.", ["id"]),
      },
      { title: "Activity Log" },
    ),
    appUsers: router(
      {
        list: read(c, "/app-users/", "List app users. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/app-users/{id}/", "Retrieve one app users record by id. expand can go in query.", ["id"]),
      },
      { title: "App Users" },
    ),
    backgroundCheckCandidates: router(
      {
        list: read(c, "/background-check-candidates/", "List background check candidates. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/background-check-candidates/{id}/", "Retrieve one background check candidates record by id. expand can go in query.", ["id"]),
      },
      { title: "Background Check Candidates" },
    ),
    breakPolicies: router(
      {
        list: read(c, "/break-policies/", "List break policies. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/break-policies/{id}/", "Retrieve one break policies record by id. expand can go in query.", ["id"]),
      },
      { title: "Break Policies" },
    ),
    breakTypes: router(
      {
        list: read(c, "/break-types/", "List break types. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/break-types/{id}/", "Retrieve one break types record by id. expand can go in query.", ["id"]),
      },
      { title: "Break Types" },
    ),
    businessPartnerGroups: router(
      {
        list: read(c, "/business-partner-groups/", "List business partner groups. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/business-partner-groups/{id}/", "Retrieve one business partner groups record by id. expand can go in query.", ["id"]),
      },
      { title: "Business Partner Groups" },
    ),
    businessPartners: router(
      {
        list: read(c, "/business-partners/", "List business partners. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/business-partners/{id}/", "Retrieve one business partners record by id. expand can go in query.", ["id"]),
      },
      { title: "Business Partners" },
    ),
    businessStructurePaths: router(
      {
        list: read(c, "/business-structure-paths/", "List business structure paths. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/business-structure-paths/{id}/", "Retrieve one business structure paths record by id. expand can go in query.", ["id"]),
      },
      { title: "Business Structure Paths" },
    ),
    candidateApplications: router(
      {
        list: read(c, "/candidate-applications/", "List candidate applications. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
      },
      { title: "Candidate Applications" },
    ),
    candidates: router(
      {
        list: read(c, "/candidates/", "List candidates. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
      },
      { title: "Candidates" },
    ),
    companies: router(
      {
        list: read(c, "/companies/", "List companies. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
      },
      { title: "Companies" },
    ),
    companyLegalEntities: router(
      {
        list: read(c, "/company-legal-entities/", "List company legal entities. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/company-legal-entities/{id}/", "Retrieve one company legal entities record by id. expand can go in query.", ["id"]),
      },
      { title: "Company Legal Entities" },
    ),
    companyLegalEntityWorkers: router(
      {
        list: read(c, "/company-legal-entity-workers/", "List company legal entity workers. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/company-legal-entity-workers/{id}/", "Retrieve one company legal entity workers record by id. expand can go in query.", ["id"]),
      },
      { title: "Company Legal Entity Workers" },
    ),
    compensationBandsDetails: router(
      {
        list: read(c, "/compensation-bands-details/", "List compensation bands details. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/compensation-bands-details/{id}/", "Retrieve one compensation bands details record by id. expand can go in query.", ["id"]),
      },
      { title: "Compensation Bands Details" },
    ),
    compensations: router(
      {
        list: read(c, "/compensations/", "List compensations. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/compensations/{id}/", "Retrieve one compensations record by id. expand can go in query.", ["id"]),
      },
      { title: "Compensations" },
    ),
    customFields: router(
      {
        list: read(c, "/custom-fields/", "List custom fields. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
      },
      { title: "Custom Fields" },
    ),
    departments: router(
      {
        list: read(c, "/departments/", "List departments. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/departments/{id}/", "Retrieve one departments record by id. expand can go in query.", ["id"]),
      },
      { title: "Departments" },
    ),
    deviceOrders: router(
      {
        list: read(c, "/device-orders/", "List device orders. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/device-orders/{id}/", "Retrieve one device orders record by id. expand can go in query.", ["id"]),
      },
      { title: "Device Orders" },
    ),
    devices: router(
      {
        list: read(c, "/devices/", "List devices. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/devices/{id}/", "Retrieve one devices record by id. expand can go in query.", ["id"]),
      },
      { title: "Devices" },
    ),
    draftHires: router(
      {
        create: write(c, "POST", "/draft-hires/", "POST /draft-hires/ (draft hires). body is the JSON object from the Rippling API reference."),
      },
      { title: "Draft Hires" },
    ),
    draftTransitions: router(
      {
        create: write(c, "POST", "/draft-transitions/", "POST /draft-transitions/ (draft transitions). body is the JSON object from the Rippling API reference."),
        get: read(c, "/draft-transitions/{id}/", "Retrieve one draft transitions record by id. expand can go in query.", ["id"]),
      },
      { title: "Draft Transitions" },
    ),
    earningTypes: router(
      {
        list: read(c, "/earning-types/", "List earning types. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
      },
      { title: "Earning Types" },
    ),
    earningsInputs: router(
      {
        list: read(c, "/earnings-inputs/", "List earnings inputs. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        delete: write(c, "DELETE", "/earnings-inputs/{id}/", "DELETE /earnings-inputs/{id}/ (earnings inputs). body is the JSON object from the Rippling API reference.", ["id"]),
      },
      { title: "Earnings Inputs" },
    ),
    employeeDocuments: router(
      {
        create: write(c, "POST", "/employee-documents/", "POST /employee-documents/ (employee documents). body is the JSON object from the Rippling API reference."),
      },
      { title: "Employee Documents" },
    ),
    employmentTypes: router(
      {
        list: read(c, "/employment-types/", "List employment types. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/employment-types/{id}/", "Retrieve one employment types record by id. expand can go in query.", ["id"]),
      },
      { title: "Employment Types" },
    ),
    entitlements: router(
      {
        list: read(c, "/entitlements/", "List entitlements. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
      },
      { title: "Entitlements" },
    ),
    files: router(
      {
        create: write(c, "POST", "/files/", "POST /files/ (files). body is the JSON object from the Rippling API reference."),
        get: read(c, "/files/{id}/", "Retrieve one files record by id. expand can go in query.", ["id"]),
      },
      { title: "Files" },
    ),
    headcountPositions: router(
      {
        list: read(c, "/headcount-positions/", "List headcount positions. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/headcount-positions/{id}/", "Retrieve one headcount positions record by id. expand can go in query.", ["id"]),
      },
      { title: "Headcount Positions" },
    ),
    headcountPriorities: router(
      {
        list: read(c, "/headcount-priorities/", "List headcount priorities. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/headcount-priorities/{id}/", "Retrieve one headcount priorities record by id. expand can go in query.", ["id"]),
      },
      { title: "Headcount Priorities" },
    ),
    hireRequirements: router(
      {
        list: read(c, "/hire-requirements/", "List hire requirements. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
      },
      { title: "Hire Requirements" },
    ),
    hires: router(
      {
        create: write(c, "POST", "/hires/", "POST /hires/ (hires). body is the JSON object from the Rippling API reference."),
      },
      { title: "Hires" },
    ),
    jobAssignments: router(
      {
        list: read(c, "/job-assignments/", "List job assignments. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/job-assignments/{id}/", "Retrieve one job assignments record by id. expand can go in query.", ["id"]),
        changeLog: read(c, "/job-assignments/{jobAssignmentID}/change-log/", "GET /job-assignments/{jobAssignmentID}/change-log/ (job assignments).", ["jobAssignmentID"]),
      },
      { title: "Job Assignments" },
    ),
    jobCodes: router(
      {
        list: read(c, "/job-codes/", "List job codes. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/job-codes/{id}/", "Retrieve one job codes record by id. expand can go in query.", ["id"]),
        changeLog: read(c, "/job-codes/{jobCodeID}/change-log/", "GET /job-codes/{jobCodeID}/change-log/ (job codes).", ["jobCodeID"]),
      },
      { title: "Job Codes" },
    ),
    jobDimensions: router(
      {
        list: read(c, "/job-dimensions/", "List job dimensions. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/job-dimensions/{id}/", "Retrieve one job dimensions record by id. expand can go in query.", ["id"]),
      },
      { title: "Job Dimensions" },
    ),
    jobFunctions: router(
      {
        list: read(c, "/job-functions/", "List job functions. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/job-functions/{id}/", "Retrieve one job functions record by id. expand can go in query.", ["id"]),
      },
      { title: "Job Functions" },
    ),
    jobPayRateExceptions: router(
      {
        list: read(c, "/job-pay-rate-exceptions/", "List job pay rate exceptions. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/job-pay-rate-exceptions/{id}/", "Retrieve one job pay rate exceptions record by id. expand can go in query.", ["id"]),
        changeLog: read(c, "/job-pay-rate-exceptions/{jobPayRateExceptionID}/change-log/", "GET /job-pay-rate-exceptions/{jobPayRateExceptionID}/change-log/ (job pay rate exceptions).", ["jobPayRateExceptionID"]),
      },
      { title: "Job Pay Rate Exceptions" },
    ),
    jobRequisitionsWrite: router(
      {
        create: write(c, "POST", "/job-requisitions-write/", "POST /job-requisitions-write/ (job requisitions write). body is the JSON object from the Rippling API reference."),
      },
      { title: "Job Requisitions Write" },
    ),
    jobRequisitions: router(
      {
        list: read(c, "/job-requisitions/", "List job requisitions. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
      },
      { title: "Job Requisitions" },
    ),
    kioskBadges: router(
      {
        list: read(c, "/kiosk-badges/", "List kiosk badges. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/kiosk-badges/{id}/", "Retrieve one kiosk badges record by id. expand can go in query.", ["id"]),
      },
      { title: "Kiosk Badges" },
    ),
    leaveAccruals: router(
      {
        list: read(c, "/leave-accruals/", "List leave accruals. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/leave-accruals/{id}/", "Retrieve one leave accruals record by id. expand can go in query.", ["id"]),
      },
      { title: "Leave Accruals" },
    ),
    leaveBalances: router(
      {
        list: read(c, "/leave-balances/", "List leave balances. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/leave-balances/{id}/", "Retrieve one leave balances record by id. expand can go in query.", ["id"]),
      },
      { title: "Leave Balances" },
    ),
    leaveProgramEvaluations: router(
      {
        create: write(c, "POST", "/leave-program-evaluations/", "POST /leave-program-evaluations/ (leave program evaluations). body is the JSON object from the Rippling API reference."),
      },
      { title: "Leave Program Evaluations" },
    ),
    leaveRequests: router(
      {
        list: read(c, "/leave-requests/", "List leave requests. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/leave-requests/{id}/", "Retrieve one leave requests record by id. expand can go in query.", ["id"]),
      },
      { title: "Leave Requests" },
    ),
    leaveTypes: router(
      {
        list: read(c, "/leave-types/", "List leave types. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/leave-types/{id}/", "Retrieve one leave types record by id. expand can go in query.", ["id"]),
      },
      { title: "Leave Types" },
    ),
    legalEntities: router(
      {
        list: read(c, "/legal-entities/", "List legal entities. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/legal-entities/{id}/", "Retrieve one legal entities record by id. expand can go in query.", ["id"]),
      },
      { title: "Legal Entities" },
    ),
    levels: router(
      {
        list: read(c, "/levels/", "List levels. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/levels/{id}/", "Retrieve one levels record by id. expand can go in query.", ["id"]),
      },
      { title: "Levels" },
    ),
    listingSubmissions: router(
      {
        list: read(c, "/listing-submissions/", "List listing submissions. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/listing-submissions/{id}/", "Retrieve one listing submissions record by id. expand can go in query.", ["id"]),
      },
      { title: "Listing Submissions" },
    ),
    listingTransitions: router(
      {
        list: read(c, "/listing-transitions/", "List listing transitions. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
      },
      { title: "Listing Transitions" },
    ),
    listing: router(
      {
        list: read(c, "/listing/", "List listing. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/listing/{id}/", "Retrieve one listing record by id. expand can go in query.", ["id"]),
        delist: write(c, "POST", "/listing/{listingID}/delist/", "POST /listing/{listingID}/delist/ (listing). body is the JSON object from the Rippling API reference.", ["listingID"]),
        publish: write(c, "POST", "/listing/{listingID}/publish/", "POST /listing/{listingID}/publish/ (listing). body is the JSON object from the Rippling API reference.", ["listingID"]),
        resubmit: write(c, "POST", "/listing/{listingID}/resubmit/", "POST /listing/{listingID}/resubmit/ (listing). body is the JSON object from the Rippling API reference.", ["listingID"]),
        submit: write(c, "POST", "/listing/{listingID}/submit/", "POST /listing/{listingID}/submit/ (listing). body is the JSON object from the Rippling API reference.", ["listingID"]),
        withdraw: write(c, "POST", "/listing/{listingID}/withdraw/", "POST /listing/{listingID}/withdraw/ (listing). body is the JSON object from the Rippling API reference.", ["listingID"]),
      },
      { title: "Listing" },
    ),
    locationFactors: router(
      {
        list: read(c, "/location-factors/", "List location factors. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/location-factors/{id}/", "Retrieve one location factors record by id. expand can go in query.", ["id"]),
      },
      { title: "Location Factors" },
    ),
    objectCategories: router(
      {
        list: read(c, "/object-categories/", "List object categories. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/object-categories/{id}/", "Retrieve one object categories record by id. expand can go in query.", ["id"]),
      },
      { title: "Object Categories" },
    ),
    payrollPaymentModeChanges: router(
      {
        create: write(c, "POST", "/payroll-payment-mode-changes/", "POST /payroll-payment-mode-changes/ (payroll payment mode changes). body is the JSON object from the Rippling API reference."),
      },
      { title: "Payroll Payment Mode Changes" },
    ),
    reportRuns: router(
      {
        create: write(c, "POST", "/report-runs/", "POST /report-runs/ (report runs). body is the JSON object from the Rippling API reference."),
        get: read(c, "/report-runs/{runID}/", "Retrieve one report runs record by id. expand can go in query.", ["runID"]),
      },
      { title: "Report Runs" },
    ),
    scheduledJobAssignments: router(
      {
        list: read(c, "/scheduled-job-assignments/", "List scheduled job assignments. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/scheduled-job-assignments/{id}/", "Retrieve one scheduled job assignments record by id. expand can go in query.", ["id"]),
      },
      { title: "Scheduled Job Assignments" },
    ),
    schedules: router(
      {
        list: read(c, "/schedules/", "List schedules. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/schedules/{id}/", "Retrieve one schedules record by id. expand can go in query.", ["id"]),
      },
      { title: "Schedules" },
    ),
    shiftInputs: router(
      {
        list: read(c, "/shift-inputs/", "List shift inputs. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/shift-inputs/{id}/", "Retrieve one shift inputs record by id. expand can go in query.", ["id"]),
      },
      { title: "Shift Inputs" },
    ),
    shiftassignments: router(
      {
        list: read(c, "/shiftassignments/", "List shiftassignments. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/shiftassignments/{id}/", "Retrieve one shiftassignments record by id. expand can go in query.", ["id"]),
        updateCustomfields: write(c, "PATCH", "/shiftassignments/{id}/customfields/", "PATCH /shiftassignments/{id}/customfields/ (shiftassignments). body is the JSON object from the Rippling API reference.", ["id"]),
      },
      { title: "Shiftassignments" },
    ),
    ssoMe: router(
      {
        list: read(c, "/sso-me/", "Identity of the user behind the API token."),
      },
      { title: "Sso Me" },
    ),
    teams: router(
      {
        list: read(c, "/teams/", "List teams. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/teams/{id}/", "Retrieve one teams record by id. expand can go in query.", ["id"]),
      },
      { title: "Teams" },
    ),
    timeCards: router(
      {
        list: read(c, "/time-cards/", "List time cards. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/time-cards/{id}/", "Retrieve one time cards record by id. expand can go in query.", ["id"]),
      },
      { title: "Time Cards" },
    ),
    timeEntries: router(
      {
        list: read(c, "/time-entries/", "List time entries. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/time-entries/{id}/", "Retrieve one time entries record by id. expand can go in query.", ["id"]),
      },
      { title: "Time Entries" },
    ),
    titles: router(
      {
        list: read(c, "/titles/", "List titles. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/titles/{id}/", "Retrieve one titles record by id. expand can go in query.", ["id"]),
      },
      { title: "Titles" },
    ),
    tracks: router(
      {
        list: read(c, "/tracks/", "List tracks. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/tracks/{id}/", "Retrieve one tracks record by id. expand can go in query.", ["id"]),
      },
      { title: "Tracks" },
    ),
    unassignedshifts: router(
      {
        list: read(c, "/unassignedshifts/", "List unassignedshifts. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/unassignedshifts/{id}/", "Retrieve one unassignedshifts record by id. expand can go in query.", ["id"]),
        assign: write(c, "POST", "/unassignedshifts/{id}/assign/", "POST /unassignedshifts/{id}/assign/ (unassignedshifts). body is the JSON object from the Rippling API reference.", ["id"]),
        updateCustomfields: write(c, "PATCH", "/unassignedshifts/{id}/customfields/", "PATCH /unassignedshifts/{id}/customfields/ (unassignedshifts). body is the JSON object from the Rippling API reference.", ["id"]),
      },
      { title: "Unassignedshifts" },
    ),
    users: router(
      {
        list: read(c, "/users/", "List users. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/users/{id}/", "Retrieve one users record by id. expand can go in query.", ["id"]),
      },
      { title: "Users" },
    ),
    variableCompensationPayoutLabels: router(
      {
        list: read(c, "/variable-compensation-payout-labels/", "List variable compensation payout labels. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/variable-compensation-payout-labels/{id}/", "Retrieve one variable compensation payout labels record by id. expand can go in query.", ["id"]),
      },
      { title: "Variable Compensation Payout Labels" },
    ),
    variableCompensationPayoutTypes: router(
      {
        list: read(c, "/variable-compensation-payout-types/", "List variable compensation payout types. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/variable-compensation-payout-types/{id}/", "Retrieve one variable compensation payout types record by id. expand can go in query.", ["id"]),
      },
      { title: "Variable Compensation Payout Types" },
    ),
    variableCompensationPayoutWrites: router(
      {
        create: write(c, "POST", "/variable-compensation-payout-writes/", "POST /variable-compensation-payout-writes/ (variable compensation payout writes). body is the JSON object from the Rippling API reference."),
      },
      { title: "Variable Compensation Payout Writes" },
    ),
    variableCompensationPayouts: router(
      {
        list: read(c, "/variable-compensation-payouts/", "List variable compensation payouts. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/variable-compensation-payouts/{id}/", "Retrieve one variable compensation payouts record by id. expand can go in query.", ["id"]),
      },
      { title: "Variable Compensation Payouts" },
    ),
    workLocations: router(
      {
        list: read(c, "/work-locations/", "List work locations. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/work-locations/{id}/", "Retrieve one work locations record by id. expand can go in query.", ["id"]),
      },
      { title: "Work Locations" },
    ),
    workerChangeFields: router(
      {
        list: read(c, "/worker-change-fields/", "List worker change fields. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
      },
      { title: "Worker Change Fields" },
    ),
    workerChanges: router(
      {
        list: read(c, "/worker-changes/", "List worker changes. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/worker-changes/{id}/", "Retrieve one worker changes record by id. expand can go in query.", ["id"]),
      },
      { title: "Worker Changes" },
    ),
    workerTimeSplits: router(
      {
        list: read(c, "/worker-time-splits/", "List worker time splits. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/worker-time-splits/{id}/", "Retrieve one worker time splits record by id. expand can go in query.", ["id"]),
      },
      { title: "Worker Time Splits" },
    ),
    workers: router(
      {
        list: read(c, "/workers/", "List workers. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/workers/{id}/", "Retrieve one workers record by id. expand can go in query.", ["id"]),
      },
      { title: "Workers" },
    ),
    workflowActionExecutions: router(
      {
        create: write(c, "POST", "/workflow-action-executions/", "POST /workflow-action-executions/ (workflow action executions). body is the JSON object from the Rippling API reference."),
      },
      { title: "Workflow Action Executions" },
    ),
    workflows: router(
      {
        list: read(c, "/workflows/", "List workflows. Pages are cursor based: pass limit and cursor (the cursor in next_link) in query, plus filter, expand and order_by."),
        get: read(c, "/workflows/{id}/", "Retrieve one workflows record by id. expand can go in query.", ["id"]),
      },
      { title: "Workflows" },
    ),
  });
}

export default defineApp(
  { user: { accounts: { rippling: rippling.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.rippling ?? [],
        (account) => withApprovals(build(client(account.fields.token, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Rippling",
        description:
          "Rippling v2 REST API: workers, users, compensation, departments, teams, work locations, leave, time entries, schedules, recruiting and more. List tools are cursor paginated (query.limit, query.cursor); use query.expand to include related objects such as a worker's user.",
        icons,
      },
    ),
  }),
);
