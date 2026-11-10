import {
  accountRouter,
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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const origin = "https://api.securitytrails.com";

const securitytrails = defineProvider({
  name: "SecurityTrails",
  hosts: ["api.securitytrails.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /v1/ping verifies the key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin}/v1/ping`, { signal, headers: { APIKEY: account.fields.token } });
    await decodeJson(response, object({ success: boolean().optional() }));
  },
});

type Account = { fields: { token: string } };
type Query = Record<string, string | number | boolean | undefined>;
type Fetch = typeof fetch;

const seg = (value: string) => encodeURIComponent(value);

const call = async (
  fetch: Fetch,
  account: Account,
  signal: AbortSignal,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  options: { query?: Query; body?: unknown } = {},
) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(options.query ?? {})) if (value !== undefined) params.set(key, String(value));
  const qs = params.toString();
  return decodeJson(
    await fetch(`${origin}${path}${qs ? `?${qs}` : ""}`, {
      method,
      signal,
      headers: {
        APIKEY: account.fields.token,
        Accept: "application/json",
        ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    }),
    json(),
  );
};

const hostname = object({ hostname: string() });
const page = object({ hostname: string(), page: number().optional() });
const project = object({ projectId: string() });
const asset = object({ projectId: string(), assetId: string() });
const filterBody = (what: string) =>
  `${what} Pass the request body as \`body\`: { "filter": { ... } } with string filter keys such as ipv4, ipv6, apex_domain, subdomain, keyword, tld, mx, ns, cname, soa_email, whois_email, whois_name, whois_organization, whois_telephone, whois_fax, whois_street1..4, whois_city, whois_postalCode.`;
const dslBody = (what: string) =>
  `${what} Pass the request body as \`body\`: { "query": "<SecurityTrails DSL expression>" }, for example { "query": "whois_email = 'admin@example.com'" }.`;

const tools = (account: Account, signal: AbortSignal) =>
  router({
    account: router(
      {
        ping: query(
          { description: "Test the API key and access to the SecurityTrails API.", input: object({}) },
          async ({ fetch }) => call(fetch, account, signal, "GET", "/v1/ping"),
        ),
        usage: query(
          { description: "Current and allowed monthly API usage for this account.", input: object({}) },
          async ({ fetch }) => call(fetch, account, signal, "GET", "/v1/account/usage"),
        ),
      },
      { title: "Account", description: "API key check and monthly usage." },
    ),
    domain: router(
      {
        get: query(
          {
            description:
              "Current DNS data for a hostname (A, AAAA, MX, NS, SOA, TXT) with the number of other hostnames sharing each record.",
            input: hostname,
          },
          async ({ fetch }, { hostname }) => call(fetch, account, signal, "GET", `/v1/domain/${seg(hostname)}`),
        ),
        subdomains: query(
          {
            description: "List subdomains of a domain. Returns subdomain labels without the parent domain.",
            input: hostname,
          },
          async ({ fetch }, { hostname }) => call(fetch, account, signal, "GET", `/v1/domain/${seg(hostname)}/subdomains`),
        ),
        tags: query(
          { description: "Tags SecurityTrails has attached to a hostname.", input: hostname },
          async ({ fetch }, { hostname }) => call(fetch, account, signal, "GET", `/v1/domain/${seg(hostname)}/tags`),
        ),
        associated: query(
          { description: "Domains related to the given domain. Paginated (page from 1).", input: page },
          async ({ fetch }, { hostname, page }) =>
            call(fetch, account, signal, "GET", `/v1/domain/${seg(hostname)}/associated`, { query: { page } }),
        ),
        whois: query(
          { description: "Current WHOIS data for a domain.", input: hostname },
          async ({ fetch }, { hostname }) => call(fetch, account, signal, "GET", `/v1/domain/${seg(hostname)}/whois`),
        ),
        whoisHistory: query(
          { description: "Historical WHOIS records for a domain. Paginated (page from 1).", input: page },
          async ({ fetch }, { hostname, page }) =>
            call(fetch, account, signal, "GET", `/v1/history/${seg(hostname)}/whois`, { query: { page } }),
        ),
        dnsHistory: query(
          {
            description:
              "Historical DNS records of one type for a hostname. type is one of a, aaaa, mx, ns, soa, txt. Paginated (page from 1).",
            input: object({ hostname: string(), type: string(), page: number().optional() }),
          },
          async ({ fetch }, { hostname, type, page }) =>
            call(fetch, account, signal, "GET", `/v1/history/${seg(hostname)}/dns/${seg(type)}`, { query: { page } }),
        ),
        ssl: query(
          {
            description:
              "Current and historical SSL/TLS certificates for a hostname. includeSubdomains adds subdomains; status is valid (default), expired or all.",
            input: object({ hostname: string(), includeSubdomains: boolean().optional(), status: string().optional() }),
          },
          async ({ fetch }, { hostname, includeSubdomains, status }) =>
            call(fetch, account, signal, "GET", `/v1/domain/${seg(hostname)}/ssl`, {
              query: { include_subdomains: includeSubdomains, status },
            }),
        ),
      },
      { title: "Domains", description: "DNS, subdomains, WHOIS, history, SSL certificates and associated domains." },
    ),
    search: router(
      {
        domains: query(
          {
            description: filterBody("Search domains by filter (POST /v1/domains/list). includeIps resolves A records and returns IPs; page from 1."),
            input: object({ body: json(), includeIps: boolean().optional(), page: number().optional() }),
          },
          async ({ fetch }, { body, includeIps, page }) =>
            call(fetch, account, signal, "POST", "/v1/domains/list", { query: { include_ips: includeIps, page }, body }),
        ),
        domainsScroll: query(
          {
            description: dslBody(
              "Search domains by DSL (POST /v1/domains/list-backup). Pass scroll=true on the first request, then use the returned scroll_id with scroll.next.",
            ),
            input: object({ body: json(), includeIps: boolean().optional(), page: number().optional(), scroll: boolean().optional() }),
          },
          async ({ fetch }, { body, includeIps, page, scroll }) =>
            call(fetch, account, signal, "POST", "/v1/domains/list-backup", { query: { include_ips: includeIps, page, scroll }, body }),
        ),
        domainStats: query(
          {
            description: `Domain counts (tld_count, hostname_count, domain_count) for a search (POST /v1/domains/stats). Pass body as { "query": "<DSL>" } or { "filter": { ... } } using the filter keys of search.domains.`,
            input: object({ body: json() }),
          },
          async ({ fetch }, { body }) => call(fetch, account, signal, "POST", "/v1/domains/stats", { body }),
        ),
        ips: query(
          {
            description:
              "Search the IP dataset by DSL (POST /v1/ips/list). Pass body as { \"query\": \"ptr_part = 'ns1'\" }. page from 1.",
            input: object({ body: json(), page: number().optional() }),
          },
          async ({ fetch }, { body, page }) => call(fetch, account, signal, "POST", "/v1/ips/list", { query: { page }, body }),
        ),
        ipStats: query(
          {
            description: "Aggregate open-port and PTR statistics for an IP DSL query (POST /v1/ips/stats). Body as for search.ips.",
            input: object({ body: json() }),
          },
          async ({ fetch }, { body }) => call(fetch, account, signal, "POST", "/v1/ips/stats", { body }),
        ),
      },
      { title: "Search", description: "Filter and DSL search over the domain and IP datasets." },
    ),
    scroll: router(
      {
        next: query(
          {
            description: "Fetch the next page of a scrolling DSL search using the scroll_id from a previous response.",
            input: object({ scrollId: string() }),
          },
          async ({ fetch }, { scrollId }) => call(fetch, account, signal, "GET", `/v1/scroll/${seg(scrollId)}`),
        ),
      },
      { title: "Scroll", description: "Continue a scrolling search." },
    ),
    ip: router(
      {
        nearby: query(
          { description: "Neighbouring IP blocks around an IPv4 address (optionally with a CIDR mask), with hostname counts.", input: object({ ip: string() }) },
          async ({ fetch }, { ip }) => call(fetch, account, signal, "GET", `/v1/ips/nearby/${seg(ip)}`),
        ),
        whois: query(
          { description: "Current WHOIS data for an IPv4 address.", input: object({ ip: string() }) },
          async ({ fetch }, { ip }) => call(fetch, account, signal, "GET", `/v1/ips/${seg(ip)}/whois`),
        ),
        useragents: query(
          { description: "User agents seen for an IPv4 address.", input: object({ ip: string() }) },
          async ({ fetch }, { ip }) => call(fetch, account, signal, "GET", `/v1/ips/${seg(ip)}/useragents`),
        ),
      },
      { title: "IPs", description: "IP neighbours, WHOIS and user agents." },
    ),
    company: router(
      {
        associatedIps: query(
          {
            description: "CIDR blocks associated with a company domain (v2 API). Paginated.",
            input: object({ domain: string(), page: number().optional(), pageSize: number().optional() }),
          },
          async ({ fetch }, { domain, page, pageSize }) =>
            call(fetch, account, signal, "GET", `/v2/company/${seg(domain)}/associated-ips`, { query: { page, page_size: pageSize } }),
        ),
      },
      { title: "Company", description: "Company-level intelligence." },
    ),
    reports: router(
      {
        startDownload: mutation(
          {
            description: "Start an asynchronous Action Center report download job; poll downloadStatus with the returned uuid. reportType is one of exposures-issue, exposures-host, vulnerable-products.",
            input: object({ projectId: string(), reportType: string() }),
            approval: always(),
          },
          async ({ fetch }, { projectId, reportType }) =>
            call(fetch, account, signal, "GET", `/v2/action_center/reports_async/${seg(projectId)}/${seg(reportType)}`),
        ),
        downloadStatus: query(
          { description: "State of an asynchronous report download job.", input: object({ uuid: string() }) },
          async ({ fetch }, { uuid }) => call(fetch, account, signal, "GET", `/v1/downloads/status/${seg(uuid)}`),
        ),
      },
      { title: "Reports", description: "Attack Surface Intelligence Action Center reports." },
    ),
    projects: router(
      {
        list: query(
          { description: "Attack Surface Intelligence projects this key can access.", input: object({ sortDirection: string().optional() }) },
          async ({ fetch }, { sortDirection }) => call(fetch, account, signal, "GET", "/v2/projects", { query: { sort_direction: sortDirection } }),
        ),
        tags: query(
          { description: "User-defined tags in a project.", input: project },
          async ({ fetch }, { projectId }) => call(fetch, account, signal, "GET", `/v2/projects/${seg(projectId)}/tags`),
        ),
        addTag: mutation(
          { description: "Create a user-defined tag in a project (no error if it exists).", input: object({ projectId: string(), tag: string() }), approval: always() },
          async ({ fetch }, { projectId, tag }) => call(fetch, account, signal, "POST", `/v2/projects/${seg(projectId)}/tags/${seg(tag)}`),
        ),
        bulkTagAssets: mutation(
          { description: "Bulk add and remove tags on many assets. body is { \"asset_tags\": { \"<asset>\": { \"add_tags\": [...], \"remove_tags\": [...] } } }.", input: object({ projectId: string(), body: json() }), approval: always() },
          async ({ fetch }, { projectId, body }) => call(fetch, account, signal, "POST", `/v2/projects/${seg(projectId)}/tags/_bulk_tag_assets`, { body }),
        ),
        tagTaskStatus: query(
          { description: "Status of an asynchronous tagging task.", input: object({ projectId: string(), taskId: string() }) },
          async ({ fetch }, { projectId, taskId }) =>
            call(fetch, account, signal, "GET", `/v2/projects/${seg(projectId)}/tags/_task_status/${seg(taskId)}`),
        ),
        filters: query(
          { description: "Available asset filters and their values for a project. filterFields is a comma-separated list of fields (or all).", input: object({ projectId: string(), filterFields: string().optional() }) },
          async ({ fetch }, { projectId, filterFields }) =>
            call(fetch, account, signal, "GET", `/v2/projects/${seg(projectId)}/filters`, { query: { filter_fields: filterFields } }),
        ),
        filtersWithFilter: query(
          { description: "Available asset filters computed over an already-filtered asset set. body is { filter, filter_fields } using the same filter structure as assets.search.", input: object({ projectId: string(), body: json() }) },
          async ({ fetch }, { projectId, body }) => call(fetch, account, signal, "POST", `/v2/projects/${seg(projectId)}/filters`, { body }),
        ),
        exposures: query(
          {
            description: "List exposures (vulnerabilities and misconfigurations) in a project. Optional filters: cve id, CVSS range, CWE id, severity.",
            input: object({
              projectId: string(),
              cursor: string().optional(),
              limit: number().optional(),
              cveId: string().optional(),
              cvssScoreGte: number().optional(),
              cvssScoreLte: number().optional(),
              cweId: string().optional(),
              severity: string().optional(),
              severityExact: string().optional(),
              severityMin: string().optional(),
            }),
          },
          async ({ fetch }, { projectId, cveId, cvssScoreGte, cvssScoreLte, cweId, severity, severityExact, severityMin, ...rest }) =>
            call(fetch, account, signal, "GET", `/v2/projects/${seg(projectId)}/exposures`, {
              query: {
                ...rest,
                filter_cve_id: cveId,
                filter_cvss_score_gte: cvssScoreGte,
                filter_cvss_score_lte: cvssScoreLte,
                filter_cwe_id: cweId,
                filter_severity: severity,
                filter_severity_exact: severityExact,
                filter_severity_min: severityMin,
              },
            }),
        ),
        exposureAssets: query(
          { description: "Assets affected by one exposure signature.", input: object({ projectId: string(), signatureId: string(), cursor: string().optional(), limit: number().optional() }) },
          async ({ fetch }, { projectId, signatureId, ...rest }) =>
            call(fetch, account, signal, "GET", `/v2/projects/${seg(projectId)}/exposures/${seg(signatureId)}`, { query: rest }),
        ),
        staticAssetRules: query(
          {
            description: "List static asset rules (the monitoring scope) of a project.",
            input: object({
              projectId: string(),
              asset: string().optional(),
              staticType: string().optional(),
              membershipType: string().optional(),
              lastAppliedBefore: string().optional(),
              lastAppliedAfter: string().optional(),
              includeDeleted: boolean().optional(),
              limit: number().optional(),
              cursor: string().optional(),
            }),
          },
          async ({ fetch }, { projectId, staticType, membershipType, lastAppliedBefore, lastAppliedAfter, includeDeleted, ...rest }) =>
            call(fetch, account, signal, "GET", `/v2/projects/${seg(projectId)}/rules/static_assets`, {
              query: {
                ...rest,
                static_type: staticType,
                membership_type: membershipType,
                last_applied_before: lastAppliedBefore,
                last_applied_after: lastAppliedAfter,
                include_deleted: includeDeleted,
              },
            }),
        ),
        bulkStaticAssetRules: mutation(
          {
            description: "Add or remove static asset rules in bulk (up to 1000 per request); changes which assets are monitored. body is { \"static_assets\": { \"add_rules\": [{ asset, membership_type: include|exclude, static_type: ipv4|hostname|wildcard }], \"remove_rules\": [...] } }.",
            input: object({ projectId: string(), body: json() }),
            approval: always(),
          },
          async ({ fetch }, { projectId, body }) =>
            call(fetch, account, signal, "POST", `/v2/projects/${seg(projectId)}/rules/_bulk_static_assets`, { body }),
        ),
      },
      { title: "Projects", description: "Attack Surface Intelligence projects: tags, filters, exposures and monitoring rules." },
    ),
    assets: router(
      {
        search: query(
          { description: "Search assets in a project with filtering, pagination and sorting. body has filter (asset_properties, certificate_properties, exposure_properties, technology_properties, quick_search), pagination { limit, next_cursor }, enrichments and sort.", input: object({ projectId: string(), body: json() }) },
          async ({ fetch }, { projectId, body }) => call(fetch, account, signal, "POST", `/v2/projects/${seg(projectId)}/assets/_search`, { body }),
        ),
        find: query(
          {
            description:
              "Find project assets with query-parameter filters. filters is an object of documented query parameters, for example { asset_type: \"domain\", apex: \"example.com\", open_port_number: 443, exposure_severity: \"high\" }.",
            input: object({
              projectId: string(),
              cursor: string().optional(),
              limit: number().optional(),
              sortBy: string().optional(),
              sortDirection: string().optional(),
              additionalFields: string().optional(),
              filters: json().optional(),
            }),
          },
          async ({ fetch }, { projectId, cursor, limit, sortBy, sortDirection, additionalFields, filters }) =>
            call(fetch, account, signal, "GET", `/v2/projects/${seg(projectId)}/assets`, {
              query: {
                ...(filters && typeof filters === "object" && !Array.isArray(filters) ? (filters as Query) : {}),
                cursor,
                limit,
                sort_by: sortBy,
                sort_direction: sortDirection,
                additional_fields: additionalFields,
              },
            }),
        ),
        get: query(
          { description: "Read one asset. additionalFields is a comma-separated list such as dns_records,exposures,whois.", input: object({ projectId: string(), assetId: string(), additionalFields: string().optional() }) },
          async ({ fetch }, { projectId, assetId, additionalFields }) =>
            call(fetch, account, signal, "GET", `/v2/projects/${seg(projectId)}/assets/${seg(assetId)}`, { query: { additional_fields: additionalFields } }),
        ),
        exposures: query(
          { description: "Detailed exposures of one asset: ports, signatures and extracted versions.", input: asset },
          async ({ fetch }, { projectId, assetId }) =>
            call(fetch, account, signal, "GET", `/v2/projects/${seg(projectId)}/assets/${seg(assetId)}/exposures`),
        ),
        applyTag: mutation(
          { description: "Apply one user-defined tag to an asset.", input: object({ projectId: string(), assetId: string(), tag: string() }), approval: always() },
          async ({ fetch }, { projectId, assetId, tag }) =>
            call(fetch, account, signal, "PUT", `/v2/projects/${seg(projectId)}/assets/${seg(assetId)}/tags/${seg(tag)}`),
        ),
        removeTag: mutation(
          { description: "Remove one user-defined tag from an asset.", input: object({ projectId: string(), assetId: string(), tag: string() }), approval: always() },
          async ({ fetch }, { projectId, assetId, tag }) =>
            call(fetch, account, signal, "DELETE", `/v2/projects/${seg(projectId)}/assets/${seg(assetId)}/tags/${seg(tag)}`),
        ),
        bulkTags: mutation(
          { description: "Add and remove several tags on one asset. body is { \"add_tags\": [...], \"remove_tags\": [...] }.", input: object({ projectId: string(), assetId: string(), body: json() }), approval: always() },
          async ({ fetch }, { projectId, assetId, body }) =>
            call(fetch, account, signal, "POST", `/v2/projects/${seg(projectId)}/assets/${seg(assetId)}/tags`, { body }),
        ),
      },
      { title: "Assets", description: "Attack Surface Intelligence assets: search, read, exposures and tags." },
    ),
  });

export default defineApp(
  { user: { accounts: { securitytrails: securitytrails.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(await accountRouter(user?.accounts.securitytrails ?? [], (account) => tools(account, signal), { signal }), {
      title: "SecurityTrails",
      description:
        "Domain, DNS, WHOIS, subdomain, SSL certificate and IP intelligence from SecurityTrails, plus Attack Surface Intelligence projects, assets and exposures.",
      icons,
    }),
  }),
);
