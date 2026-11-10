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
  oauth2,
  secrets,
  string,
  array,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const BASE = "https://api.a-leads.co/gateway/v1";
const MCP_URL = "https://mcp.a-leads.co";

const aleads = defineProvider({
  name: "A-Leads",
  hosts: ["api.a-leads.co", "mcp.a-leads.co"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The official MCP server only supports OAuth with dynamic client registration.
    oauth: oauth2({ discover: MCP_URL }),
  },
  async health(check) {
    if (check.account.method === "oauth") {
      return mcpHealth(check, {
        url: MCP_URL,
        headers: { Authorization: `Bearer ${check.account.fields.access_token}` },
      });
    }
    // get-all-bulk-files is a free read that requires a valid key.
    const response = await check.fetch(`${BASE}/search/get-all-bulk-files`, {
      method: "POST",
      signal: check.signal,
      headers: { "x-api-key": check.account.fields.token, "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: check.account.fields.token }),
    });
    await decodeJson(response, json());
  },
});

const filters = record(json());

export default defineApp(
  { user: { accounts: { aleads: aleads.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.aleads ?? [],
        async (account) => {
          if (account.method === "oauth") {
            return router({
              mcp: withApprovals(
                await mcpRouter({
                  url: MCP_URL,
                  account,
                  headers: { Authorization: `Bearer ${account.fields.access_token}` },
                  signal,
                }),
                (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
              ),
            });
          }
          const call = async (method: "GET" | "POST", path: string, body?: unknown) => {
            const response = await fetch(`${BASE}${path}`, {
              method,
              signal,
              headers: {
                "x-api-key": account.fields.token,
                ...(body === undefined ? {} : { "Content-Type": "application/json" }),
              },
              ...(body === undefined ? {} : { body: JSON.stringify(body) }),
            });
            return decodeJson(response, json());
          };
          const post = (path: string, body: unknown) => call("POST", path, body);
          const dataOf = (data: Record<string, unknown>) => ({ data });

          return router({
            advancedSearch: query(
              {
                description:
                  "Search people (with their companies) using A-Leads advanced filters such as job_title, member_location_raw_address, organizations, technologies_used, mapped_company_size, hq_location and bulk_domains. `advancedFilters` is passed through as `advanced_filters`; see https://docs.a-leads.co/reference/post_advanced-search. Consumes credits.",
                input: object({
                  advancedFilters: filters,
                  currentPage: number().optional(),
                  searchType: string().optional(),
                }),
                approval: always(),
              },
              async (_ctx, { advancedFilters, currentPage, searchType }) =>
                post("/search/advanced-search", {
                  advanced_filters: advancedFilters,
                  ...(currentPage === undefined ? {} : { current_page: currentPage }),
                  ...(searchType === undefined ? {} : { search_type: searchType }),
                }),
            ),
            findEmail: query(
              {
                description:
                  "Find a professional email from a first name, last name and company website, or from a document_id returned by advanced search. Consumes credits.",
                input: object({
                  firstName: string().optional(),
                  lastName: string().optional(),
                  website: string().optional(),
                  documentId: string().optional(),
                  requestUuid: string().optional(),
                }),
                approval: always(),
              },
              async (_ctx, i) =>
                post(
                  "/search/find-email",
                  dataOf({
                    ...(i.firstName === undefined ? {} : { first_name: i.firstName }),
                    ...(i.lastName === undefined ? {} : { last_name: i.lastName }),
                    ...(i.website === undefined ? {} : { website: i.website }),
                    ...(i.documentId === undefined ? {} : { document_id: i.documentId }),
                    ...(i.requestUuid === undefined ? {} : { request_uuid: i.requestUuid }),
                  }),
                ),
            ),
            findPersonalEmail: query(
              {
                description: "Find a personal email address from a LinkedIn profile URL or username. Consumes credits.",
                input: object({ linkedinUsername: string({ minLength: 1 }), requestUuid: string().optional() }),
                approval: always(),
              },
              async (_ctx, i) =>
                post(
                  "/search/find-email/personal",
                  dataOf({
                    linkedin_username: i.linkedinUsername,
                    ...(i.requestUuid === undefined ? {} : { request_uuid: i.requestUuid }),
                  }),
                ),
            ),
            findPhone: query(
              {
                description: "Find a direct phone number from a LinkedIn profile URL or username. Consumes credits.",
                input: object({ linkedinUsername: string({ minLength: 1 }), requestUuid: string().optional() }),
                approval: always(),
              },
              async (_ctx, i) =>
                post(
                  "/search/find-phone",
                  dataOf({
                    linkedin_username: i.linkedinUsername,
                    ...(i.requestUuid === undefined ? {} : { request_uuid: i.requestUuid }),
                  }),
                ),
            ),
            verifyEmail: query(
              {
                description: "Check whether an email address is deliverable. Consumes credits.",
                input: object({ email: string({ minLength: 1 }) }),
                approval: always(),
              },
              async (_ctx, { email }) => post("/search/verify-email", dataOf({ email })),
            ),
            bulkAdvancedSearch: mutation(
              {
                description:
                  "Start a bulk people search job from advanced filters, optionally enriching results with emails, personal emails and phone numbers. Returns a job; fetch results with getBulkFile. `options` may carry batch_size, search_type, email_enrich, phone_enrich, partial_enrich and personal_email_enrich. Consumes credits.",
                input: object({ advancedFilters: filters, options: filters.optional() }),
                approval: always(),
              },
              async (_ctx, { advancedFilters, options }) =>
                post("/search/bulk-advanced-search", { ...(options ?? {}), advanced_filters: advancedFilters }),
            ),
            getBulkFile: query(
              {
                description: "Get the status and download details of a bulk search file by its file id.",
                input: object({ fileId: string({ minLength: 1 }) }),
              },
              async (_ctx, { fileId }) => post("/search/get-bulk-file", { file_id: fileId }),
            ),
            listBulkFiles: query(
              {
                description: "List all bulk search files created with this API key.",
                input: object({}),
              },
              async () => post("/search/get-all-bulk-files", { api_key: account.fields.token }),
            ),
            companySearch: query(
              {
                description:
                  "Search companies with `companyFilters` (organizations, bulk_domains, technologies_used, hq_location, mapped_company_size, min_revenue_annual, job_posting_title and more); see https://docs.a-leads.co/reference/post_. Each call costs 1 credit.",
                input: object({ companyFilters: filters, currentPage: number().optional() }),
                approval: always(),
              },
              async (_ctx, { companyFilters, currentPage }) =>
                post("/company-search/", {
                  company_filters: companyFilters,
                  ...(currentPage === undefined ? {} : { current_page: currentPage }),
                }),
            ),
            companyDetails: query(
              {
                description: "Get comprehensive details for one company by its A-Leads company id.",
                input: object({ id: number() }),
                approval: always(),
              },
              async (_ctx, { id }) => call("GET", `/company-search/${encodeURIComponent(String(id))}`),
            ),
            similarCompanies: query(
              {
                description: "Find companies similar to a list of A-Leads company ids.",
                input: object({
                  companyIds: array(number()),
                  page: number().optional(),
                  pageSize: number().optional(),
                }),
                approval: always(),
              },
              async (_ctx, i) =>
                post("/company-search/similar", {
                  company_ids: i.companyIds,
                  ...(i.page === undefined ? {} : { page: i.page }),
                  ...(i.pageSize === undefined ? {} : { page_size: i.pageSize }),
                }),
            ),
            bulkCompanySearch: mutation(
              {
                description:
                  "Start a bulk company search job from company filters. `options` may carry name, batch_size and search_type. Consumes credits.",
                input: object({ companyFilters: filters, options: filters.optional() }),
                approval: always(),
              },
              async (_ctx, { companyFilters, options }) =>
                post("/company-search/bulk/", { ...(options ?? {}), company_filters: companyFilters }),
            ),
            reverseEmailLookup: mutation(
              {
                description:
                  "Start a reverse email lookup: identify the person behind an email address. Returns a job id; poll with reverseEmailLookupStatus. Consumes credits.",
                input: object({ email: string({ minLength: 1 }) }),
                approval: always(),
              },
              async (_ctx, { email }) => post("/reverse-email-lookup/verify", { email }),
            ),
            reverseEmailLookupStatus: query(
              {
                description: "Get the status and result of a reverse email lookup job.",
                input: object({ jobId: string({ minLength: 1 }) }),
              },
              async (_ctx, { jobId }) =>
                call("GET", `/reverse-email-lookup/status/${encodeURIComponent(jobId)}`),
            ),
          });
        },
        { signal },
      ),
      {
        title: "A-Leads",
        description:
          "A-Leads B2B prospecting: search people and companies, find and verify emails, personal emails and phone numbers, reverse email lookup, and bulk searches. API-key accounts get the REST tools; OAuth accounts get the official MCP tools (saved searches, credit usage).",
        icons,
      },
    ),
  }),
);
