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
  plain,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// GravityZone is hosted per region (US cloud, EU cloud, partner consoles). The access URL shown on the
// Control Center API page is part of the account, and requests are only built for Bitdefender's cloud hosts.
const hostPattern = /^(cloud|cloudgz|[a-z0-9-]+)\.gravityzone\.bitdefender\.com$/i;

function accessBase(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter the GravityZone access URL, for example https://cloud.gravityzone.bitdefender.com/api.");
  }
  if (url.protocol !== "https:") throw new Error("The GravityZone access URL must use https.");
  if (!hostPattern.test(url.hostname) || url.port !== "") {
    throw new Error("The access URL must be a GravityZone cloud address such as https://cloud.gravityzone.bitdefender.com/api; on-premises appliances are not supported.");
  }
  if (url.search !== "" || url.hash !== "") throw new Error("The access URL must not include a query or fragment.");
  const path = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${path === "" ? "/api" : path}`;
}

type Account = { fields: { apiKey: string; accessUrl: string } };

// The API key is the HTTP Basic username and the password is empty.
const authorization = (account: Account) => `Basic ${btoa(`${account.fields.apiKey}:`)}`;

const bitdefender = defineProvider({
  name: "Bitdefender GravityZone",
  hosts: ["cloud.gravityzone.bitdefender.com", "cloudgz.gravityzone.bitdefender.com", "*.gravityzone.bitdefender.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        apiKey: string({ minLength: 1 }),
        accessUrl: plain(string({ minLength: 1 })),
      }),
    }),
  },
  // getApiKeyDetails is read-only and available to every GravityZone API key.
  async health({ account, fetch, signal }) {
    const base = accessBase(account.fields.accessUrl);
    const response = await fetch(`${base}/v1.0/jsonrpc/general`, {
      method: "POST",
      signal,
      headers: { Authorization: authorization(account), "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: crypto.randomUUID(), method: "getApiKeyDetails", params: {} }),
    });
    await decodeJson(response, object({ result: object({ createdAt: string() }) }));
    return { accountInfo: { externalId: base, displayName: `GravityZone (${new URL(base).hostname})` } };
  },
});

type Params = Record<string, unknown>;

async function call(
  account: Account,
  fetcher: typeof fetch,
  signal: AbortSignal | undefined,
  api: string,
  method: string,
  params: Params,
  version = "v1.0",
): Promise<unknown> {
  if (!/^[a-z]+(\/[a-z]+)?$/.test(api)) throw new Error("api must be a service path such as network or quarantine/computers.");
  if (!/^v[0-9]+\.[0-9]+$/.test(version)) throw new Error("version must look like v1.0.");
  if (!/^[A-Za-z]+$/.test(method)) throw new Error("method must be a GravityZone method name such as getEndpointsList.");
  const clean = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
  const response = await fetcher(`${accessBase(account.fields.accessUrl)}/${version}/jsonrpc/${api}`, {
    method: "POST",
    signal,
    headers: { Authorization: authorization(account), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: crypto.randomUUID(), method, params: clean }),
  });
  const body = (await decodeJson(response, json())) as { result?: unknown; error?: { code?: number; message?: string; data?: unknown } };
  if (body !== null && typeof body === "object" && body.error !== undefined) {
    const detail = body.error.data === undefined ? "" : ` ${JSON.stringify(body.error.data)}`;
    throw new Error(`GravityZone ${method} failed (${body.error.code ?? "error"}): ${body.error.message ?? "unknown error"}${detail}`);
  }
  return body?.result ?? null;
}

const free = record(json());
const ids = array(string());
const page = { page: number().optional(), perPage: number().optional() };

const bitdefenderTools = (account: Account, signal: AbortSignal | undefined) => {
  type Ctx = { fetch: typeof fetch };
  const read =
    (api: string, method: string, version?: string) =>
    ({ fetch }: Ctx, input: Params) =>
      call(account, fetch, signal, api, method, input, version);

  return router({
    general: router({
      getApiKeyDetails: query(
        { description: "Return the APIs enabled for the API key in use (for example network, policies, packages, reports) and when the key was created.", input: object({}) },
        read("general", "getApiKeyDetails"),
      ),
    }),
    network: router({
      getEndpointsList: query(
        {
          description:
            "List endpoints under a company or group (API v1.1). parentId defaults to the key's company. isManaged limits to managed endpoints. page starts at 1; perPage is 1-1000 (default 30). filters sections: security (managedWithBest, managedExchangeServers, managedRelays, securityServers booleans), depth (allItemsRecursively), details (name with at least 3 characters, ssid, macs[]). options controls extra response data.",
          input: object({ parentId: string().optional(), isManaged: boolean().optional(), ...page, filters: free.optional(), options: free.optional() }),
        },
        read("network", "getEndpointsList", "v1.1"),
      ),
      getManagedEndpointDetails: query(
        {
          description:
            "Get full details of one managed endpoint: OS, IP, power state, agent and engine versions, modules, policy, isolation state. options: includeScanLogs and includeLastLoggedUsers booleans.",
          input: object({ endpointId: string(), options: free.optional() }),
        },
        read("network", "getManagedEndpointDetails"),
      ),
      getNetworkInventoryItems: query(
        {
          description:
            "List network inventory items (companies, folders, groups, computers, virtual machines, EC2 instances) under parentId (API v1.1). filters.type and filters.security select item kinds; options can add risk scores, scan logs and outdated-product status.",
          input: object({ parentId: string().optional(), ...page, filters: free.optional(), options: free.optional() }),
        },
        read("network", "getNetworkInventoryItems", "v1.1"),
      ),
      getRootContainers: query(
        { description: "Return the root containers (Companies, Network, Computers and Groups, Deleted) for a company; defaults to the key's company.", input: object({ companyId: string().optional() }) },
        read("network", "getRootContainers"),
      ),
      getCompaniesList: query(
        {
          description:
            "List companies under a parent company or company folder. filters.companyType: 0 partner, 1 customer. filters.licenseType: 1 trial, 2 yearly, 3 monthly. Returns id and name.",
          input: object({ parentId: string().optional(), filters: free.optional() }),
        },
        read("network", "getCompaniesList"),
      ),
      getCustomGroupsList: query(
        { description: "List the groups under parentId. A null parentId or a company id returns Computers and Groups and Deleted.", input: object({ parentId: string().optional() }) },
        read("network", "getCustomGroupsList"),
      ),
      getEndpointTags: query(
        {
          description: "List endpoint tags for companies. companyIds are 24-character ids; orderBy is name, type or created; order is ASC or DESC.",
          input: object({ companyIds: ids.optional(), orderBy: string().optional(), order: string().optional(), ...page }),
        },
        read("network", "getEndpointTags"),
      ),
      getScanTasksList: query(
        {
          description: "List scan tasks. name filters by task name (prefix * to match anywhere). status: 1 pending, 2 in progress, 3 finished. perPage up to 100.",
          input: object({ name: string().optional(), status: number().optional(), ...page }),
        },
        read("network", "getScanTasksList"),
      ),
      getTaskStatus: query(
        {
          description:
            "Get the status of a task by id (API v1.1). Set returnSubtasks true to include per-endpoint subtasks, then page, perPage, subtaskFilters (status, endedAfter, endedBefore) apply.",
          input: object({ taskId: string(), returnSubtasks: boolean().optional(), ...page, subtaskFilters: free.optional(), options: free.optional() }),
        },
        read("network", "getTaskStatus", "v1.1"),
      ),
      createScanTask: mutation(
        {
          description:
            "Start a scan on endpoints or containers. type: 1 quick, 2 full, 3 memory, 4 custom. For custom scans pass customScanSettings {scanDepth: 1 aggressive|2 normal|3 permissive, scanPath: [paths]}. Set returnAllTaskIds true to get every created task id.",
          input: object({ targetIds: ids, type: number(), name: string().optional(), customScanSettings: free.optional(), returnAllTaskIds: boolean().optional() }),
          approval: always(),
        },
        read("network", "createScanTask"),
      ),
      createReconfigureClientTask: mutation(
        {
          description: "Create a Reconfigure agent task on endpoints (API v1.1) to change installed modules or roles. Pass targetIds and the modules/scanMode/roles settings documented for the method.",
          input: object({ targetIds: ids, scanMode: free.optional(), modules: free.optional(), roles: free.optional(), scheduler: free.optional(), name: string().optional() }),
          approval: always(),
        },
        read("network", "createReconfigureClientTask", "v1.1"),
      ),
      assignPolicy: mutation(
        {
          description:
            "Assign a policy to endpoints. Pass policyId, or inheritFromAbove true (default) to inherit from the parent container. forcePolicyInheritance applies the inheritance to children. Targets with an enforced policy are skipped.",
          input: object({ targetIds: ids, policyId: string().optional(), inheritFromAbove: boolean().optional(), forcePolicyInheritance: boolean().optional() }),
          approval: always(),
        },
        read("network", "assignPolicy"),
      ),
      setEndpointLabel: mutation(
        { description: "Set an endpoint label of up to 64 characters; an empty string clears it.", input: object({ endpointId: string(), label: string() }), approval: always() },
        read("network", "setEndpointLabel"),
      ),
      createCustomGroup: mutation(
        { description: "Create a custom group under parentId (defaults to the key's company Computers and Groups). Returns the new group id.", input: object({ groupName: string(), parentId: string().optional() }), approval: always() },
        read("network", "createCustomGroup"),
      ),
      deleteCustomGroup: mutation(
        { description: "Delete a custom group. Set force true to delete a group that still contains items.", input: object({ groupId: string(), force: boolean().optional() }), approval: always() },
        read("network", "deleteCustomGroup"),
      ),
      moveEndpoints: mutation(
        { description: "Move endpoints into a custom group.", input: object({ endpointIds: ids, groupId: string() }), approval: always() },
        read("network", "moveEndpoints"),
      ),
      deleteEndpoint: mutation(
        {
          description: "Delete an endpoint. Under custom groups it moves to Deleted and managed endpoints get an uninstall task; calling again with the same id removes it permanently.",
          input: object({ endpointId: string() }),
          approval: always(),
        },
        read("network", "deleteEndpoint"),
      ),
    }),
    packages: router({
      getPackagesList: query(
        { description: "List installation packages for a company (defaults to the key's company).", input: object({ companyId: string().optional(), ...page }) },
        read("packages", "getPackagesList"),
      ),
      getPackageDetails: query(
        { description: "Get a package's configuration: name, language, modules, scan mode and roles.", input: object({ packageId: string() }) },
        read("packages", "getPackageDetails"),
      ),
      getInstallationLinks: query(
        {
          description: "Get install links and full-kit download links. Optionally narrow by companyId, packageName and ringId (0 slow, 3 production, 4 test 1, 5 test 2).",
          input: object({ companyId: string().optional(), packageName: string().optional(), ringId: number().optional() }),
        },
        read("packages", "getInstallationLinks"),
      ),
    }),
    policies: router({
      getPoliciesList: query(
        { description: "List security policies for a company (defaults to the key's company).", input: object({ companyId: string().optional(), ...page }) },
        read("policies", "getPoliciesList"),
      ),
      getPolicyDetails: query(
        { description: "Get all settings of a policy by id (API v1.1).", input: object({ policyId: string() }) },
        read("policies", "getPolicyDetails", "v1.1"),
      ),
    }),
    quarantine: router({
      getQuarantineItemsList: query(
        {
          description:
            "List quarantined items. service is computers (computers and virtual machines) or exchange (Security for Exchange). filters: threatName, startDate, endDate (ISO 8601), filePath and more. perPage up to 100.",
          input: object({ service: string(), companyId: string().optional(), endpointId: string().optional(), ...page, filters: free.optional() }),
        },
        ({ fetch }, { service, ...params }) => call(account, fetch, signal, `quarantine/${service}`, "getQuarantineItemsList", params),
      ),
      createRemoveQuarantineItemTask: mutation(
        {
          description: "Permanently remove up to 100 quarantined items. service is computers or exchange. Returns the parent task ids.",
          input: object({ service: string(), quarantineItemsIds: ids }),
          approval: always(),
        },
        ({ fetch }, { service, ...params }) => call(account, fetch, signal, `quarantine/${service}`, "createRemoveQuarantineItemTask", params, "v1.1"),
      ),
      createRestoreQuarantineItemTask: mutation(
        {
          description:
            "Restore up to 100 quarantined computer items (API v1.1, computers service). locationToRestore is an absolute folder path (default original location); addExclusionInPolicy excludes the restored files from future scans.",
          input: object({ quarantineItemsIds: ids, locationToRestore: string().optional(), addExclusionInPolicy: boolean().optional() }),
          approval: always(),
        },
        ({ fetch }, params) => call(account, fetch, signal, "quarantine/computers", "createRestoreQuarantineItemTask", params, "v1.1"),
      ),
    }),
    reports: router({
      getReportsList: query(
        { description: "List scheduled reports created by the API key's user. Filter by name or report type number; perPage up to 100.", input: object({ name: string().optional(), type: number().optional(), ...page }) },
        read("reports", "getReportsList"),
      ),
      getDownloadLinks: query(
        {
          description: "Get download links for a report: readyForDownload, lastInstanceUrl and allInstancesUrl. Download with the same API key as HTTP Basic username and an empty password.",
          input: object({ reportId: string() }),
        },
        read("reports", "getDownloadLinks"),
      ),
      createReport: mutation(
        {
          description:
            "Create an instant report (omit scheduledInfo) or a scheduled one. type is the report type number (for example 8 Endpoint Protection Status, 12 Malware Status, 19 Top 10 Detected Malware, 22 Update Status). scheduledInfo {occurrence 2 hourly, 3 daily, 4 weekly, 5 monthly, 6 yearly, plus interval, startHour, startMinute, days, day, month}, options per report type, emailList only for scheduled reports. Returns the report id.",
          input: object({ name: string(), type: number(), targetIds: ids.optional(), scheduledInfo: free.optional(), options: free.optional(), emailList: ids.optional() }),
          approval: always(),
        },
        read("reports", "createReport"),
      ),
    }),
    companies: router({
      getCompanyDetails: query(
        { description: "Get a managed company's details: type, name, address, 2FA settings, suspension state, country, industry. Defaults to the key's company.", input: object({ companyId: string().optional() }) },
        read("companies", "getCompanyDetails"),
      ),
      findCompaniesByName: query(
        { description: "Find companies by name. Prefix nameFilter with * to match anywhere in the name. maxResults is 1-100 (default 25); exactMatch returns a single case-insensitive exact match.", input: object({ nameFilter: string(), maxResults: number().optional(), exactMatch: boolean().optional() }) },
        read("companies", "findCompaniesByName"),
      ),
    }),
    accounts: router({
      getAccountsList: query(
        { description: "List the user accounts of a company (defaults to the key's company); perPage up to 100.", input: object({ companyId: string().optional(), ...page }) },
        read("accounts", "getAccountsList"),
      ),
    }),
    licensing: router({
      getLicenseInfo: query(
        { description: "Get license information for a company. Set returnAllProducts true to include every product.", input: object({ companyId: string().optional(), returnAllProducts: boolean().optional() }) },
        read("licensing", "getLicenseInfo"),
      ),
      getMonthlyUsage: query(
        { description: "Monthly license usage for a company in targetMonth (mm/yyyy). productType: 0 Endpoint Security, 3 EDR, 5 PHASR.", input: object({ companyId: string().optional(), targetMonth: string(), productType: number().optional() }) },
        read("licensing", "getMonthlyUsage"),
      ),
    }),
    incidents: router({
      getIncidentsList: query(
        {
          description:
            "List endpoint and organization incidents (API v1.2, needs an EDR/XDR license). filters: companyId, endpointId, status[] (open, closed, in_progress, false_positive), incidentType[], mainAction[], priority[], assignedUserId, startDate, endDate. options: includeChildCompanies, sortBy. perPage is 10-10000.",
          input: object({ ...page, filters: free.optional(), options: free.optional() }),
        },
        read("incidents", "getIncidentsList", "v1.2"),
      ),
    }),
    patchManagement: router({
      getMissingPatches: query(
        {
          description:
            "List missing patches for endpoints or a company. Pass endpointsIds or companyId (mutually exclusive). filters.type: 0 security, 1 non-security, 2 manually approved; filters.severity: 0 none to 4 critical, 5 unassigned. perPage up to 100.",
          input: object({ endpointsIds: ids.optional(), companyId: string().optional(), ...page, filters: free.optional() }),
        },
        read("patchManagement", "getMissingPatches"),
      ),
      getInstalledPatches: query(
        {
          description:
            "List installed patches for endpoints or a company. Pass endpointsIds or companyId (mutually exclusive). filters.type and filters.severity as for getMissingPatches. perPage up to 100.",
          input: object({ endpointsIds: ids.optional(), companyId: string().optional(), ...page, filters: free.optional() }),
        },
        read("patchManagement", "getInstalledPatches"),
      ),
    }),
    push: router({
      getPushEventSettings: query(
        { description: "Get the push event (webhook) settings of the API key.", input: object({}) },
        read("push", "getPushEventSettings"),
      ),
      setPushEventSettings: mutation(
        {
          description: "Set push event delivery: status 0 disabled or 1 enabled, serviceType (jsonRPC, splunk, cef, qradar, azureSentinel, azureSentinelV2), serviceSettings (for jsonRPC: url, requireValidSslCertificate, authorization), subscribeToEventTypes (list of event type names) and subscribeToCompanies (company ids, including your own).",
          input: object({ status: number(), serviceType: string(), serviceSettings: free, subscribeToEventTypes: ids, subscribeToCompanies: ids.optional() }),
          approval: always(),
        },
        read("push", "setPushEventSettings"),
      ),
    }),
    request: mutation(
      {
        description:
          "Call any GravityZone Public API method directly (JSON-RPC 2.0), for methods not covered by the typed tools such as killProcess, createIsolateEndpointTask, changeIncidentStatus or addToBlocklist. api is the service path (network, incidents, quarantine/computers...), method the method name, version v1.0 unless the method documents otherwise, params the request params. Treated as a mutation because it can run any method.",
        input: object({ api: string(), method: string(), version: string().optional(), params: free.optional() }),
        approval: always(),
      },
      ({ fetch }, { api, method, version, params }) => call(account, fetch, signal, api, method, params ?? {}, version),
    ),
  });
};

export default defineApp({ user: { accounts: { bitdefender: bitdefender.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.bitdefender ?? [], (account) => bitdefenderTools(account, signal), { signal }), {
    title: "Bitdefender",
    description: "Manage Bitdefender GravityZone endpoints, policies, packages, quarantine, reports, licensing and incidents.",
    icons,
  }),
}));
