import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
  boolean,
  record,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.imgix.com/api/v1";

const imgix = defineProvider({
  name: "Imgix",
  hosts: ["api.imgix.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Keys are scoped by permission (Sources, Purge, Asset Manager, Analytics), so any one endpoint may be
  // forbidden for a valid key. Only 401 means the key itself is bad.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/sources`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/vnd.api+json" },
    });
    if (response.status === 401) throw new Error("Imgix rejected the API key (401)");
  },
});

type Fetch = typeof fetch;
type Call = (method: string, path: string, options?: { query?: Record<string, string | undefined>; body?: unknown }) => Promise<unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined): Call {
  return async (method, path, options = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined && value !== "") url.searchParams.set(key, value);
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    // Some endpoints (add asset) answer 202 with no body.
    if (response.status === 202 || response.status === 204) return { status: response.status };
    return decodeJson(response, json());
  };
}

const segments = (path: string) => path.split("/").map(encodeURIComponent).join("/");
const attrs = (type: string, attributes: Record<string, unknown>, id?: string) => ({
  data: { type, ...(id ? { id } : {}), attributes: attributes },
});

function build(call: Call) {
  return router({
    sources: router(
      {
        list: query(
          {
            description:
              "List the account's Sources. Optional filters: name, enabled ('true'/'false'), deploymentType (azure, gcs, s3, webfolder, webproxy, s3_compatible). sort is one of date_deployed, enabled, name (prefix - for descending).",
            input: object({
              name: string().optional(),
              enabled: string().optional(),
              deploymentType: string().optional(),
              sort: string().optional(),
            }),
          },
          async (_ctx, i) =>
            call("GET", "/sources", {
              query: {
                "filter[name]": i.name,
                "filter[enabled]": i.enabled,
                "filter[deployment.type]": i.deploymentType,
                sort: i.sort,
              },
            }),
        ),
        get: query(
          { description: "Get one Source by id (the 24-character id from sources.list).", input: object({ sourceId: string({ minLength: 1 }) }) },
          async (_ctx, { sourceId }) => call("GET", `/sources/${encodeURIComponent(sourceId)}`),
        ),
        create: mutation(
          {
            description:
              "Create and deploy a Source. 'name' is a label. 'deployment' is the JSON:API deployment attributes object: type (s3, gcs, azure, webfolder, webproxy, s3_compatible), imgix_subdomains (list of subdomain names only) plus the type's required fields (for s3: s3_access_key, s3_secret_key, s3_bucket; optional s3_prefix). Limited to 60 creates per hour.",
            input: object({ name: string({ minLength: 1 }), enabled: boolean().optional(), deployment: json() }),
          },
          async (_ctx, i) =>
            call("POST", "/sources", {
              body: attrs("sources", { name: i.name, ...(i.enabled === undefined ? {} : { enabled: i.enabled }), deployment: i.deployment }),
            }),
        ),
        update: mutation(
          {
            description:
              "Update a Source. 'attributes' holds the fields to change (name, enabled, or deployment fields). Deployment-affecting changes redeploy the Source; if you change deployment.type, send that type's required fields too. Limited to 60 updates per hour.",
            input: object({ sourceId: string({ minLength: 1 }), attributes: json() }),
          },
          async (_ctx, { sourceId, attributes }) =>
            call("PATCH", `/sources/${encodeURIComponent(sourceId)}`, {
              body: attrs("sources", attributes as Record<string, unknown>, sourceId),
            }),
        ),
      },
      { title: "Sources", description: "Origins imgix serves images from (S3, GCS, Azure, web folder, web proxy, S3-compatible). Needs the Sources permission." },
    ),
    assets: router(
      {
        list: query(
          {
            description:
              "List assets in a Source (Asset Manager Browse permission). Filters are given as a map of filter name to value, e.g. { tags: 'cat,dog', media_kind: 'IMAGE', keyword: 'beach', origin_path: 'a/b.jpg' }. sort is date_created, date_modified or file_size (prefix - for descending). Page with cursor (the 'next' value from the previous response) and limit (max 1000).",
            input: object({
              sourceId: string({ minLength: 1 }),
              filters: record(string()).optional(),
              sort: string().optional(),
              cursor: string().optional(),
              limit: string().optional(),
            }),
          },
          async (_ctx, i) =>
            call("GET", `/sources/${encodeURIComponent(i.sourceId)}/assets`, {
              query: {
                ...Object.fromEntries(Object.entries(i.filters ?? {}).map(([k, v]) => [`filter[${k}]`, v])),
                sort: i.sort,
                "page[cursor]": i.cursor,
                "page[limit]": i.limit,
              },
            }),
        ),
        get: query(
          {
            description: "Get one asset by its path at the Source origin (Asset Manager Browse permission).",
            input: object({ sourceId: string({ minLength: 1 }), originPath: string({ minLength: 1 }) }),
          },
          async (_ctx, { sourceId, originPath }) =>
            call("GET", `/sources/${encodeURIComponent(sourceId)}/assets/${segments(originPath)}`),
        ),
        update: mutation(
          {
            description:
              "Edit asset metadata (Asset Manager Edit permission). Updatable attributes: categories (list), custom_fields (object), description, name.",
            input: object({ sourceId: string({ minLength: 1 }), originPath: string({ minLength: 1 }), attributes: json() }),
          },
          async (_ctx, { sourceId, originPath, attributes }) =>
            call("PATCH", `/sources/${encodeURIComponent(sourceId)}/assets/${segments(originPath)}`, {
              body: attrs("assets", attributes as Record<string, unknown>, `${sourceId}/${originPath}`),
            }),
        ),
        add: mutation(
          {
            description:
              "Queue an existing origin file for indexing in the Asset Manager. The path must exist at the origin and be readable by the Source. Answers 202 with no body.",
            input: object({ sourceId: string({ minLength: 1 }), originPath: string({ minLength: 1 }) }),
          },
          async (_ctx, { sourceId, originPath }) =>
            call("POST", `/sources/${encodeURIComponent(sourceId)}/assets/add/${segments(originPath)}`, { body: {} }),
        ),
        refresh: mutation(
          {
            description:
              "Refetch an asset from the origin, reprocess it if its ETag changed and purge caches (Asset Manager Edit and Purge permissions). Limited to 10 per minute.",
            input: object({ sourceId: string({ minLength: 1 }), originPath: string({ minLength: 1 }) }),
          },
          async (_ctx, { sourceId, originPath }) =>
            call("POST", `/sources/${encodeURIComponent(sourceId)}/assets/refresh/${segments(originPath)}`, { body: {} }),
        ),
        publish: mutation(
          {
            description: "Publish a previously unpublished asset again by its imgix URL (Purge permission). Returns a publish_id.",
            input: object({ sourceId: string({ minLength: 1 }), url: string({ minLength: 1 }) }),
          },
          async (_ctx, { sourceId, url }) =>
            call("POST", `/sources/${encodeURIComponent(sourceId)}/publish`, {
              body: attrs("publishes", { url, source_id: sourceId }),
            }),
        ),
        unpublish: mutation(
          {
            description:
              "Unpublish an asset by its imgix URL (Purge permission): the Rendering API then returns 404 for it, but the file stays at the origin. Returns an unpublish_id.",
            input: object({ sourceId: string({ minLength: 1 }), url: string({ minLength: 1 }) }),
          },
          async (_ctx, { sourceId, url }) =>
            call("POST", `/sources/${encodeURIComponent(sourceId)}/unpublish`, {
              body: attrs("unpublishes", { url, source_id: sourceId }),
            }),
        ),
      },
      { title: "Assets", description: "Browse, edit, index, refresh and publish the assets in a Source (Asset Manager)." },
    ),
    uploadSessions: router(
      {
        create: mutation(
          {
            description:
              "Start a large-file upload session (S3, GCS, DigitalOcean, R2, Wasabi, Linode Sources; up to 5GB). Returns the session id and a presigned URL that the caller must PUT the file to. Sessions last 8 hours.",
            input: object({ sourceId: string({ minLength: 1 }), originPath: string({ minLength: 1 }) }),
          },
          async (_ctx, { sourceId, originPath }) =>
            call("POST", `/sources/${encodeURIComponent(sourceId)}/upload-sessions/create/${segments(originPath)}`),
        ),
        close: mutation(
          {
            description: "Close an upload session after the file was PUT to the presigned URL, to speed up processing.",
            input: object({ sourceId: string({ minLength: 1 }), sessionId: string({ minLength: 1 }) }),
          },
          async (_ctx, { sourceId, sessionId }) =>
            call("POST", `/sources/${encodeURIComponent(sourceId)}/upload-sessions/close/${encodeURIComponent(sessionId)}`),
        ),
        status: query(
          {
            description: "Check an upload session's status (PENDING, CLOSED, COMPLETE, CANCELED).",
            input: object({ sourceId: string({ minLength: 1 }), sessionId: string({ minLength: 1 }) }),
          },
          async (_ctx, { sourceId, sessionId }) =>
            call("GET", `/sources/${encodeURIComponent(sourceId)}/upload-sessions/status/${encodeURIComponent(sessionId)}`),
        ),
        cancel: mutation(
          {
            description: "Cancel an upload session.",
            input: object({ sourceId: string({ minLength: 1 }), sessionId: string({ minLength: 1 }) }),
          },
          async (_ctx, { sourceId, sessionId }) =>
            call("DELETE", `/sources/${encodeURIComponent(sourceId)}/upload-sessions/cancel/${encodeURIComponent(sessionId)}`),
        ),
      },
      { title: "Upload sessions", description: "Presigned large-file uploads into S3, GCS and compatible Sources." },
    ),
    purges: router(
      {
        purge: mutation(
          {
            description:
              "Purge an asset from the imgix cache (Purge permission). 'url' is the full imgix URL; every derivative of the base URL is cleared. For a mark/blend sub-image set subImage true and give the parent's sourceId. Space purges of the same URL 10 seconds apart.",
            input: object({ url: string({ minLength: 1 }), subImage: boolean().optional(), sourceId: string().optional() }),
          },
          async (_ctx, i) =>
            call("POST", "/purge", {
              body: attrs("purges", {
                url: i.url,
                ...(i.subImage ? { sub_image: true, source_id: i.sourceId } : {}),
              }),
            }),
        ),
      },
      { title: "Purges", description: "Clear cached copies of assets." },
    ),
    reports: router(
      {
        list: query(
          {
            description:
              "List usage reports (Analytics permission). reportType: cdn_logs, credit_analytics_daily, credit_analytics_mtd, image_analytics, mild_errors, source_analytics. completed is 'true'/'false'. sort: period_start, period_end, report_key, report_type (prefix - for descending). Report files are download URLs. Only image_analytics is on all paid plans.",
            input: object({ reportType: string().optional(), completed: string().optional(), sort: string().optional() }),
          },
          async (_ctx, i) =>
            call("GET", "/reports", {
              query: { "filter[report_type]": i.reportType, "filter[completed]": i.completed, sort: i.sort },
            }),
        ),
        get: query(
          { description: "Get one report by id (Analytics permission).", input: object({ reportId: string({ minLength: 1 }) }) },
          async (_ctx, { reportId }) => call("GET", `/reports/${encodeURIComponent(reportId)}`),
        ),
      },
      { title: "Reports", description: "Credit, bandwidth, CDN log and error reports." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { imgix: imgix.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.imgix ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Imgix",
        description: "Manage imgix Sources, assets, uploads, cache purges and usage reports.",
        icons,
      },
    ),
  }),
);
