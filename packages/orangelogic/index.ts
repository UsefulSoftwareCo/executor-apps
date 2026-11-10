import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

type Fetch = typeof fetch;
type Params = Record<string, unknown>;
type Fields = { host: string; clientId: string; clientSecret: string };

// OrangeDAM is hosted per customer (https://<environment>.orangelogic.com), so the host is part of the account.
// The provider declares `hosts: ["*.orangelogic.com"]`, so credentials reach app code only as handles that
// Executor substitutes on requests to Orange Logic cloud hosts. Every request is built from the validated origin.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Orange Logic host, for example mycompany.orangelogic.com.");
  }
  if (url.protocol !== "https:") throw new Error("Orange Logic must be reached over https.");
  if (!/^[a-z0-9-]+\.orangelogic\.com$/i.test(url.hostname) || url.port !== "") {
    throw new Error("The host must be an Orange Logic cloud address such as mycompany.orangelogic.com; custom domains are not supported.");
  }
  if ((url.pathname !== "/" && url.pathname !== "") || url.search !== "" || url.hash !== "") {
    throw new Error("Enter only the Orange Logic host, with no path.");
  }
  return url.origin;
}

// Client credentials are exchanged at the tenant's authenticate endpoint for a short-lived bearer token.
function authorizedFetch(origin: string, fields: Fields, fetcher: Fetch): Fetch {
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const response = await fetcher(`${origin}/webapi/security/clientcredentialsauthentication/authenticate_46H_v1`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: fields.clientId, client_secret: fields.clientSecret }),
    });
    const t = await decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 3600) - 60, 60) * 1000 };
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    if (new URL(request.url).origin !== origin) return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

// A non-expiring bearer token (Get bearer token API) is sent as is.
function bearerFetch(origin: string, bearer: string, fetcher: Fetch): Fetch {
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    if (new URL(request.url).origin !== origin) return fetcher(request);
    request.headers.set("Authorization", `Bearer ${bearer}`);
    return fetcher(request);
  }) as Fetch;
}

const orangelogic = defineProvider({
  name: "Orange Logic",
  hosts: ["*.orangelogic.com"],
  auth: {
    // OAuth 2.0 client credentials of an Orange Logic account (Administration > Contacts > Accounts > OAuth 2.0
    // Client Credentials). The tenant host is per customer, so no fixed token URL can be declared.
    clientCredentials: secrets({
      label: "OAuth 2.0 client credentials",
      fields: object({
        host: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
    bearerToken: secrets({
      label: "Non-expiring bearer token",
      fields: object({
        host: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.host);
    const f = account.fields as Params;
    const authed =
      typeof f.token === "string"
        ? bearerFetch(origin, f.token, fetch)
        : authorizedFetch(origin, account.fields as Fields, fetch);
    const response = await authed(`${origin}/API/search/v3.0/ListFields`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ format: "json" }),
    });
    await decodeJson(response, json());
    const who = typeof f.clientId === "string" ? f.clientId : "bearer";
    return { accountInfo: { externalId: `${origin}:${who}`, displayName: new URL(origin).host } };
  },
});

const anyJson = record(json());
const opt = () => string().optional();

function qs(input: Params, skip: readonly string[] = []): string {
  const url = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (skip.includes(key) || value === undefined || value === null || value === "") continue;
    url.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  }
  const text = url.toString();
  return text === "" ? "" : `?${text}`;
}

async function call(f: Fetch, origin: string, signal: AbortSignal | undefined, path: string, init: { method?: string; body?: unknown } = {}) {
  const response = await f(`${origin}${path}`, {
    method: init.method ?? "GET",
    signal,
    headers: { Accept: "application/json", ...(init.body === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  });
  return decodeJson(response, json());
}

const objectPath = /^[A-Za-z0-9_.\-]+$/;
function dataTablePath(version: unknown, object: unknown, action: string): string {
  const v = String(version ?? "v2.2");
  if (!/^v[0-9.]+$/i.test(v)) throw new Error("version must look like v2.2 (assets) or v2.1 (contacts, keywords, permissions).");
  const o = String(object);
  if (!objectPath.test(o)) throw new Error("object must look like Documents.Image.Default.");
  return `/API/DataTable/${v}/${o}:${action}`;
}

// DataTable fields are query parameters whose names carry the operator: {"CoreField.Identifier": "ZZ13UH3"} reads
// CoreField.Identifier=ZZ13UH3 and {"CoreField.Title:": "New"} writes CoreField.Title:=New.
function fieldQuery(fields: unknown, extra: Params = {}): string {
  const url: string[] = [];
  for (const [key, value] of Object.entries((fields ?? {}) as Params)) {
    url.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== null && value !== "") url.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  url.push("format=json");
  return `?${url.join("&")}`;
}

export default defineApp(
  { user: { accounts: { orangelogic: orangelogic.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.orangelogic ?? [],
        (account) => {
          const origin = originOf(account.fields.host);
          const f = account.fields as Params;
          const authed =
            typeof f.token === "string"
              ? bearerFetch(origin, f.token, fetch)
              : authorizedFetch(origin, account.fields as Fields, fetch);
          const run = (path: string, init?: { method?: string; body?: unknown }) => call(authed, origin, signal, path, init);

          const dt = (verb: "Read" | "Update" | "Create" | "CreateOrUpdate" | "Delete") => async (_ctx: unknown, input: Params) =>
            run(`${dataTablePath(input.version, input.object, verb)}${fieldQuery(input.fields, { Verbose: input.verbose, Page: input.page, ItemsPerPage: input.itemsPerPage })}`, {
              method: "POST",
            });
          const dtInput = () =>
            object({
              object: string(),
              fields: record(string()),
              version: opt(),
              verbose: opt(),
              page: opt(),
              itemsPerPage: opt(),
            });
          const dtDoc =
            "object is Object.Type.Subtype, such as Documents.Image.Default (use listDatabaseObjects to find subtypes). fields maps a field API name plus operator to its value: " +
            "to filter or identify, {\"CoreField.Identifier\": \"ZZ13UH3\"} sends CoreField.Identifier=ZZ13UH3; to set a value, end the name with a colon, {\"CoreField.Title:\": \"Tower Bridge\"} sends CoreField.Title:=Tower Bridge. " +
            "version is v2.2 (assets, the default) or v2.1 (contacts, keywords, permissions).";

          return withApprovals(
            router({
              search: query(
                {
                  description:
                    "Search assets (Search API v4.0). query uses criterion:term syntax joined by AND, OR, NOT, e.g. keyword:(Flower OR Flowers) AND (DocType:Image OR Video). semanticquery performs AI search. fields is a comma-separated list of fields to return (e.g. Title,Identifier,SystemIdentifier,DocType). Results come in pages of countperpage (default 10).",
                  input: object({
                    query: opt(),
                    semanticquery: opt(),
                    sort: opt(),
                    fields: opt(),
                    countperpage: number().optional(),
                    pagenumber: number().optional(),
                    format: opt(),
                  }),
                },
                async (_ctx, input: Params) => run("/API/search/v4.0/search", { method: "POST", body: { format: "json", ...input } }),
              ),
              listFields: query(
                { description: "List all metadata fields that can be searched or returned in your environment.", input: object({}) },
                async () => run("/API/search/v3.0/ListFields", { method: "POST", body: { format: "json" } }),
              ),
              listCriteria: query(
                { description: "List the search criteria available for the search query parameter in your environment.", input: object({}) },
                async () => run("/API/search/v3.0/ListCriteria", { method: "POST", body: { format: "json" } }),
              ),
              listDatabaseObjects: query(
                { description: "List all database objects, including contact types and asset subtypes, with the Object.Type.Subtype syntax DataTable calls use.", input: object({ version: opt() }) },
                async (_ctx, input: Params) => run(`/API/DataTable/${String(input.version ?? "v2.2")}/${fieldQuery({})}`, { method: "POST" }),
              ),
              links: router(
                {
                  get: query(
                    {
                      description:
                        "Get a public embed or download link to one asset. Identify it with RecordID or Identifier (the unique ID). Format is the proxy format (e.g. TR1 for a large image); set CreateDownloadLink to true for a download link.",
                      input: object({
                        RecordID: opt(),
                        Identifier: opt(),
                        Format: opt(),
                        CreateDownloadLink: opt(),
                        StickToCurrentVersion: opt(),
                        LogViews: opt(),
                        ExpirationDate: opt(),
                        MaxWidth: opt(),
                        MaxHeight: opt(),
                        FileExtension: opt(),
                        ImageResizingMethod: opt(),
                        Transformations: opt(),
                        Title: opt(),
                        TrackingParameters: opt(),
                        CustomAccessKey: opt(),
                        IsVideo: opt(),
                      }),
                    },
                    async (_ctx, input: Params) => run(`/webapi/objectmanagement/share/getlink_4HZ_v1${qs(input)}`),
                  ),
                  getMany: query(
                    {
                      description: "Get public embed or download links to several assets in one call. Pass the same options as links.get, with RecordID or Identifier as arrays or comma-separated values as the API accepts.",
                      input: object({ body: anyJson }),
                    },
                    async (_ctx, input: Params) => run("/webapi/objectmanagement/share/getlinks_45W_v1", { method: "POST", body: input.body }),
                  ),
                  presigned: query(
                    {
                      description: "Get a time-limited cloud storage (presigned) link to an asset's file in the given format.",
                      input: object({ RecordID: string(), Format: opt(), GenerateIfNeeded: opt(), SkipCheckExistence: opt(), ValidityDuration: opt() }),
                    },
                    async (_ctx, input: Params) => run(`/webapi/mediafile/storage/signedurl/getpresignedlink_4ar_v1${qs(input)}`),
                  ),
                },
                { title: "Links", description: "Public embed, download and presigned links to assets." },
              ),
              shares: router(
                {
                  create: mutation(
                    {
                      description: "Generate a public Share link to one or more assets (assetIDs are record IDs). expirationDate is yyyy-mm-ddThh:mm:ss.",
                      input: object({
                        assetIDs: array(string()),
                        expirationDate: string(),
                        title: opt(),
                        description: opt(),
                        imageFormat: opt(),
                        audioFormat: opt(),
                        videoFormat: opt(),
                        containerFormat: opt(),
                        watermarkPreset: opt(),
                      }),
                    },
                    async (_ctx, input: Params) => run("/webapi/objectmanagement/share/createsharelink_41M9_V1", { method: "POST", body: input }),
                  ),
                  status: query(
                    { description: "Retrieve a previously generated Share link, or check its generation status, by its access key.", input: object({ AccessKey: string() }) },
                    async (_ctx, input: Params) => run(`/webapi/objectmanagement/share/getsharelinkstatus_41MA_V1${qs(input)}`),
                  ),
                },
                { title: "Share links", description: "Expirable public Share links to assets." },
              ),
              reports: router(
                {
                  info: query(
                    { description: "Get the columns and filters of a report configured in Orange Logic.", input: object({ ID: string(), ListAllColumns: opt() }) },
                    async (_ctx, input: Params) => run(`/webapi/report/export/getreportinfo_4102_v1${qs(input)}`),
                  ),
                  run: query(
                    {
                      description: "Run a report configured in Orange Logic. OutputFormat is the export format (e.g. JSON or CSV). Filters and Columns are optional report overrides in the form the report info returns.",
                      input: object({
                        ID: string(),
                        OutputFormat: string(),
                        SavedSearchID: opt(),
                        Filters: opt(),
                        Columns: opt(),
                        ReportTitle: opt(),
                        ReportDescription: opt(),
                        Encoding: opt(),
                        UseServerTimezone: opt(),
                      }),
                    },
                    async (_ctx, input: Params) => run(`/webapi/report/export/getreport_4103_v1${qs(input)}`),
                  ),
                },
                { title: "Reports", description: "Run and inspect Orange Logic reports." },
              ),
              datatable: router(
                {
                  read: query(
                    { description: `Read one object's fields (DataTable Read). ${dtDoc} Assets return one result per call; use search for many.`, input: dtInput() },
                    dt("Read"),
                  ),
                  update: mutation({ description: `Update matching objects (DataTable Update). ${dtDoc}`, input: dtInput() }, dt("Update")),
                  create: mutation({ description: `Create an object (DataTable Create). ${dtDoc}`, input: dtInput() }, dt("Create")),
                  createOrUpdate: mutation({ description: `Create or update an object (DataTable CreateOrUpdate). ${dtDoc}`, input: dtInput() }, dt("CreateOrUpdate")),
                  delete: mutation({ description: `Delete matching objects (DataTable Delete). ${dtDoc}`, input: dtInput() }, dt("Delete")),
                },
                { title: "DataTable", description: "Create, read, update and delete assets, contacts, keywords and other database objects." },
              ),
              batchEditFields: mutation(
                {
                  description:
                    "Edit metadata fields on many assets at once (Batch edit). documents is the list of assets and fieldAssignments the field changes, in the shape the Batch edit API documents.",
                  input: object({
                    documents: json(),
                    fieldAssignments: json(),
                    ignoreNotEditableDocuments: json().optional(),
                    ignoreInvalidDocuments: json().optional(),
                  }),
                },
                async (_ctx, input: Params) => run("/webapi/objectmanagement/multiobjectstools/batchedit/batcheditfields_4FQ_v1", { method: "POST", body: input }),
              ),
              batchUpsert: mutation(
                {
                  description:
                    "Create or update many assets or contacts in one call (Batch upsert a JSON array). dataOptions needs table (Documents or Contacts) and fieldToMatch; records is the array of records. executionOptions is optional.",
                  input: object({ dataOptions: anyJson, records: json(), executionOptions: anyJson.optional() }),
                },
                async (_ctx, input: Params) => run("/webapi/objectmanagement/multiobjectstools/datatable/batchupsert_4FY_v1", { method: "POST", body: input }),
              ),
              uploadFromUrl: mutation(
                {
                  description:
                    "Upload a file to a folder from a URL. folderRecordID is the destination folder's record ID. importMode is processInLine, ProcessProxiesInBackground, ProcessFullyInBackground or ProcessFullyInBackgroundLite. metadata maps field API names (e.g. CoreField.Title) to string values.",
                  input: object({ folderRecordID: string(), fileURL: string(), fileName: opt(), importMode: opt(), metadata: record(string()).optional() }),
                },
                async (_ctx, input: Params) => run("/webapi/mediafile/import/upload/uploadmediawithurl_45L_v1", { method: "POST", body: input }),
              ),
              regenerateProxies: mutation(
                {
                  description: "Generate or regenerate proxy formats (previews) of an asset by its identifier.",
                  input: object({ AssetIdentifier: string(), FileFormat: opt(), DocType: opt(), Priority: opt(), GenerateOnlyIf: opt(), ForceUpdateRepresentative: opt() }),
                },
                async (_ctx, input: Params) => run(`/api/Media_DbBO/v1.0/RegenerateProxiesForAsset${qs({ format: "json", ...input })}`),
              ),
              createWebhookSubscription: mutation(
                {
                  description:
                    "Create a webhook subscription that sends asset create, edit and delete events to an HTTPS endpoint. subscription holds id, name, description, isActive, definition { targetURL, customHeaders } and optional predicates.",
                  input: object({ subscription: anyJson }),
                },
                async (_ctx, input: Params) => run("/webapi/extensibility/webhook/subscription/create_22E_v1", { method: "POST", body: input }),
              ),
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Orange Logic",
        description:
          "OrangeDAM digital asset management: search assets, read and edit metadata, public and presigned links, share links, uploads, batch edits, reports and webhooks.",
        instructions:
          "Each account is one OrangeDAM environment (host such as mycompany.orangelogic.com). Use search for finding assets and datatable.* for reading or changing a known object; call listFields and listCriteria to learn the field API names and search criteria the environment supports. Assets are identified by RecordID (the encrypted record ID) or Identifier (the unique ID).",
        icons,
      },
    ),
  }),
);
