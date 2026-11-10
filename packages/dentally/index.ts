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
  oauth2,
  plain,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Dentally runs one API host per region, plus a sandbox.
const hostsList = ["api.dentally.co", "api.sandbox.dentally.co", "api.apac.dentally.com", "api.ca.dentally.com"];
const defaultHost = "api.dentally.co";

function normalizeHost(raw: string | undefined): string {
  const host = (raw ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (host === "") return defaultHost;
  if (!hostsList.includes(host)) throw new Error(`Environment must be one of: ${hostsList.join(", ")}.`);
  return host;
}

type Account =
  | { method: "apiKey"; fields: { host: string; token: string } }
  | { method: "oauth"; fields: { access_token: string } };

const originOf = (account: Account) => `https://${account.method === "apiKey" ? normalizeHost(account.fields.host) : defaultHost}`;
const tokenOf = (account: Account) => (account.method === "apiKey" ? account.fields.token : account.fields.access_token);
// Dentally rejects requests without a User-Agent.
const headersOf = (account: Account) => ({
  Authorization: `Bearer ${tokenOf(account)}`,
  Accept: "application/json",
  "User-Agent": "Executor-Dentally/1",
});

const dentally = defineProvider({
  name: "Dentally",
  hosts: hostsList,
  auth: {
    // Settings > Developer Settings > Generate new token in Dentally.
    apiKey: secrets({
      label: "API token",
      fields: object({
        host: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
    // Dentally's authorize and token URLs are per region; Executor declares them statically, so OAuth covers the
    // main (UK/Ireland/Australia production) host api.dentally.co. Other regions use the API token.
    oauth: oauth2({
      authorizationUrl: "https://api.dentally.co/oauth/authorize",
      tokenUrl: "https://api.dentally.co/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "user:read",
        "patient",
        "appointment",
        "financials",
        "practice",
        "treatments",
        "user:update",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${originOf(account as Account)}/v1/user`, { signal, headers: headersOf(account as Account) });
    const { user } = await decodeJson(response, object({ user: object({ id: number(), email: string() }) }));
    return { accountInfo: { externalId: String(user.id), displayName: user.email, email: user.email } };
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Where = "path" | "query";
type Field = [name: string, type: Type, required: boolean, where: Where];

const s = (name: string, required = false): Field => [name, "string", required, "query"];
const n = (name: string): Field => [name, "number", false, "query"];
const b = (name: string): Field => [name, "boolean", false, "query"];

// Every collection takes Dentally's paging and ordering parameters.
const paging: Field[] = [n("page"), n("per_page"), s("sort_by"), s("sort_direction")];
const list = (...extra: Field[]): Field[] => [...extra, ...paging];

type Row = [
  resource: string,
  action: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  description: string,
  fields: Field[],
  // The key Dentally wants the request body wrapped in.
  wrap?: string,
];

const note = "body holds the object's attributes as Dentally documents them (https://developer.dentally.co); it is sent wrapped in the required key.";
const listNote = "Returns 25 items per page by default (per_page up to 100); sort_direction is asc or desc.";

const rows: Row[] = [
  ["practice", "get", "GET", "/v1/practice", "Get the authenticated user's practice.", []],
  ["users", "me", "GET", "/v1/user", "Get the authenticated user.", []],
  ["users", "list", "GET", "/v1/users", `List users. ${listNote}`, list()],
  ["users", "get", "GET", "/v1/users/{user_id}", "Get a user.", []],
  ["users", "update", "PATCH", "/v1/users/{user_id}", `Update a user. ${note}`, [], "user"],

  ["accounts", "list", "GET", "/v1/accounts", `List patient accounts. ${listNote}`, list(s("state"), s("patient_id"))],
  ["accounts", "get", "GET", "/v1/accounts/{account_id}", "Get a patient account.", []],

  ["acquisitionSources", "list", "GET", "/v1/acquisition_sources", `List patient acquisition sources. ${listNote}`, list()],
  ["appointmentCancellationReasons", "list", "GET", "/v1/appointment_cancellation_reasons", `List appointment cancellation reasons. ${listNote}`, list(s("created_after"), s("created_before"), s("updated_after"))],
  ["appointmentReasons", "list", "GET", "/v1/appointment_reasons", "List appointment reasons (deleted filters on removed reasons).", list(b("deleted"))],

  ["appointments", "list", "GET", "/v1/appointments", `List appointments. Use date filters (on, before, after, as YYYY-MM-DD or ISO8601) and avoid ranges over 3 months. ${listNote}`, list(s("on"), s("before"), s("after"), s("practitioner_id"), s("patient_id"), s("site_id"), s("state"), s("updated_after"))],
  ["appointments", "get", "GET", "/v1/appointments/{appointment_id}", "Get an appointment.", []],
  ["appointments", "create", "POST", "/v1/appointments", `Create an appointment (start_time, finish_time, patient_id, practitioner_id and reason are typical). ${note}`, [], "appointment"],
  ["appointments", "update", "PATCH", "/v1/appointments/{appointment_id}", `Update an appointment, including its state. ${note}`, [], "appointment"],
  ["appointments", "delete", "DELETE", "/v1/appointments/{appointment_id}", "Delete an appointment.", []],
  ["appointments", "availability", "GET", "/v1/appointments/availability", "Find free appointment slots. start_time and finish_time are ISO8601, duration is in minutes, practitioner_ids is comma separated. Limited to 200 requests per hour.", [s("start_time", true), s("finish_time", true), n("duration"), s("practitioner_ids")]],
  ["sessionAppointments", "list", "GET", "/v1/session_appointments", `List session appointments. ${listNote}`, list(s("on"), s("before"), s("after"), s("practitioner_id"))],

  ["patients", "list", "GET", "/v1/patients", `List patients. query searches names, postcode, date of birth, email or phone; only active patients are returned unless query contains an asterisk. ${listNote}`, list(s("query"), s("payment_plan_id"), s("site_id"), s("updated_after"), s("created_after"))],
  ["patients", "get", "GET", "/v1/patients/{patient_id}", "Get a patient.", []],
  ["patients", "create", "POST", "/v1/patients", `Create a patient. ${note}`, [], "patient"],
  ["patients", "update", "PATCH", "/v1/patients/{patient_id}", `Update a patient. ${note}`, [], "patient"],
  ["patients", "delete", "DELETE", "/v1/patients/{patient_id}", "Archive a patient.", []],
  ["patients", "stats", "GET", "/v1/patients/{patient_id}/stats", "Get one patient's statistics.", []],
  ["patientStats", "list", "GET", "/v1/patient_stats", `List patient statistics. ${listNote}`, list(s("created_at_after"), s("updated_at_after"))],
  ["patientReferrals", "list", "GET", "/v1/patient_referrals", `List patient referrals. ${listNote}`, list(s("site_id"), s("referrable_type"), s("created_after"), s("created_before"))],
  ["patientReferrals", "get", "GET", "/v1/patient_referrals/{patient_referral_id}", "Get a patient referral.", []],

  ["practitioners", "list", "GET", "/v1/practitioners", `List practitioners. ${listNote}`, list(s("site_id"), s("created_after"), s("updated_after"))],
  ["practitioners", "get", "GET", "/v1/practitioners/{practitioner_id}", "Get a practitioner.", []],
  ["practitioners", "update", "PATCH", "/v1/practitioners/{practitioner_id}", `Update a practitioner. ${note}`, [], "practitioner"],
  ["practitionerDiaries", "list", "GET", "/v1/rota_practitioner_diaries", `List practitioner rota diaries. ${listNote}`, list(s("after"), s("before"), s("practitioner_id"), s("site_id"))],

  ["sites", "list", "GET", "/v1/sites", `List sites. ${listNote}`, list()],
  ["sites", "get", "GET", "/v1/sites/{site_id}", "Get a site.", []],
  ["sites", "update", "PATCH", "/v1/sites/{site_id}", `Update a site. ${note}`, [], "site"],
  ["rooms", "list", "GET", "/v1/rooms", `List rooms. ${listNote}`, list()],
  ["rooms", "get", "GET", "/v1/rooms/{room_id}", "Get a room.", []],

  ["treatments", "list", "GET", "/v1/treatments", `List treatments (the practice's treatment catalogue). ${listNote}`, list()],
  ["treatments", "get", "GET", "/v1/treatments/{treatment_id}", "Get a treatment.", []],
  ["treatmentCategories", "list", "GET", "/v1/treatment_categories", `List treatment categories. ${listNote}`, list()],
  ["treatmentCategories", "get", "GET", "/v1/treatment_categories/{treatment_category_id}", "Get a treatment category.", []],
  ["treatmentAppointments", "list", "GET", "/v1/treatment_appointments", `List treatment appointments. ${listNote}`, list()],
  ["treatmentAppointments", "get", "GET", "/v1/treatment_appointments/{treatment_appointment_id}", "Get a treatment appointment.", []],
  ["treatmentPlans", "list", "GET", "/v1/treatment_plans", `List treatment plans. ${listNote}`, list(b("completed"), s("created_after"), s("created_before"), s("ids"), s("patient_id"), s("practitioner_id"), s("start_date"), s("updated_since"))],
  ["treatmentPlans", "get", "GET", "/v1/treatment_plans/{treatment_plan_id}", "Get a treatment plan.", []],
  ["treatmentPlanItems", "list", "GET", "/v1/treatment_plan_items", `List treatment plan items. ${listNote}`, list(s("completed_on"), s("patient_id"), s("practitioner_id"), s("treatment_plan_id"), s("treatment_appointment_id"), s("updated_after"), s("updated_before"))],
  ["treatmentPlanItems", "get", "GET", "/v1/treatment_plan_items/{treatment_plan_item_id}", "Get a treatment plan item.", []],
  ["sundries", "list", "GET", "/v1/sundries", `List sundries. ${listNote}`, list()],
  ["sundries", "get", "GET", "/v1/sundries/{sundry_id}", "Get a sundry.", []],
  ["fees", "list", "GET", "/v1/fees", `List fees. ${listNote}`, list()],
  ["fees", "get", "GET", "/v1/fees/{fee_id}", "Get a fee.", []],
  ["fees", "update", "PATCH", "/v1/fees/{fee_id}", `Update a fee. ${note}`, [], "fee"],
  ["contracts", "list", "GET", "/v1/contracts", `List contracts. ${listNote}`, list(b("active"))],
  ["contracts", "get", "GET", "/v1/contracts/{contract_id}", "Get a contract.", []],
  ["customFields", "list", "GET", "/v1/custom_fields", `List custom fields. ${listNote}`, list(b("active"), s("updated_after"), s("updated_before"))],
  ["customFields", "get", "GET", "/v1/custom_fields/{custom_field_id}", "Get a custom field.", []],
  ["recalls", "list", "GET", "/v1/recalls", `List recalls. ${listNote}`, list(s("created_after"), s("created_before"), s("updated_after"))],
  ["nhsClaims", "list", "GET", "/v1/nhs_claims", `List NHS claims. ${listNote}`, list(s("created_after"), s("created_before"), s("updated_after"))],
  ["nhsClaims", "get", "GET", "/v1/nhs_claims/{nhs_claim_id}", "Get an NHS claim.", []],
  ["prsiEligibilities", "list", "GET", "/v1/prsi_eligibilities", `List PRSI eligibilities (Ireland). ${listNote}`, list()],
  ["prsiEligibilities", "get", "GET", "/v1/prsi_eligibilities/{prsi_eligibility_id}", "Get a PRSI eligibility.", []],
  ["prsiEligibilities", "create", "POST", "/v1/prsi_eligibilities", `Create a PRSI eligibility. ${note}`, [], "prsi_eligibility"],
  ["prsiEligibilities", "update", "PATCH", "/v1/prsi_eligibilities/{prsi_eligibility_id}", `Update a PRSI eligibility. ${note}`, [], "prsi_eligibility"],
  ["prsiEligibilities", "delete", "DELETE", "/v1/prsi_eligibilities/{prsi_eligibility_id}", "Delete a PRSI eligibility.", []],

  ["invoices", "list", "GET", "/v1/invoices", `List invoices. ${listNote}`, list(s("account_id"), s("dated_on_after"), s("dated_on_before"), s("patient_id"))],
  ["invoices", "get", "GET", "/v1/invoices/{invoice_id}", "Get an invoice.", []],
  ["invoiceItems", "list", "GET", "/v1/invoice_items", `List invoice items. ${listNote}`, list(s("invoice_id"), s("updated_after"))],
  ["payments", "list", "GET", "/v1/payments", `List payments. ${listNote}`, list(s("account_id"), s("dated_after"), s("dated_before"), s("patient_id"), s("payment_plan_id"), s("practitioner_id"))],
  ["payments", "get", "GET", "/v1/payments/{payment_id}", "Get a payment.", []],
  ["payments", "create", "POST", "/v1/payments", `Create a payment. ${note}`, [], "payment"],
  ["payments", "delete", "DELETE", "/v1/payments/{payment_id}", "Delete a payment.", []],
  ["paymentAllocations", "list", "GET", "/v1/payment_allocations", `List payment allocations. ${listNote}`, list(s("transfer_to_id"), s("transfer_from_id"), s("transfer_id"), s("transfer_type"), s("created_at_before"), s("created_at_after"))],
  ["paymentAllocations", "get", "GET", "/v1/payment_allocations/{payment_allocation_id}", "Get a payment allocation.", []],
  ["paymentExplanations", "get", "GET", "/v1/payment_explanation/{payment_explanation_id}", "Get a payment explanation.", []],
  ["paymentExplanations", "create", "POST", "/v1/payments/{payment_id}/explanations", `Create an explanation for a payment. ${note}`, [], "explanation"],
  ["paymentExplanations", "delete", "DELETE", "/v1/payments/{payment_id}/explanations/{payment_explanation_id}", "Delete a payment explanation.", []],
  ["paymentPlans", "list", "GET", "/v1/payment_plans", `List payment plans. ${listNote}`, list(s("site_id"), b("active"))],
  ["paymentPlans", "get", "GET", "/v1/payment_plans/{payment_plan_id}", "Get a payment plan.", []],
  ["paymentPlans", "create", "POST", "/v1/payment_plans", `Create a payment plan. ${note}`, [], "payment_plan"],
  ["paymentPlans", "update", "PATCH", "/v1/payment_plans/{payment_plan_id}", `Update a payment plan. ${note}`, [], "payment_plan"],

  ["waitingLists", "list", "GET", "/v1/waiting_lists", `List waiting lists. ${listNote}`, list()],
  ["waitingLists", "get", "GET", "/v1/waiting_lists/{waiting_list_id}", "Get a waiting list.", []],
  ["waitingLists", "entries", "GET", "/v1/waiting_list_entries/{waiting_list_id}", "List the entries of a waiting list.", list()],

  ["webhooks", "list", "GET", "/v1/webhooks", `List webhooks. ${listNote}`, list()],
  ["webhooks", "get", "GET", "/v1/webhooks/{webhook_id}", "Get a webhook.", []],
  ["webhooks", "create", "POST", "/v1/webhooks", `Create a webhook (active, events such as patient.created, name, secret, url). ${note}`, [], "webhook"],
  ["webhooks", "delete", "DELETE", "/v1/webhooks/{webhook_id}", "Delete a webhook.", []],
];

function fieldsOf(path: string, extra: Field[], wrap: string | undefined): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1]!)
    .map((name) => [name, "string", true, "path"]);
  const body: Field[] = wrap === undefined ? [] : [["body", "json", true, "query"]];
  return [...pathFields, ...extra, ...body];
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

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, fields: Field[], wrap: string | undefined, input: Record<string, unknown>) => {
    let target = path;
    const params = new URLSearchParams();
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (name === "body" || value === undefined || value === null) continue;
      if (where === "path") target = target.replace(`{${name}}`, encodeURIComponent(String(value)));
      else params.set(name, String(value));
    }
    const response = await fetcher(`${originOf(account)}${target}${params.size > 0 ? `?${params.toString()}` : ""}`, {
      method,
      signal,
      headers: {
        ...headersOf(account),
        ...(wrap !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: wrap !== undefined ? JSON.stringify({ [wrap]: input.body ?? {} }) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Dentally answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, description, extra, wrap] of rows) {
    const fields = fieldsOf(path, extra, wrap);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, wrap, input);
    const tool = method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { dentally: dentally.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dentally ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Dentally",
        description:
          "Dentally dental practice management: patients, appointments, practitioners, treatments and plans, invoices, payments, sites, rooms and webhooks.",
        instructions:
          "Lists take page, per_page (max 100), sort_by and sort_direction; always use date filters on large resources such as appointments. Write tools take body as the object's attributes; the tool wraps it in the key Dentally requires.",
        icons,
      },
    ),
  }),
);
