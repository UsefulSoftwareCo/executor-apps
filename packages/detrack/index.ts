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
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://app.detrack.com/api/v2";

const detrack = defineProvider({
  name: "Detrack",
  hosts: ["app.detrack.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/dn/jobs?limit=1`, {
      signal,
      headers: { "X-API-KEY": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  "X-API-KEY": account.fields.token,
  Accept: "application/json",
  "Content-Type": "application/json",
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const jobType = "either the literal string Delivery or the literal string Collection";
const type = string().optional();
const date = string().optional();
const fields = record(json());
const doNumber = string();

const detrackTools = (account: Account, signal: AbortSignal) => {
  const send = async (
    fetch: typeof globalThis.fetch,
    method: string,
    path: string,
    data: unknown,
  ) =>
    sendRaw(fetch, method, path, JSON.stringify({ data }));

  const sendRaw = async (fetch: typeof globalThis.fetch, method: string, path: string, body: string) => {
    const response = await fetch(`${base}${path}`, { method, signal, headers: headers(account), body });
    if (!response.ok) {
      // Detrack 422 bodies carry an errors array with per-record details; surface it.
      throw new Error(`Detrack ${method} ${path} failed with ${response.status}: ${(await response.text()).slice(0, 4000)}`);
    }
    return decodeJson(response, json());
  };

  const jobs = router(
    {
      list: query(
        {
          description: `List jobs with pagination. page starts at 1; limit is 1-100 (default 20). sort is an attribute name, prefixed with - for descending (for example -created_at). date is YYYY-MM-DD; type is ${jobType}; assign_to filters by driver; status is a comma-separated list (for example completed,failed); do_number matches one DO number; query searches DO number, address, recipient, notify email, driver, tracking number and zone. Rate limit: 60 requests per minute.`,
          input: object({
            page: number().optional(),
            limit: number().optional(),
            sort: string().optional(),
            type,
            date,
            assign_to: string().optional(),
            status: string().optional(),
            do_number: string().optional(),
            query: string().optional(),
          }),
        },
        async ({ fetch }, input) =>
          decodeJson(await fetch(`${base}/dn/jobs${search(input)}`, { signal, headers: headers(account) }), json()),
      ),
      search: query(
        {
          description:
            "Search jobs with a rich filter object. Filters (all optional): type, do_number, do_numbers[], tracking_number, order_number, address, deliver_to_collect_from, customer, account_number, invoice_number, zone, department, source, run_number, serial_number, job_type, job_time, time_window, statuses[], reasons[], item_description, item_batch_number, item_serial_numbers, item_purchase_order_number, item_reasons[], open_to_marketplace, dates {from,to} (YYYY-MM-DD), start_dates {from,to}, groups [{name}], vehicles [{name}]. page and limit (max 100) paginate. This is a read-only POST.",
          input: object({ filters: fields }),
        },
        async ({ fetch }, { filters }) => send(fetch, "POST", "/dn/jobs/search", filters),
      ),
      get: query(
        {
          description: `Retrieve one job by DO number. date (YYYY-MM-DD) and type (${jobType}) disambiguate when the DO number is reused. Returns the full job with items, milestones and proof-of-delivery details.`,
          input: object({ do_number: doNumber, date, type }),
        },
        async ({ fetch }, input) =>
          decodeJson(await fetch(`${base}/dn/jobs/show/${search(input)}`, { signal, headers: headers(account) }), json()),
      ),
      create: mutation(
        {
          description: `Create one job. data is the job object: required do_number, date (YYYY-MM-DD) and address; type is ${jobType}. Common optional fields: tracking_number, order_number, deliver_to_collect_from, last_name, phone_number, notify_email, instructions, assign_to (driver), zone, customer, group_name, payment_mode, payment_amount, time_window_from/to, address_lat/lng, and items [{sku or description, quantity, ...}].`,
          input: object({ data: fields }),
          approval: always(),
        },
        async ({ fetch }, { data }) => send(fetch, "POST", "/dn/jobs", data),
      ),
      bulkCreate: mutation(
        {
          description:
            "Create up to 100 jobs in one request. jobs is an array of job objects with the same fields as create (do_number, date and address are required on each).",
          input: object({ jobs: array(fields) }),
          approval: always(),
        },
        async ({ fetch }, { jobs: data }) => send(fetch, "POST", "/dn/jobs/bulk", data),
      ),
      update: mutation(
        {
          description: `Update one job identified by do_number (plus optional date and type ${jobType} to disambiguate). data holds only the fields to change. Set overwrite true to modify an already completed job.`,
          input: object({
            do_number: doNumber,
            date,
            type,
            data: fields,
            overwrite: boolean().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, { data, ...identity }) =>
          sendRaw(fetch, "PUT", "/dn/jobs/update", JSON.stringify({ ...identity, data })),
      ),
      bulkUpdate: mutation(
        {
          description:
            "Update up to 100 jobs in one request. updates is an array of { do_number, date?, type?, overwrite?, data } where data holds the fields to change.",
          input: object({ updates: array(fields) }),
          approval: always(),
        },
        async ({ fetch }, { updates }) => send(fetch, "PUT", "/dn/jobs", updates),
      ),
      delete: mutation(
        {
          description: `Delete one job by DO number. date and type (${jobType}) disambiguate when the DO number is reused.`,
          input: object({ do_number: doNumber, date, type }),
          approval: always(),
        },
        async ({ fetch }, input) => {
          const response = await fetch(`${base}/dn/jobs/delete${search(input)}`, {
            method: "DELETE",
            signal,
            headers: headers(account),
          });
          if (!response.ok) {
            throw new Error(`Detrack DELETE /dn/jobs/delete failed with ${response.status}: ${(await response.text()).slice(0, 4000)}`);
          }
          return { deleted: true, do_number: input.do_number };
        },
      ),
      bulkDelete: mutation(
        {
          description: `Delete up to 100 jobs in one request. jobs is an array of { do_number, date?, type? } where type is ${jobType}.`,
          input: object({ jobs: array(fields) }),
          approval: always(),
        },
        async ({ fetch }, { jobs }) => send(fetch, "DELETE", "/dn/jobs", jobs),
      ),
      reattempt: mutation(
        {
          description:
            "Reattempt a failed job: creates the next attempt. new_date (YYYY-MM-DD) sets a different date for the new attempt; date and type disambiguate the original job.",
          input: object({ do_number: doNumber, date, new_date: string().optional(), type }),
          approval: always(),
        },
        async ({ fetch }, input) => send(fetch, "POST", "/dn/jobs/reattempt", input),
      ),
      exportDocuments: mutation(
        {
          description:
            "Start a batch export of proof-of-delivery or shipping-label PDFs for up to 1000 jobs. document is pod (default) or shipping-labels. Returns a status_url; pass its id to exportStatus until it completes and gives a download_url.",
          input: object({
            do_numbers: array(string()),
            date,
            type,
            document: string().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, { do_numbers, date, type, document }) =>
          send(fetch, "POST", "/dn/jobs/bulk/export", {
            query: { do_numbers, ...(date === undefined ? {} : { date }), ...(type === undefined ? {} : { type }) },
            ...(document === undefined ? {} : { document }),
          }),
      ),
      exportStatus: query(
        {
          description: "Check a batch export started by exportDocuments. Returns status and, once completed, a time-limited download_url for the file.",
          input: object({ id: string() }),
        },
        async ({ fetch }, { id }) =>
          decodeJson(
            await fetch(`${base}/dn/jobs/export/status/${encodeURIComponent(id)}`, { signal, headers: headers(account) }),
            json(),
          ),
      ),
    },
    { title: "Jobs", description: "Deliveries and collections: list, search, create, update, delete, reattempt and export." },
  );

  const depots = router(
    {
      list: query(
        {
          description: "List depots. page starts at 1; limit defaults to 25.",
          input: object({ page: number().optional(), limit: number().optional() }),
        },
        async ({ fetch }, input) =>
          decodeJson(await fetch(`${base}/dn/depots${search(input)}`, { signal, headers: headers(account) }), json()),
      ),
      get: query(
        {
          description: "Retrieve one depot by exact name.",
          input: object({ name: string() }),
        },
        async ({ fetch }, input) =>
          decodeJson(await fetch(`${base}/dn/depots/${search(input)}`, { signal, headers: headers(account) }), json()),
      ),
      create: mutation(
        {
          description:
            "Create a depot. data needs name and an address that can be geocoded; optional address_lat and address_lng, and free-form address parts. Detrack responses use addr_1, addr_2, addr_3 and zip_code, but its bulk-update example sends addr1, so the docs are not consistent on these names.",
          input: object({ data: fields }),
          approval: always(),
        },
        async ({ fetch }, { data }) => send(fetch, "POST", "/dn/depots", data),
      ),
      bulkCreate: mutation(
        {
          description: "Create several depots at once. depots is an array of depot objects (name and address required).",
          input: object({ depots: array(fields) }),
          approval: always(),
        },
        async ({ fetch }, { depots }) => send(fetch, "POST", "/dn/depots/bulk", depots),
      ),
      bulkUpdate: mutation(
        {
          description: "Update depots. updates is an array of { name, data } where data holds the depot fields to change.",
          input: object({ updates: array(fields) }),
          approval: always(),
        },
        async ({ fetch }, { updates }) => send(fetch, "PUT", "/dn/depots", updates),
      ),
      bulkDelete: mutation(
        {
          description: "Delete depots by name. depots is an array of { name }.",
          input: object({ depots: array(fields) }),
          approval: always(),
        },
        async ({ fetch }, { depots }) => send(fetch, "DELETE", "/dn/depots", depots),
      ),
    },
    { title: "Depots", description: "Depot locations used as route start and end points." },
  );

  const routes = router(
    {
      list: query(
        {
          description: "List routes planned for one date (YYYY-MM-DD, required). page starts at 1; limit is up to 100 (default 25).",
          input: object({ date: string(), page: number().optional(), limit: number().optional() }),
        },
        async ({ fetch }, input) =>
          decodeJson(await fetch(`${base}/dn/routes/${search(input)}`, { signal, headers: headers(account) }), json()),
      ),
      get: query(
        {
          description: "Retrieve one route by name and date (YYYY-MM-DD), both required.",
          input: object({ name: string(), date: string() }),
        },
        async ({ fetch }, input) =>
          decodeJson(await fetch(`${base}/dn/routes/${search(input)}`, { signal, headers: headers(account) }), json()),
      ),
      plan: mutation(
        {
          description:
            "Create a route, or update the one with the same name and date, and compute an optimized stop sequence. data needs name, date (YYYY-MM-DD), vehicles (driver names), job_ids and depot_location ({id} of an existing depot, or {name, address}). Optional: end_depot_location, mode (drive, light_truck, medium_truck, truck, heavy_truck), type (balanced, short, less_maneuvers), time_window_from/to (HH:MM), traffic, max_speed, service_time, avoid_toll, assign_route, retain_assigments. Vehicle working hours come from the Detrack app settings.",
          input: object({ data: fields }),
          approval: always(),
        },
        async ({ fetch }, { data }) => send(fetch, "POST", "/dn/routes/plan", data),
      ),
    },
    { title: "Routes", description: "Route planning and optimization." },
  );

  return router(
    { jobs, depots, routes },
  );
};

export default defineApp({ user: { accounts: { detrack: detrack.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.detrack ?? [], (account) => detrackTools(account, signal), { signal }), {
    title: "Detrack",
    description: "Delivery management: jobs (deliveries and collections), depots and route planning.",
    icons,
  }),
}));
