import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// GageList publishes no OpenAPI document (its docs are prose pages and a login-gated API explorer), so the
// endpoints are written by hand from the developer documentation at https://gagelist.com/developer-resources/.
const base = "https://gagelist.net/GageList/api";

const gagelist = defineProvider({
  name: "GageList",
  hosts: ["gagelist.net"],
  auth: {
    // BLOCKED: GageList's documented token request is a form POST with grant_type=password plus client_id and
    // client_secret (page unreadable behind Cloudflare, so the full parameter list is unverified). The apps
    // framework oauth2 type only supports client_credentials, so this declaration does NOT match the vendor and
    // the token request will likely fail. A framework password grant or custom credentials exchange is needed.
    clientCredentials: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://gagelist.net/api/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "form",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/Account/Status`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    // The Account/Status response fields are undocumented to us, so the body is only checked to be valid JSON;
    // a non-2xx authenticated response fails in decodeJson.
    await decodeJson(response, json());
    return { accountInfo: { externalId: "gagelist", displayName: "GageList" } };
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST";

function client(accessToken: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (method: Method, path: string, body?: unknown) => {
    const response = await fetcher(`${base}${path}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };
  return { call };
}

type Client = ReturnType<typeof client>;

const id = string({ minLength: 1 });
const enc = encodeURIComponent;
const paging =
  "Paging: start is the zero-based offset of the first record and record_number the page size; the response has total, count, data, success and message.";

const listInput = object({
  start: number().optional(),
  record_number: number().optional(),
  body: json().optional(),
});

function build(c: Client) {
  const listPath = (path: string, i: { start?: number; record_number?: number; body?: unknown }) => {
    const search = new URLSearchParams();
    if (i.start !== undefined) search.set("start", String(i.start));
    if (i.record_number !== undefined) search.set("record_number", String(i.record_number));
    const qs = search.toString();
    return c.call("POST", `${path}${qs === "" ? "" : `?${qs}`}`, i.body ?? {});
  };

  const account = router(
    {
      status: query(
        { description: "Get the account status (GET /Account/Status).", input: object({}) },
        async () => c.call("GET", "/Account/Status"),
      ),
      settings: query(
        { description: "Get the account settings (GET /Account/Settings).", input: object({}) },
        async () => c.call("GET", "/Account/Settings"),
      ),
    },
    { title: "Account", description: "Account status and settings." },
  );

  const gages = router(
    {
      list: query(
        {
          description: `List gage records (POST /Gage/List). ${paging} body is an optional JSON filter object.`,
          input: listInput,
        },
        async (_x, i) => listPath("/Gage/List", i),
      ),
      get: query(
        { description: "Get one gage record (GET /Gage/Detail/{id}).", input: object({ id }) },
        async (_x, i) => c.call("GET", `/Gage/Detail/${enc(i.id)}`),
      ),
      create: mutation(
        {
          description:
            "Add a gage record (POST /Gage/Create). Body fields include Status (Active, Employee Owned, Inactive, Lost, Out of Calibration, Out for Repair, Reference Only, Retired), Manufacturer, Model, Type, ControlNumber, SerialNumber, AssetNo, ConditionAquired (New, Repaired, Used), CalibrationInstructions, LastCalibrationDate and CalibrationDueDate (ISO 8601).",
          input: object({ body: json() }),
        },
        async (_x, i) => c.call("POST", "/Gage/Create", i.body),
      ),
      update: mutation(
        {
          description:
            "Update a gage record (POST /Gage/Update). Body must include Id plus the fields to change (same fields as create).",
          input: object({ body: json() }),
        },
        async (_x, i) => c.call("POST", "/Gage/Update", i.body),
      ),
      delete: mutation(
        { description: "Delete a gage record (POST /Gage/Delete/{id}).", input: object({ id }) },
        async (_x, i) => c.call("POST", `/Gage/Delete/${enc(i.id)}`),
      ),
    },
    { title: "Gages", description: "Gage (instrument) records." },
  );

  const calibrations = router(
    {
      list: query(
        {
          description: `List calibration records (POST /Calibration/List). ${paging} body is an optional JSON filter object.`,
          input: listInput,
        },
        async (_x, i) => listPath("/Calibration/List", i),
      ),
      get: query(
        { description: "Get one calibration record (GET /Calibration/Detail/{id}).", input: object({ id }) },
        async (_x, i) => c.call("GET", `/Calibration/Detail/${enc(i.id)}`),
      ),
      create: mutation(
        {
          description:
            "Add a calibration record to a gage (POST /Calibration/Create). Body includes the GageId and calibration fields such as the calibration date, due date, result and notes.",
          input: object({ body: json() }),
        },
        async (_x, i) => c.call("POST", "/Calibration/Create", i.body),
      ),
      update: mutation(
        {
          description: "Update a calibration record (POST /Calibration/Update). Body must include Id plus the fields to change.",
          input: object({ body: json() }),
        },
        async (_x, i) => c.call("POST", "/Calibration/Update", i.body),
      ),
      delete: mutation(
        { description: "Delete a calibration record (POST /Calibration/Delete/{id}).", input: object({ id }) },
        async (_x, i) => c.call("POST", `/Calibration/Delete/${enc(i.id)}`),
      ),
    },
    { title: "Calibrations", description: "Calibration records." },
  );

  const manufacturers = router(
    {
      list: query(
        { description: "List manufacturers (POST /Manufacturer/List).", input: object({}) },
        async () => c.call("POST", "/Manufacturer/List", {}),
      ),
    },
    { title: "Manufacturers", description: "Gage manufacturers." },
  );

  return router({ account, gages, calibrations, manufacturers });
}

export default defineApp({ user: { accounts: { gagelist: gagelist.many() } }, icons }, async ({ user, fetch, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.gagelist ?? [],
      (account) =>
        withApprovals(build(client(account.fields.access_token, fetch, signal)), (tool) =>
          tool.kind === "mutation" ? always() : undefined,
        ),
      { signal },
    ),
    {
      title: "GageList",
      description: "GageList calibration management: gage records, calibration records, manufacturers and account status.",
      icons,
    },
  ),
}));
