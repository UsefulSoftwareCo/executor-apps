import {
  accountRouter,
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

// ModMed's EMA proprietary API lives under a per-environment base and a per-practice (firm) prefix:
//   <base>/<firm_url_prefix>/ema/fhir/v2/<Resource>
const BASES = {
  dev: "https://stage.ema-api.com/ema-dev/firm",
  training: "https://stage.ema-api.com/ema-training/firm",
  prod: "https://mmapi.ema-api.com/ema-prod/firm",
} as const;
const SSO = {
  dev: "https://ssoqa01-lb-01.m2qa.com",
  training: "https://ssoqa01-lb-01.m2qa.com",
  prod: "https://sso.ema.md",
} as const;

type Environment = keyof typeof BASES;
type Account = { fields: { environment: string; firmUrlPrefix: string; apiKey: string; clientId: string; clientSecret: string } };

function environmentOf(account: Account): Environment {
  const value = account.fields.environment.trim().toLowerCase();
  if (value === "dev" || value === "training" || value === "prod") return value;
  throw new Error('Environment must be "dev" (generic sandbox), "training" (practice sandbox) or "prod".');
}

function firmOf(account: Account): string {
  const firm = account.fields.firmUrlPrefix.trim();
  if (!/^[A-Za-z0-9_-]+$/.test(firm)) throw new Error("Enter the practice's firm URL prefix (letters, digits, - and _), for example dermassoc.");
  return firm;
}

const fhirBase = (account: Account) => `${BASES[environmentOf(account)]}/${firmOf(account)}/ema/fhir/v2`;

// Backend sign-in: the client credentials grant. The vendor's x-api-key is required on the token request too.
async function mintToken(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined): Promise<string> {
  const response = await fetcher(`${SSO[environmentOf(account)]}/auth/realms/ema-fhir/protocol/openid-connect/token`, {
    method: "POST",
    signal,
    headers: {
      "x-api-key": account.fields.apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: account.fields.clientId,
      client_secret: account.fields.clientSecret,
    }).toString(),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`ModMed token request answered ${response.status}: ${text.slice(0, 500)}`);
  const parsed = JSON.parse(text) as { access_token?: string };
  if (typeof parsed.access_token !== "string") throw new Error("ModMed token response had no access_token.");
  return parsed.access_token;
}

const modmed = defineProvider({
  name: "ModMed",
  hosts: ["stage.ema-api.com", "mmapi.ema-api.com", "sso.ema.md", "ssoqa01-lb-01.m2qa.com"],
  auth: {
    vendorApp: secrets({
      label: "EMA vendor application",
      fields: object({
        environment: plain(string({ minLength: 1 })),
        firmUrlPrefix: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
        clientId: string({ minLength: 1 }),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const token = await mintToken(account, fetch, signal);
    const response = await fetch(`${fhirBase(account)}/metadata`, {
      signal,
      headers: { Authorization: `Bearer ${token}`, "x-api-key": account.fields.apiKey, Accept: "application/fhir+json" },
    });
    await decodeJson(response, object({ resourceType: string() }));
    const firm = firmOf(account);
    return { accountInfo: { externalId: `${environmentOf(account)}:${firm}`, displayName: firm } };
  },
});

type Row = [resource: string, action: string, method: "GET" | "POST" | "PUT", path: string, description: string];

const searchNote =
  "Pass search parameters in params (for example patient, date, status, _lastUpdated=gt2025-05-01). _count is capped at 50 per page; use page to move through results. Returns a FHIR searchset Bundle.";
const bodyNote = "body is the FHIR R4 resource JSON, as ModMed documents it at https://portal.api.modmed.com/reference.";

// [resource, action, method, path, description]; the path is relative to .../ema/fhir/v2.
const rows: Row[] = [];
function resource(
  name: string,
  label: string,
  ops: { get?: boolean; search?: boolean; create?: boolean; update?: boolean },
  extra = "",
) {
  if (ops.search) rows.push([name, "search", "GET", `/${name}`, `Search ${label}. ${extra} ${searchNote}`.replace("  ", " ")]);
  if (ops.get) rows.push([name, "get", "GET", `/${name}/{id}`, `Read one ${label.replace(/s$/, "")} by id.`]);
  if (ops.create) rows.push([name, "create", "POST", `/${name}`, `Create a ${label.replace(/s$/, "")}. ${bodyNote}`]);
  if (ops.update) rows.push([name, "update", "PUT", `/${name}/{id}`, `Update a ${label.replace(/s$/, "")} by id. ${bodyNote}`]);
}

resource("Patient", "patients", { get: true, search: true, create: true, update: true }, "Filters include family (exact), given, birthdate, gender, phone, email, identifier, active, address-postalcode, language, referral-source.");
resource("Practitioner", "practitioners", { get: true, search: true, create: true });
resource("Organization", "organizations", { get: true, search: true, create: true });
resource("Location", "locations", { get: true, search: true });
resource("Encounter", "encounters", { get: true, search: true });
resource("Appointment", "appointments", { get: true, search: true, create: true, update: true }, "Filters include patient, practitioner, location, date, status, appointment-type, created.");
resource("Coverage", "coverages", { get: true, search: true, create: true, update: true });
resource("InsurancePlan", "insurance plans", { get: true, search: true });
resource("DocumentReference", "document references", { get: true, search: true, create: true });
resource("MedicationStatement", "medication statements", { get: true, search: true, create: true, update: true });
resource("AllergyIntolerance", "allergy intolerances", { get: true, search: true, create: true, update: true });
resource("Condition", "conditions", { get: true, search: true, create: true, update: true });
resource("FamilyMemberHistory", "family member histories", { get: true, search: true });
resource("Procedure", "procedures", { get: true, search: true, create: true });
resource("ChargeItem", "charge items", { get: true, search: true, create: true });
resource("ServiceRequest", "service requests", { get: true, search: true });
resource("DiagnosticReport", "diagnostic reports", { get: true, search: true });
resource("Task", "tasks", { get: true, search: true, create: true, update: true });
resource("Account", "accounts", { search: true });
resource("RelatedPerson", "related persons", { get: true });
resource("Slot", "appointment slots", { search: true }, "Use to find open times before booking an Appointment.");
rows.push(["Composition", "create", "POST", "/Composition", `Create a Composition. ${bodyNote}`]);
rows.push(["ValueSet", "taskName", "GET", "/ValueSet/task-name", "Read the ValueSet of valid task names."]);
rows.push(["ValueSet", "referralSource", "GET", "/ValueSet/referral-source", "Read the ValueSet of referral sources (ids used by the Patient referral-source filter)."]);
rows.push(["metadata", "capabilityStatement", "GET", "/metadata", "Read the server's FHIR CapabilityStatement."]);

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  let token: Promise<string> | undefined;
  const bearer = () => (token ??= mintToken(account, fetcher, signal));

  const call = async (method: string, path: string, input: Record<string, unknown>) => {
    const target = path.replace("{id}", encodeURIComponent(String(input.id ?? "")));
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries((input.params as Record<string, string> | undefined) ?? {})) params.set(key, String(value));
    if (typeof input.count === "number") params.set("_count", String(input.count));
    if (typeof input.page === "number") params.set("page", String(input.page));
    const hasBody = input.body !== undefined;
    const response = await fetcher(`${fhirBase(account)}${target}${params.size > 0 ? `?${params.toString()}` : ""}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${await bearer()}`,
        "x-api-key": account.fields.apiKey,
        Accept: "application/fhir+json",
        ...(hasBody ? { "Content-Type": "application/fhir+json" } : {}),
      },
      body: hasBody ? JSON.stringify(input.body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`ModMed answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true, location: response.headers.get("location") } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [name, action, method, path, description] of rows) {
    const isSearch = action === "search";
    const shape: Record<string, never> = {} as never;
    const fields: Record<string, unknown> = shape;
    if (path.includes("{id}")) fields.id = string();
    if (isSearch) {
      fields.params = record(string()).optional();
      fields.count = number().optional();
      fields.page = number().optional();
    }
    if (method !== "GET") fields.body = json();
    const options = { description, input: object(fields as never) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, input);
    const tool = method === "GET" ? query(options as never, handler as never) : mutation(options as never, handler as never);
    const group = groups.get(name) ?? {};
    group[action] = tool;
    groups.set(name, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { modmed: modmed.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.modmed ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ModMed",
        description:
          "ModMed EMA FHIR R4 API: patients, practitioners, locations, appointments and slots, encounters, coverage, clinical records, documents, tasks and charges.",
        instructions:
          "Each tool group is a FHIR resource type. search tools take params (FHIR search parameters), count (max 50) and page; get/update take id; create/update take body as the FHIR resource. Access is limited to the resources and operations ModMed provisioned for the vendor application, so a 403 means that ACL is not granted.",
        icons,
      },
    ),
  }),
);
