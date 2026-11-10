import {
  accountRouter,
  array,
  boolean,
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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const api = "https://api.zerobounce.net/v2";
const bulk = "https://bulkapi.zerobounce.net/v2";
const domainSearchBulk = "https://bulkapi.zerobounce.net/domain-search";

// The vendor docs list api, api-us and api-eu for the real-time endpoints; the processing location is the user's choice.
// Bulk file endpoints are documented only on bulkapi.zerobounce.net.
const regions: Record<string, string> = {
  global: api,
  us: "https://api-us.zerobounce.net/v2",
  eu: "https://api-eu.zerobounce.net/v2",
};

function regionBase(region: string | undefined) {
  const base = regions[region ?? "global"];
  if (base === undefined) throw new Error('ZeroBounce: region must be "global", "us" or "eu"');
  return base;
}

type Params = Record<string, string | number | boolean | undefined>;

function withKey(base: string, path: string, key: string, params: Params = {}) {
  const url = new URL(`${base}${path}`);
  url.searchParams.set("api_key", key);
  for (const [name, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(name, String(value));
  return url.toString();
}

// ZeroBounce reports failures as 200 or 4xx JSON bodies carrying `error` or `error_message`.
function failure(result: unknown): string | undefined {
  if (typeof result !== "object" || result === null) return undefined;
  const body = result as { error?: unknown; error_message?: unknown; success?: unknown; errors?: unknown };
  if (typeof body.error === "string") return body.error;
  if (body.success === false) return typeof body.error_message === "string" ? body.error_message : "request failed";
  return undefined;
}

const zerobounce = defineProvider({
  name: "ZeroBounce",
  hosts: ["api.zerobounce.net", "api-us.zerobounce.net", "api-eu.zerobounce.net", "bulkapi.zerobounce.net"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // An invalid key answers {"Credits":-1}.
  async health({ account, fetch, signal }) {
    const result = await decodeJson(
      await fetch(withKey(api, "/getcredits", account.fields.token), { signal }),
      object({ Credits: json() }),
    );
    if (typeof result.Credits !== "number" || result.Credits < 0) throw new Error("ZeroBounce rejected the API key");
  },
});

export default defineApp(
  { user: { accounts: { zerobounce: zerobounce.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.zerobounce ?? [],
        (account) => {
          const key = account.fields.token;
          const get = async (base: string, path: string, params: Params) => {
            const result = await decodeJson(await fetch(withKey(base, path, key, params), { signal }), json());
            const message = failure(result);
            if (message !== undefined) throw new Error(`ZeroBounce: ${message}`);
            return result;
          };
          const regionInput = string().optional();
          const regionNote = ' region is "global" (default), "us" or "eu" and selects where ZeroBounce processes the request.';
          const sendFile = async (base: string, path: string, form: FormData) => {
            form.append("api_key", key);
            const result = await decodeJson(await fetch(`${base}${path}`, { method: "POST", signal, body: form }), json());
            const message = failure(result);
            if (message !== undefined) throw new Error(`ZeroBounce: ${message}`);
            return result;
          };
          const getText = async (base: string, path: string, params: Params) => {
            const response = await fetch(withKey(base, path, key, params), { signal });
            const text = await response.text();
            if (text.trimStart().startsWith("{")) {
              try {
                const message = failure(JSON.parse(text));
                if (message !== undefined) throw new Error(`ZeroBounce: ${message}`);
              } catch (error) {
                if (error instanceof Error && error.message.startsWith("ZeroBounce:")) throw error;
              }
            }
            if (!response.ok) throw new Error(`ZeroBounce: HTTP ${response.status}`);
            return { csv: text };
          };
          return router({
            getCredits: query(
              {
                description: `Get the remaining credit balance.${regionNote}`,
                input: object({ region: regionInput }),
              },
              async (_ctx, { region }) => get(regionBase(region), "/getcredits", {}),
            ),
            getApiUsage: query(
              {
                description:
                  "Get validation counts by status and sub-status over a date window. startDate and endDate are yyyy-mm-dd.",
                input: object({ startDate: string({ minLength: 1 }), endDate: string({ minLength: 1 }), region: regionInput }),
              },
              async (_ctx, { startDate, endDate, region }) =>
                get(regionBase(region), "/getapiusage", { start_date: startDate, end_date: endDate }),
            ),
            validate: mutation(
              {
                description:
                  "Validate one email address in real time. Returns status (valid, invalid, catch-all, unknown, spamtrap, abuse, do_not_mail), sub_status, typo suggestion, MX data and optional owner details. Spends one credit unless the result is unknown. timeout is 3-60 seconds; activityData adds inbox activity; verifyPlus forces Verify+." + regionNote,
                approval: always(),
                input: object({
                  region: regionInput,
                  email: string({ minLength: 3 }),
                  ipAddress: string().optional(),
                  timeout: string().optional(),
                  activityData: boolean().optional(),
                  verifyPlus: boolean().optional(),
                }),
              },
              async (_ctx, { email, ipAddress, timeout, activityData, verifyPlus, region }) =>
                get(regionBase(region), "/validate", {
                  email,
                  ip_address: ipAddress ?? "",
                  timeout,
                  activity_data: activityData,
                  verify_plus: verifyPlus,
                }),
            ),
            validateBatch: mutation(
              {
                description:
                  "Validate up to 200 email addresses in one call (can take up to 70 seconds). Spends credits per email except unknown results. For more, use files.send. timeout is 10-120 seconds." + regionNote,
                input: object({
                  region: regionInput,
                  emails: array(string({ minLength: 3 })),
                  timeout: string().optional(),
                  activityData: boolean().optional(),
                  verifyPlus: boolean().optional(),
                }),
                approval: always(),
              },
              async (_ctx, { emails, timeout, activityData, verifyPlus, region }) => {
                const response = await fetch(`${regionBase(region)}/validatebatch`, {
                  method: "POST",
                  signal,
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    api_key: key,
                    email_batch: emails.map((email_address) => ({ email_address, ip_address: null })),
                    ...(timeout === undefined ? {} : { timeout: Number(timeout) }),
                    ...(activityData === undefined ? {} : { activity_data: activityData }),
                    ...(verifyPlus === undefined ? {} : { verify_plus: verifyPlus }),
                  }),
                });
                return decodeJson(response, json());
              },
            ),
            activity: mutation(
              {
                description:
                  "Look up how recently an email address was active (30, 60, 90, 180, 365 or 365+ days) and the first date activity was seen. The vendor docs do not state the credit cost; approval is required because the lookup is billed against the account." + regionNote,
                input: object({ email: string({ minLength: 3 }), region: regionInput }),
                approval: always(),
              },
              async (_ctx, { email, region }) => get(regionBase(region), "/activity", { email }),
            ),
            guessFormat: mutation(
              {
                description:
                  "Email Finder: guess a person's address from a domain or company name plus first/last name. Returns email, confidence (HIGH, MEDIUM, LOW) or a failure_reason. A successful search costs 20 credits or one subscription query; give domain or companyName. To get only a domain's email format, omit the names (see domainSearch)." + regionNote,
                approval: always(),
                input: object({
                  region: regionInput,
                  domain: string().optional(),
                  companyName: string().optional(),
                  firstName: string().optional(),
                  middleName: string().optional(),
                  lastName: string().optional(),
                }),
              },
              async (_ctx, { domain, companyName, firstName, middleName, lastName, region }) =>
                get(regionBase(region), "/guessformat", {
                  domain,
                  company_name: companyName,
                  first_name: firstName,
                  middle_name: middleName,
                  last_name: lastName,
                }),
            ),
            domainSearch: mutation(
              {
                description:
                  "Domain Search: find the likely email format of a domain or company (for example first.last) without naming a person. Calls the same guessformat endpoint as guessFormat with no name fields, which is how ZeroBounce's official MCP server implements domain_search. A successful search costs 20 credits or one subscription query (the vendor Email Finder page states this for guessformat; bulk domain search states the same price). Give domain or companyName." + regionNote,
                input: object({ domain: string().optional(), companyName: string().optional(), region: regionInput }),
                approval: always(),
              },
              async (_ctx, { domain, companyName, region }) =>
                get(regionBase(region), "/guessformat", { domain, company_name: companyName }),
            ),
            domainSearchFiles: router({
              send: mutation(
                {
                  description:
                    "Upload a CSV or TXT list of domains for bulk Domain Search. content is the file text; domainColumn is the 1-based column of the domain. Each search costs 20 credits (or one Email Finder query) when a valid format is returned. Returns file_id; poll domainSearchFiles.status, then get.",
                  input: object({
                    fileName: string({ minLength: 1 }),
                    content: string({ minLength: 1 }),
                    domainColumn: string({ minLength: 1 }),
                    hasHeaderRow: boolean().optional(),
                  }),
                  approval: always(),
                },
                async (_ctx, input) => {
                  const form = new FormData();
                  form.append("file", new Blob([input.content], { type: "text/csv" }), input.fileName);
                  form.append("domain_column", input.domainColumn);
                  if (input.hasHeaderRow !== undefined) form.append("has_header_row", String(input.hasHeaderRow));
                  return sendFile(domainSearchBulk, "/sendfile", form);
                },
              ),
              status: query(
                {
                  description: "Get the processing status of a bulk Domain Search file.",
                  input: object({ fileId: string({ minLength: 1 }) }),
                },
                async (_ctx, { fileId }) => get(domainSearchBulk, "/filestatus", { file_id: fileId }),
              ),
              get: query(
                {
                  description: "Download the results of a completed bulk Domain Search file as CSV text.",
                  input: object({ fileId: string({ minLength: 1 }) }),
                },
                async (_ctx, { fileId }) => getText(domainSearchBulk, "/getfile", { file_id: fileId }),
              ),
              delete: mutation(
                {
                  description: "Delete a bulk Domain Search file. Only possible once the file status is Complete.",
                  input: object({ fileId: string({ minLength: 1 }) }),
                  approval: always(),
                },
                async (_ctx, { fileId }) => get(domainSearchBulk, "/deletefile", { file_id: fileId }),
              ),
            }),
            scoringFiles: router({
              send: mutation(
                {
                  description:
                    "Upload a CSV or TXT list for bulk A.I. Scoring, which rates the quality of each address. Scoring costs one credit per email processed. content is the file text; emailColumn is the 1-based column of the address. returnUrl is a callback the vendor documents as required, so supply one. Returns file_id; poll scoringFiles.status, then get. removeDuplicate defaults to true; the API rejects the file with a 400 if deduplication removes more than half the rows.",
                  input: object({
                    fileName: string({ minLength: 1 }),
                    content: string({ minLength: 1 }),
                    emailColumn: string({ minLength: 1 }),
                    returnUrl: string({ minLength: 1 }),
                    hasHeaderRow: boolean(),
                    removeDuplicate: boolean().optional(),
                  }),
                  approval: always(),
                },
                async (_ctx, input) => {
                  const form = new FormData();
                  form.append("file", new Blob([input.content], { type: "text/csv" }), input.fileName);
                  form.append("email_address_column", input.emailColumn);
                  form.append("return_url", input.returnUrl);
                  form.append("has_header_row", String(input.hasHeaderRow));
                  if (input.removeDuplicate !== undefined) form.append("remove_duplicate", String(input.removeDuplicate));
                  return sendFile(bulk, "/scoring/sendfile", form);
                },
              ),
              status: query(
                {
                  description: "Get the processing status and completion percentage of a bulk A.I. Scoring file.",
                  input: object({ fileId: string({ minLength: 1 }) }),
                },
                async (_ctx, { fileId }) => get(bulk, "/scoring/filestatus", { file_id: fileId }),
              ),
              get: query(
                {
                  description: "Download the results of a completed bulk A.I. Scoring file as CSV text.",
                  input: object({ fileId: string({ minLength: 1 }) }),
                },
                async (_ctx, { fileId }) => getText(bulk, "/scoring/getfile", { file_id: fileId }),
              ),
              delete: mutation(
                {
                  description: "Delete a bulk A.I. Scoring file. Only possible once the file status is Complete.",
                  input: object({ fileId: string({ minLength: 1 }) }),
                  approval: always(),
                },
                async (_ctx, { fileId }) => get(bulk, "/scoring/deletefile", { file_id: fileId }),
              ),
            }),
            files: router({
              send: mutation(
                {
                  description:
                    "Upload a CSV or TXT list for bulk validation (spends credits per email). content is the file text; emailColumn is the 1-based column of the address. Returns file_id; poll files.status, then files.get. Optional: returnUrl callback, hasHeaderRow, removeDuplicate (default true), allowPhase2.",
                  input: object({
                    fileName: string({ minLength: 1 }),
                    content: string({ minLength: 1 }),
                    emailColumn: string({ minLength: 1 }),
                    firstNameColumn: string().optional(),
                    lastNameColumn: string().optional(),
                    genderColumn: string().optional(),
                    ipAddressColumn: string().optional(),
                    returnUrl: string().optional(),
                    hasHeaderRow: boolean().optional(),
                    removeDuplicate: boolean().optional(),
                    allowPhase2: boolean().optional(),
                  }),
                  approval: always(),
                },
                async (_ctx, input) => {
                  const form = new FormData();
                  form.append("file", new Blob([input.content], { type: "text/csv" }), input.fileName);
                  form.append("email_address_column", input.emailColumn);
                  const optional: Record<string, string | boolean | undefined> = {
                    first_name_column: input.firstNameColumn,
                    last_name_column: input.lastNameColumn,
                    gender_column: input.genderColumn,
                    ip_address_column: input.ipAddressColumn,
                    return_url: input.returnUrl,
                    has_header_row: input.hasHeaderRow,
                    remove_duplicate: input.removeDuplicate,
                    allow_phase_2: input.allowPhase2,
                  };
                  for (const [name, value] of Object.entries(optional)) if (value !== undefined) form.append(name, String(value));
                  return sendFile(bulk, "/sendfile", form);
                },
              ),
              status: query(
                {
                  description: "Get the processing status and completion percentage of an uploaded file.",
                  input: object({ fileId: string({ minLength: 1 }) }),
                },
                async (_ctx, { fileId }) => get(bulk, "/filestatus", { file_id: fileId }),
              ),
              get: query(
                {
                  description:
                    "Download the validated results of a completed file as CSV text. downloadType is phase_1, phase_2 or combined; activityData appends activity data.",
                  input: object({
                    fileId: string({ minLength: 1 }),
                    downloadType: string().optional(),
                    activityData: boolean().optional(),
                  }),
                },
                async (_ctx, { fileId, downloadType, activityData }) =>
                  getText(bulk, "/getfile", { file_id: fileId, download_type: downloadType, activity_data: activityData }),
              ),
              delete: mutation(
                {
                  description: "Delete an uploaded file and its results. Only possible once the file status is Complete.",
                  input: object({ fileId: string({ minLength: 1 }) }),
                  approval: always(),
                },
                async (_ctx, { fileId }) => get(bulk, "/deletefile", { file_id: fileId }),
              ),
            }),
          });
        },
        { signal },
      ),
      {
        title: "ZeroBounce",
        description: "Validate and verify email addresses with ZeroBounce: real-time and batch validation, bulk file lists, credits, API usage, activity data, the email finder, domain search and A.I. scoring.",
        icons,
      },
    ),
  }),
);
