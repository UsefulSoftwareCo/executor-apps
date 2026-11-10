import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  oauth2,
  object,
  query,
  record,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.availity.com/availity";

const availity = defineProvider({
  name: "Availity",
  hosts: ["api.availity.com"],
  auth: {
    // Availity issues an API key (client ID) and secret when an application is registered in the
    // developer portal; tokens are valid for five minutes and there is no refresh token.
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl: `${base}/v1/token`,
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "form",
      scopes: ["hipaa"],
    }),
  },
  // The payer list carries no patient data; limit keeps the answer small. Nothing is decoded.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1/availity-payer-list?transactionType=270`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Params = Record<string, unknown>;

function client(token: () => string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (
    method: Method,
    path: string,
    search: Params = {},
    body?: { form?: Params; json?: unknown },
  ) => {
    const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, String(value));
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token()}`,
      Accept: "application/json",
    };
    let payload: string | undefined;
    if (body?.form !== undefined) {
      const form = new URLSearchParams();
      for (const [key, value] of Object.entries(body.form)) {
        if (value === undefined || value === null) continue;
        // Availity expects array fields (serviceType) as repeated `name[]` keys.
        if (Array.isArray(value)) for (const item of value) form.append(`${key}[]`, String(item));
        else form.set(key, String(value));
      }
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      payload = form.toString();
    } else if (body?.json !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body.json);
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers,
      ...(payload === undefined ? {} : { body: payload }),
    });
    if (response.status === 204) return null;
    if (response.ok) {
      const text = await response.text();
      return text === "" ? null : JSON.parse(text);
    }
    return decodeJson(response, json());
  };
  return { call };
}

type Client = ReturnType<typeof client>;

const fields = record(json());
const async_ =
  "Availity processes most transactions asynchronously: the call returns a response id (often in the Location header or the body); poll the matching get tool about every 2 seconds until statusCode is 4 (Complete). Every call, including polls, counts against the plan's rate limit.";

function build(c: Client) {
  const id = string({ minLength: 1 });
  return router({
    payers: router(
      {
        list: query(
          {
            description:
              "List payers and what each supports (GET /v1/availity-payer-list). Filter by payerId, transactionType (array, e.g. 270, 276, 278I, 837P, 835), submissionMode (Portal, Batch, RealTime, API), availability (available or contractrequired) and enrollmentRequired.",
            input: object({ query: fields.optional() }),
          },
          async (_ctx, input) => c.call("GET", "/v1/availity-payer-list", input.query ?? {}),
        ),
      },
      { title: "Payers", description: "Availity payer list." },
    ),
    configurations: router(
      {
        get: query(
          {
            description:
              "Payer-specific field and validation rules for a transaction (GET /v1/configurations). type is required: 270 (coverages), service-reviews, service-reviews-inquiry, claim-statuses-inquiry, professional-claims, institutional-claims or enhanced-claim-status. Optional subtypeId (HS, AR, SC for service reviews; HIPAA_276, VALUE_ADDS_277, SUMMARY, DETAIL for enhanced claim status; PRE_DETERMINATION for claims) and payerId.",
            input: object({ type: string({ minLength: 1 }), subtypeId: string().optional(), payerId: string().optional() }),
          },
          async (_ctx, input) =>
            c.call("GET", "/v1/configurations", {
              type: input.type,
              subtypeId: input.subtypeId,
              payerId: input.payerId,
            }),
        ),
      },
      { title: "Configurations", description: "Per-payer validation rules." },
    ),
    coverages: router(
      {
        create: mutation(
          {
            description: `Submit an eligibility and benefits inquiry, X12 270/271 (POST /v1/coverages, form encoded). Body fields: payerId, providerNpi, providerLastName, providerFirstName, providerTaxId, providerType, placeOfService, submitterId, asOfDate, toDate, serviceType (array of service type codes), procedureCode, memberId, patientLastName, patientFirstName, patientBirthDate, patientGender, groupNumber, subscriberRelationship (18 self, 01 spouse, 19 child, G8 other) and more. Use configurations.get with type 270 for a payer's required fields. ${async_}`,
            input: object({ body: fields }),
          },
          async (_ctx, input) => c.call("POST", "/v1/coverages", {}, { form: input.body }),
        ),
        search: query(
          {
            description:
              "Search recent coverage requests (GET /v1/coverages). q is required but may be empty. Optional: status (In Progress, Request Error, Communication Error, Complete), planStatus (Active, Inactive), sortBy (lastUpdateDate, asOfdate, patientLastName), sortDirection (asc, desc), offset, limit (max 50) and any request field to filter on.",
            input: object({ query: fields.optional() }),
          },
          async (_ctx, input) => c.call("GET", "/v1/coverages", { q: "", ...(input.query ?? {}) }),
        ),
        get: query(
          { description: "Retrieve or poll one coverage by response id (GET /v1/coverages/{id}).", input: object({ id }) },
          async (_ctx, input) => c.call("GET", `/v1/coverages/${encodeURIComponent(input.id)}`),
        ),
        delete: mutation(
          { description: "Delete a stored coverage request (DELETE /v1/coverages/{id}).", input: object({ id }) },
          async (_ctx, input) => c.call("DELETE", `/v1/coverages/${encodeURIComponent(input.id)}`),
        ),
      },
      { title: "Coverages", description: "Eligibility and benefits, X12 270/271." },
    ),
    serviceReviews: router(
      {
        create: mutation(
          {
            description: `Submit a prior authorization or referral request, X12 278 (POST /v2/service-reviews). body is the serviceReview object: payer, requestingProvider, subscriber, patient, diagnoses, requestTypeCode, serviceTypeCode, placeOfServiceCode, fromDate, toDate, quantity, quantityTypeCode and so on. Use configurations.get with type service-reviews for a payer's rules. ${async_}`,
            input: object({ body: fields }),
          },
          async (_ctx, input) => c.call("POST", "/v2/service-reviews", {}, { json: input.body }),
        ),
        search: query(
          {
            description: `Inquire about existing service reviews in the payer's system (GET /v2/service-reviews). Pass the inquiry fields as query. ${async_}`,
            input: object({ query: fields.optional() }),
          },
          async (_ctx, input) => c.call("GET", "/v2/service-reviews", input.query ?? {}),
        ),
        get: query(
          { description: "Retrieve or poll one service review by id (GET /v2/service-reviews/{id}).", input: object({ id }) },
          async (_ctx, input) => c.call("GET", `/v2/service-reviews/${encodeURIComponent(input.id)}`),
        ),
        update: mutation(
          {
            description:
              "Update a service review (PUT /v2/service-reviews). Only allowed when the review has updatable=true; see updatableFields. body is the full serviceReview object including its id.",
            input: object({ body: fields }),
          },
          async (_ctx, input) => c.call("PUT", "/v2/service-reviews", {}, { json: input.body }),
        ),
        delete: mutation(
          {
            description: "Void a service review (DELETE /v2/service-reviews/{id}). Only allowed when deletable=true.",
            input: object({ id }),
          },
          async (_ctx, input) => c.call("DELETE", `/v2/service-reviews/${encodeURIComponent(input.id)}`),
        ),
      },
      { title: "Service reviews", description: "Prior authorizations and referrals, X12 278." },
    ),
    claimStatus: router(
      {
        searchBy276: mutation(
          {
            description: `Submit an enhanced claim status inquiry, X12 276 (POST /clmsmgmt/claim-status/claim-status/v1/status/searchBy276). Required: payerId, fromDate, toDate, patientLastName, patientFirstName, patientBirthDate, patientSameAsSubscriber, providerLastName. Optional: claimNumber, claimAmount, patientMemberId, providerNpi, providerTaxId, subscriber fields, offset, limit (1-50). ${async_}`,
            input: object({ body: fields }),
          },
          async (_ctx, input) =>
            c.call("POST", "/clmsmgmt/claim-status/claim-status/v1/status/searchBy276", {}, { json: input.body }),
        ),
        getSearchBy276: query(
          { description: "Poll a searchBy276 result by id.", input: object({ id }) },
          async (_ctx, input) =>
            c.call("GET", "/clmsmgmt/claim-status/claim-status/v1/status/searchBy276", { id: input.id }),
        ),
        valueAdds277: mutation(
          {
            description: `Fetch value-add detail (X12 277) for a claim found by searchBy276. Required: parentTransactionId, claimNumber, claimIndex (zero-based), payerId. ${async_}`,
            input: object({ body: fields }),
          },
          async (_ctx, input) =>
            c.call("POST", "/clmsmgmt/claim-status/claim-status/v1/status/valueAdds277", {}, { json: input.body }),
        ),
        getValueAdds277: query(
          { description: "Poll a valueAdds277 result by id.", input: object({ id }) },
          async (_ctx, input) =>
            c.call("GET", "/clmsmgmt/claim-status/claim-status/v1/status/valueAdds277", { id: input.id }),
        ),
        summarySearch: mutation(
          {
            description: `Search high-level status of one or more claims. Required: payerId and requestType (SERVICE_DATE or MEMBER_ID). Optional: memberId, memberBirthDate, groupNumber, fromDate, toDate, processedDate, providerNpi, providerTaxId, requestedStatus (ALL, ALL_PENDING, ALL_FINALIZED, ALL_ERROR_REJECTED), checkNumber, patientAccountNumber, offset, limit. Provider TINs and NPIs must be set up in your Availity organization. ${async_}`,
            input: object({ body: fields }),
          },
          async (_ctx, input) =>
            c.call("POST", "/clmsmgmt/claim-status/claim-status/v1/status/summarySearch", {}, { json: input.body }),
        ),
        getSummarySearch: query(
          { description: "Poll a summarySearch result by id.", input: object({ id }) },
          async (_ctx, input) =>
            c.call("GET", "/clmsmgmt/claim-status/claim-status/v1/status/summarySearch", { id: input.id }),
        ),
        detailSearch: mutation(
          {
            description: `Fetch detail for one claim. Required: payerId, requestType (CLAIM_NUMBER), claimNumber. Optional: parentTransactionId (a summarySearch id), processedDate, providerNpi, providerTaxId, fromDate, toDate. ${async_}`,
            input: object({ body: fields }),
          },
          async (_ctx, input) =>
            c.call("POST", "/clmsmgmt/claim-status/claim-status/v1/status/detailSearch", {}, { json: input.body }),
        ),
        getDetailSearch: query(
          { description: "Poll a detailSearch result by id.", input: object({ id }) },
          async (_ctx, input) =>
            c.call("GET", "/clmsmgmt/claim-status/claim-status/v1/status/detailSearch", { id: input.id }),
        ),
      },
      { title: "Claim status", description: "Enhanced claim status: X12 276/277, summary and detail search." },
    ),
    api: router(
      {
        get: query(
          {
            description:
              "Call any other Availity API GET endpoint. path follows https://api.availity.com/availity, for example /v1/claim-statuses/{id}. Responses are JSON.",
            input: object({ path: string({ minLength: 1 }), query: fields.optional() }),
          },
          async (_ctx, input) => c.call("GET", input.path, input.query ?? {}),
        ),
        send: mutation(
          {
            description:
              "Call any other Availity API endpoint that submits or changes data (POST, PUT or DELETE), for example POST /v1/claim-statuses or the Claims and Patient Cost Estimator APIs. body is sent as JSON, or as a form when form is true.",
            input: object({
              method: string().default("POST"),
              path: string({ minLength: 1 }),
              query: fields.optional(),
              body: fields.optional(),
              form: json().optional(),
            }),
          },
          async (_ctx, input) => {
            const method = input.method.toUpperCase();
            if (method !== "POST" && method !== "PUT" && method !== "DELETE")
              throw new Error("method must be POST, PUT or DELETE.");
            const payload =
              input.body === undefined ? undefined : input.form === true ? { form: input.body } : { json: input.body };
            return c.call(method, input.path, input.query ?? {}, payload);
          },
        ),
      },
      { title: "Generic REST", description: "Any Availity API endpoint your plan is subscribed to." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { availity: availity.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.availity ?? [],
        (account) =>
          withApprovals(
            build(client(() => String(account.fields.access_token), fetch, signal)),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Availity",
        description:
          "US healthcare clearinghouse: eligibility and benefits, prior authorizations, claim status and the payer list.",
        instructions:
          "Most transactions are asynchronous: submit, then poll the get tool every ~2 seconds until statusCode is 4. Tokens last five minutes. Demo plans return canned data with no PHI; real data needs a Standard plan contracted through your Availity Trading Partner Manager.",
        icons,
      },
    ),
  }),
);
