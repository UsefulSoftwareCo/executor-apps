import type { OpenapiToolNamesOptions } from "apps/openapi";

// Toggl's official Swagger 2.0 documents, linked from https://engineering.toggl.com/docs/track/openapi/.
// The documents omit or misstate their server (the Track API spec says localhost:8080 with basePath
// /api/v9; the Reports and Webhooks specs declare none), so every origin is set explicitly.
const origin = "https://api.track.toggl.com";
const basic = { BasicAuth: { type: "http", scheme: "basic" } } as const;
// The API token is the Basic username. Toggl wants the literal "api_token" as the password, which
// no account field holds, so index.ts rewrites the Authorization header on outgoing requests.
const methods = {
  apiKey: [{ scheme: "BasicAuth", field: "token", part: "username", prefix: "" }],
} as const;

// Track API v9: time entries, projects, clients, tags, tasks, workspaces, organizations, ...
export const options = {
  source: { url: "https://engineering.toggl.com/assets/files/api-fb7996e774ae61b08ea11c9c1b2f32ef.json" },
  allowedOrigin: origin,
  baseUrl: `${origin}/api/v9`,
  securitySchemes: basic,
  fallbackSecurity: [{ BasicAuth: [] }],
  methods,
  oauth: [],
} satisfies OpenapiToolNamesOptions;

// Every Reports operation is a POST that only reads data (searches, filters, summaries, exports), so
// they run without an approval prompt.
const readOnlyReports = [
  "insights.postWorkspaceDataTrendsProjects",
  "insights.postWorkspaceProfitabilityEmployeesExtension",
  "insights.postWorkspaceProfitabilityProjectsExtension",
  "insights.postWorkspaceTrendsProjectsExtension",
  "savedReports.postReportsShared",
  "reports.postWorkspaceComparative",
  "reports.postWorkspaceDataTrendsClients",
  "reports.postWorkspaceDataTrendsProjects",
  "reports.postWorkspaceDataTrendsUsers",
  "utils.postReportsWorkspaceFiltersClients",
  "utils.postReportsWorkspaceFiltersProjectGroups",
  "utils.postReportsWorkspaceFiltersProjectUsers",
  "utils.postReportsWorkspaceFiltersProjects",
  "utils.postReportsWorkspaceFiltersProjectsStatus",
  "utils.postReportsWorkspaceFiltersTasksStatus",
  "utils.postReportsWorkspaceFiltersUsers",
  "reports.postWorkspaceProfitabilityProjects",
  "summaryReports.v3.postReportsWorkspaceProjectsSummary",
  "summaryReports.v3.postReportsWorkspaceProjectsSummaryByProjectId",
  "utils.postReportsWorkspaceSearchClients",
  "utils.postReportsWorkspaceSearchProjects",
  "detailedReports.postReportsWorkspaceSearchTimeEntries",
  "detailedReports.postReportsWorkspaceSearchTimeEntriesPdf",
  "detailedReports.postReportsWorkspaceSearchTimeEntriesExtension",
  "detailedReports.postReportsWorkspaceSearchTimeEntriesTotals",
  "utils.postReportsWorkspaceSearchUsers",
  "summaryReports.postReportsWorkspaceSummaryTimeEntries",
  "summaryReports.postReportsWorkspaceSummaryTimeEntriesPdf",
  "weeklyReports.postReportsWorkspaceWeeklyTimeEntries",
  "weeklyReports.postReportsWorkspaceWeeklyTimeEntriesCsv",
  "weeklyReports.postReportsWorkspaceWeeklyTimeEntriesPdf",
  "utils.postReportsWorkspaceTasks",
] as const;

// Reports API: paths in the document already start with /reports/api/v3 or /insights/api/v1.
export const reportsOptions = {
  source: { url: "https://engineering.toggl.com/assets/files/reports-c9bb77e23d0637e43ddfd60a0134437d.json" },
  allowedOrigin: origin,
  baseUrl: origin,
  kinds: Object.fromEntries(readOnlyReports.map((name) => [name, "query" as const])),
  securitySchemes: basic,
  fallbackSecurity: [{ BasicAuth: [] }],
  methods,
  oauth: [],
} satisfies OpenapiToolNamesOptions;

// Webhooks API v1: paths in the document are relative to /webhooks/api/v1.
export const webhooksOptions = {
  source: { url: "https://engineering.toggl.com/assets/files/webhooks-479d375ba167e9f885df9356e34a7c4e.json" },
  allowedOrigin: origin,
  baseUrl: `${origin}/webhooks/api/v1`,
  securitySchemes: basic,
  fallbackSecurity: [{ BasicAuth: [] }],
  methods,
  oauth: [],
} satisfies OpenapiToolNamesOptions;
