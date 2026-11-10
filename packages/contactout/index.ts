import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.contactout.com";

const contactout = defineProvider({
  name: "ContactOut",
  hosts: ["api.contactout.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /v1/stats is the documented API usage endpoint.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1/stats`, {
      signal,
      headers: { authorization: "basic", token: account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

// Reads that spend credits get the same approval as the mutations that do.
const creditSpendingReads = new Set([
  "profiles.fromLinkedIn",
  "profiles.fromEmail",
  "contactInfo.get",
  "people.decisionMakers",
]);

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, options: { params?: Params; body?: unknown } = {}) => {
    const url = new URL(base + path);
    for (const [key, value] of Object.entries(options.params ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        authorization: "basic",
        token,
        Accept: "application/json",
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const strings = () => array(string());
const page = () => number().optional();

function build(call: Call) {
  return router({
    profiles: router(
      {
        fromLinkedIn: query(
          {
            description:
              "Get a full profile (experience, education, skills, company) from a LinkedIn profile URL. Set profileOnly to skip contact data. Uses credits.",
            input: object({ profile: string({ minLength: 1 }), profileOnly: boolean().optional() }),
          },
          async (_ctx, { profile, profileOnly }) =>
            call("GET", "/v1/linkedin/enrich", { params: { profile, profile_only: profileOnly } }),
        ),
        fromEmail: query(
          {
            description: "Get a profile from an email address. Set includeWorkEmail to also return work emails. Uses credits.",
            input: object({ email: string({ minLength: 3 }), includeWorkEmail: boolean().optional() }),
          },
          async (_ctx, { email, includeWorkEmail }) =>
            call("GET", "/v1/email/enrich", { params: { email, include: includeWorkEmail ? "work_email" : undefined } }),
        ),
        enrich: mutation(
          {
            description:
              "Match a person from any combination of LinkedIn URL, email, phone, or name plus company/location/education, and return their profile. List what contact data to return in include (work_email, personal_email, phone); contact data is only returned if requested. firstName and lastName must be sent together, and a name match needs a secondary field (company, location, etc.). company and companyDomain take at most 10 items each. Uses credits.",
            input: object({
              linkedinUrl: string().optional(),
              email: string().optional(),
              phone: string().optional(),
              fullName: string().optional(),
              firstName: string().optional(),
              lastName: string().optional(),
              company: strings().optional(),
              companyDomain: strings().optional(),
              education: strings().optional(),
              location: string().optional(),
              jobTitle: string().optional(),
              include: strings().optional(),
            }),
          },
          async (_ctx, i) =>
            call("POST", "/v1/people/enrich", {
              body: {
                linkedin_url: i.linkedinUrl,
                email: i.email,
                phone: i.phone,
                full_name: i.fullName,
                first_name: i.firstName,
                last_name: i.lastName,
                company: i.company,
                company_domain: i.companyDomain,
                education: i.education,
                location: i.location,
                job_title: i.jobTitle,
                include: i.include,
              },
            }),
        ),
        linkedInFromEmail: query(
          {
            description: "Find the LinkedIn profile URL for an email address.",
            input: object({ email: string({ minLength: 3 }) }),
          },
          async (_ctx, { email }) => call("GET", "/v1/people/person", { params: { email } }),
        ),
      },
      { title: "Profiles", description: "Enrich a person from a LinkedIn URL, email, phone or name." },
    ),
    contactInfo: router(
      {
        get: query(
          {
            description:
              "Get contact info (emails, optionally phones) for one LinkedIn profile URL. emailType is personal, work, 'personal,work' or none. Uses credits.",
            input: object({
              profile: string({ minLength: 1 }),
              includePhone: boolean().optional(),
              emailType: string().optional(),
            }),
          },
          async (_ctx, { profile, includePhone, emailType }) =>
            call("GET", "/v1/people/linkedin", {
              params: { profile, include_phone: includePhone, email_type: emailType },
            }),
        ),
        batch: mutation(
          {
            description:
              "Get contact info for up to 100 LinkedIn profile URLs synchronously. emailType is personal, work or 'personal,work'. Uses credits.",
            input: object({
              profiles: strings(),
              includePhone: boolean().optional(),
              emailType: string().optional(),
            }),
          },
          async (_ctx, { profiles, includePhone, emailType }) =>
            call("POST", "/v1/people/linkedin/batch", {
              body: { profiles, include_phone: includePhone, email_type: emailType },
            }),
        ),
        batchAsync: mutation(
          {
            description:
              "Start an asynchronous job for contact info on up to 1000 LinkedIn profile URLs. Returns a job id for batchAsyncResult. emailType is personal, work, 'personal,work' or none. Uses credits.",
            input: object({
              profiles: strings(),
              includePhone: boolean().optional(),
              emailType: string().optional(),
              callbackUrl: string().optional(),
            }),
          },
          async (_ctx, { profiles, includePhone, emailType, callbackUrl }) =>
            call("POST", "/v2/people/linkedin/batch", {
              body: { profiles, include_phone: includePhone, email_type: emailType, callback_url: callbackUrl },
            }),
        ),
        batchAsyncResult: query(
          {
            description: "Get the status and results of an asynchronous contact info job.",
            input: object({ jobId: string({ minLength: 1 }) }),
          },
          async (_ctx, { jobId }) => call("GET", `/v2/people/linkedin/batch/${encodeURIComponent(jobId)}`),
        ),
      },
      { title: "Contact info", description: "Emails and phone numbers for LinkedIn profiles." },
    ),
    people: router(
      {
        search: mutation(
          {
            description:
              "Search ContactOut's people database (60 requests/minute). Array filters accept boolean expressions with uppercase AND/OR/NOT where supported. pageSize is 1-25. revealInfo spends credits. Filters left out are not applied.",
            input: object({
              name: string().optional(),
              jobTitle: strings().optional(),
              pastJobTitle: strings().optional(),
              excludeJobTitles: strings().optional(),
              currentTitlesOnly: boolean().optional(),
              includeRelatedJobTitles: boolean().optional(),
              jobFunction: strings().optional(),
              seniority: strings().optional(),
              skills: strings().optional(),
              education: strings().optional(),
              location: strings().optional(),
              locationRadius: number().optional(),
              company: strings().optional(),
              pastCompany: strings().optional(),
              excludeCompanies: strings().optional(),
              domain: strings().optional(),
              industry: strings().optional(),
              keyword: string().optional(),
              companySize: strings().optional(),
              yearsOfExperience: strings().optional(),
              yearsInCurrentRole: strings().optional(),
              recentlyChangedJobs: boolean().optional(),
              page: page(),
              pageSize: number().optional(),
              dataTypes: strings().optional(),
              revealInfo: boolean().optional(),
            }),
          },
          async (_ctx, i) =>
            call("POST", "/v1/people/search", {
              body: {
                name: i.name,
                job_title: i.jobTitle,
                past_job_title: i.pastJobTitle,
                exclude_job_titles: i.excludeJobTitles,
                current_titles_only: i.currentTitlesOnly,
                include_related_job_titles: i.includeRelatedJobTitles,
                job_function: i.jobFunction,
                seniority: i.seniority,
                skills: i.skills,
                education: i.education,
                location: i.location,
                location_radius: i.locationRadius,
                company: i.company,
                past_company: i.pastCompany,
                exclude_companies: i.excludeCompanies,
                domain: i.domain,
                industry: i.industry,
                keyword: i.keyword,
                company_size: i.companySize,
                years_of_experience: i.yearsOfExperience,
                years_in_current_role: i.yearsInCurrentRole,
                recently_changed_jobs: i.recentlyChangedJobs,
                page: i.page,
                page_size: i.pageSize,
                data_types: i.dataTypes,
                reveal_info: i.revealInfo,
              },
            }),
        ),
        count: mutation(
          {
            description:
              "Count people matching search filters without spending credits (paid accounts only). Takes the same filters as people.search except paging and reveal options.",
            input: object({
              name: string().optional(),
              jobTitle: strings().optional(),
              pastJobTitle: strings().optional(),
              jobFunction: strings().optional(),
              seniority: strings().optional(),
              skills: strings().optional(),
              education: strings().optional(),
              location: strings().optional(),
              company: strings().optional(),
              pastCompany: strings().optional(),
              domain: strings().optional(),
              industry: strings().optional(),
              keyword: string().optional(),
              companySize: strings().optional(),
            }),
          },
          async (_ctx, i) =>
            call("POST", "/v1/people/count", {
              body: {
                name: i.name,
                job_title: i.jobTitle,
                past_job_title: i.pastJobTitle,
                job_function: i.jobFunction,
                seniority: i.seniority,
                skills: i.skills,
                education: i.education,
                location: i.location,
                company: i.company,
                past_company: i.pastCompany,
                domain: i.domain,
                industry: i.industry,
                keyword: i.keyword,
                company_size: i.companySize,
              },
            }),
        ),
        decisionMakers: query(
          {
            description:
              "Find decision makers at a company. Provide at least one of linkedinUrl (company page), domain or name. revealInfo spends credits. Always requires approval.",
            input: object({
              linkedinUrl: string().optional(),
              domain: string().optional(),
              name: string().optional(),
              page: page(),
              revealInfo: boolean().optional(),
            }),
          },
          async (_ctx, i) =>
            call("GET", "/v1/people/decision-makers", {
              params: { linkedin_url: i.linkedinUrl, domain: i.domain, name: i.name, page: i.page, reveal_info: i.revealInfo },
            }),
        ),
      },
      { title: "People", description: "Search and count people, and find decision makers." },
    ),
    companies: router(
      {
        search: mutation(
          {
            description:
              "Search companies by name, domain, size, location, industry, technologies, revenue or founding year. linkedinUrl (max 25) cannot be combined with other filters.",
            input: object({
              linkedinUrl: strings().optional(),
              name: strings().optional(),
              domain: strings().optional(),
              size: strings().optional(),
              hqOnly: boolean().optional(),
              location: strings().optional(),
              industries: strings().optional(),
              technologies: strings().optional(),
              minRevenue: number().optional(),
              maxRevenue: number().optional(),
              yearFoundedFrom: number().optional(),
              yearFoundedTo: number().optional(),
              page: page(),
            }),
          },
          async (_ctx, i) =>
            call("POST", "/v1/company/search", {
              body: {
                linkedin_url: i.linkedinUrl,
                name: i.name,
                domain: i.domain,
                size: i.size,
                hq_only: i.hqOnly,
                location: i.location,
                industries: i.industries,
                technologies: i.technologies,
                min_revenue: i.minRevenue,
                max_revenue: i.maxRevenue,
                year_founded_from: i.yearFoundedFrom,
                year_founded_to: i.yearFoundedTo,
                page: i.page,
              },
            }),
        ),
        fromDomains: mutation(
          {
            description: "Get company information for up to 30 domains (for example example.com).",
            input: object({ domains: strings() }),
          },
          async (_ctx, { domains }) => call("POST", "/v1/domain/enrich", { body: { domains } }),
        ),
      },
      { title: "Companies", description: "Company search and enrichment." },
    ),
    checks: router(
      {
        personalEmailStatus: query(
          {
            description: "Check whether a LinkedIn profile has a personal email available.",
            input: object({ profile: string({ minLength: 1 }) }),
          },
          async (_ctx, { profile }) => call("GET", "/v1/people/linkedin/personal_email_status", { params: { profile } }),
        ),
        workEmailStatus: query(
          {
            description: "Check whether a LinkedIn profile has a work email available.",
            input: object({ profile: string({ minLength: 1 }) }),
          },
          async (_ctx, { profile }) => call("GET", "/v1/people/linkedin/work_email_status", { params: { profile } }),
        ),
        phoneStatus: query(
          {
            description: "Check whether a LinkedIn profile has a phone number available.",
            input: object({ profile: string({ minLength: 1 }) }),
          },
          async (_ctx, { profile }) => call("GET", "/v1/people/linkedin/phone_status", { params: { profile } }),
        ),
        verifyEmail: query(
          {
            description: "Verify whether one email address is deliverable.",
            input: object({ email: string({ minLength: 3 }) }),
          },
          async (_ctx, { email }) => call("GET", "/v1/email/verify", { params: { email } }),
        ),
        verifyEmails: mutation(
          {
            description:
              "Start a bulk email verification job for up to 100 addresses. Returns a job id for verifyEmailsResult. Results are POSTed to callbackUrl when given.",
            input: object({ emails: strings(), callbackUrl: string().optional() }),
          },
          async (_ctx, { emails, callbackUrl }) =>
            call("POST", "/v1/email/verify/batch", { body: { emails, callback_url: callbackUrl } }),
        ),
        verifyEmailsResult: query(
          {
            description: "Get the status and results of a bulk email verification job.",
            input: object({ jobId: string({ minLength: 1 }) }),
          },
          async (_ctx, { jobId }) => call("GET", `/v1/email/verify/batch/${encodeURIComponent(jobId)}`),
        ),
      },
      { title: "Checks", description: "Check contact data availability and verify emails." },
    ),
    usage: query(
      {
        description: "Get API usage statistics for a month (period as YYYY-MM, default the current month).",
        input: object({ period: string().optional() }),
      },
      async (_ctx, { period }) => call("GET", "/v1/stats", { params: { period } }),
    ),
    campaigns: router(
      {
        list: query(
          {
            description: "List campaigns (pageSize up to 50). The Campaigns API must be enabled for the token.",
            input: object({ page: page(), pageSize: number().optional() }),
          },
          async (_ctx, { page, pageSize }) => call("GET", "/v1/campaigns", { params: { page, page_size: pageSize } }),
        ),
        get: query(
          {
            description: "Get one campaign, optionally with its stats.",
            input: object({ campaignId: string({ minLength: 1 }), includeStats: boolean().optional() }),
          },
          async (_ctx, { campaignId, includeStats }) =>
            call("GET", `/v1/campaigns/${encodeURIComponent(campaignId)}`, { params: { include_stats: includeStats } }),
        ),
        addRecipients: mutation(
          {
            description:
              "Add 1-100 recipients to a campaign (email and phone max 255 chars, names and company max 100 chars per the docs). Each recipient needs an email or phone; first_name, last_name and company are optional. Each is handled separately, so a call can partly succeed.",
            input: object({
              campaignId: string({ minLength: 1 }),
              recipients: array(
                object({
                  email: string().optional(),
                  phone: string().optional(),
                  first_name: string().optional(),
                  last_name: string().optional(),
                  company: string().optional(),
                }),
              ),
            }),
          },
          async (_ctx, { campaignId, recipients }) =>
            call("POST", `/v1/campaigns/${encodeURIComponent(campaignId)}/recipients`, { body: { recipients } }),
        ),
        removeRecipients: mutation(
          {
            description: "Remove 1-100 recipients, identified by email, from a campaign.",
            input: object({
              campaignId: string({ minLength: 1 }),
              recipients: array(object({ email: string({ minLength: 3 }) })),
            }),
          },
          async (_ctx, { campaignId, recipients }) =>
            call("DELETE", `/v1/campaigns/${encodeURIComponent(campaignId)}/recipients`, { body: { recipients } }),
        ),
        start: mutation(
          {
            description: "Start a campaign.",
            input: object({ campaignId: string({ minLength: 1 }) }),
          },
          async (_ctx, { campaignId }) => call("POST", `/v1/campaigns/${encodeURIComponent(campaignId)}/start`),
        ),
        stop: mutation(
          {
            description: "Stop a running campaign.",
            input: object({ campaignId: string({ minLength: 1 }) }),
          },
          async (_ctx, { campaignId }) => call("POST", `/v1/campaigns/${encodeURIComponent(campaignId)}/stop`),
        ),
      },
      { title: "Campaigns", description: "Manage outreach campaigns and recipients (requires the Campaigns API on the token)." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { contactout: contactout.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.contactout ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool, name) =>
            tool.kind === "mutation" || creditSpendingReads.has(name) ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ContactOut",
        description:
          "Find and verify professional contact details: profile enrichment, people and company search, email and phone checks, decision makers, usage stats and campaigns.",
        icons,
      },
    ),
  }),
);
