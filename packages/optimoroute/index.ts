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
  literal,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.optimoroute.com/v1";

const optimoroute = defineProvider({
  name: "OptimoRoute",
  hosts: ["api.optimoroute.com"],
  auth: {
    apiKey: secrets({
      label: "WS API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Read-only: dispatch status for the live routes.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/get_dispatch_status?key=${encodeURIComponent(account.fields.token)}`, {
      signal,
    });
    await decodeJson(response, object({ success: literal(true) }));
  },
});

type Account = { fields: { token: string } };
type Fetch = typeof globalThis.fetch;

// The API takes the key as a `key` query parameter. GET calls pass their
// parameters in the query string, POST calls pass them as a JSON body.
const call = async (
  fetch: Fetch,
  account: Account,
  signal: AbortSignal,
  method: "GET" | "POST",
  path: string,
  body: unknown,
) => {
  const params = new URLSearchParams({ key: account.fields.token });
  const fields = (body ?? {}) as Record<string, unknown>;
  if (method === "GET") {
    for (const [name, value] of Object.entries(fields)) {
      if (value === undefined || value === null) continue;
      for (const item of Array.isArray(value) ? value : [value]) params.append(name, String(item));
    }
    return decodeJson(await fetch(`${base}/${path}?${params}`, { signal }), json());
  }
  return decodeJson(
    await fetch(`${base}/${path}?${params}`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(fields),
    }),
    json(),
  );
};

const tools = (account: Account, signal: AbortSignal) =>
  router({
    createOrder: mutation(
      {
        description:
          "Create, update, sync or merge one order (operation CREATE, UPDATE, SYNC or MERGE). Geocodes the address. UPDATE needs orderNo or id; other operations need date (YYYY-MM-DD), type (D delivery, P pickup, T task), location and orderNo. Other fields: duration, timeWindows [{twFrom,twTo}], priority (L/M/H/C), load1-load4, skills, vehicleFeatures, assignedTo {serial|externalId}, notes, email, phone, customFields.",
        input: object({ body: json().optional() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "POST", "create_order", body),
    ),
    createOrUpdateOrders: mutation(
      {
        description:
          "Bulk create or update up to 500 orders in orders[]. Each item has the create_order fields plus operation. Does not geocode: new locations need latitude, longitude and one of locationNo, address or locationName.",
        input: object({ body: json().optional() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "POST", "create_or_update_orders", body),
    ),
    getOrders: query(
      {
        description:
          "Fetch up to 500 orders by orders: [{orderNo}] or [{id}]. Returns each order's data.",
        input: object({ body: json().optional() }),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "POST", "get_orders", body),
    ),
    deleteOrder: mutation(
      {
        description:
          "Delete one order by orderNo. forceDelete (default false) deletes it even if already scheduled or serviced.",
        input: object({ body: json().optional() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "POST", "delete_order", body),
    ),
    deleteOrders: mutation(
      {
        description:
          "Delete up to 500 orders in orders: [{orderNo}|{id}]. deleteMultiple deletes all orders sharing an orderNo; forceDelete overrides scheduling.",
        input: object({ body: json().optional() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "POST", "delete_orders", body),
    ),
    deleteAllOrders: mutation(
      {
        description:
          "Delete ALL orders and planned routes for one date, or for every date when date is omitted. Destructive.",
        input: object({ body: json().optional() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "POST", "delete_all_orders", body),
    ),
    searchOrders: query(
      {
        description:
          "Search orders by orders [{orderNo|id}] and/or dateRange {from,to} (at most 35 days). Optional orderStatus list, includeOrderData, includeScheduleInformation. Pass the returned after_tag back with identical other parameters to page.",
        input: object({ body: json().optional() }),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "POST", "search_orders", body),
    ),
    getSchedulingInfo: query(
      {
        description:
          "Get scheduling details (driver, vehicle, stop number, ETA) for one order by orderNo or id.",
        input: object({ body: json().optional() }),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "GET", "get_scheduling_info", body),
    ),
    getRoutes: query(
      {
        description:
          "Get planned routes for a date (YYYY-MM-DD) with stops. Optional filters driverExternalId, driverSerial, vehicleRegistration; flags includeRoutePolyline, includeRouteStartEnd, includeDispatchStatus.",
        input: object({ body: json().optional() }),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "GET", "get_routes", body),
    ),
    sendRoutes: mutation(
      {
        description:
          "Dispatch a date's routes to drivers' mobile apps, with customer notifications when sendNotifications is true (default). Asynchronous: confirm with getDispatchStatus.",
        input: object({ body: json().optional() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "POST", "send_routes", body),
    ),
    getDispatchStatus: query(
      {
        description:
          "Show whether routes for a date have been sent to drivers. Optional date and includeRouteChanges.",
        input: object({ body: json().optional() }),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "GET", "get_dispatch_status", body),
    ),
    startPlanning: mutation(
      {
        description:
          "Start a route optimization for date or dateRange {from,to}. Options: useDrivers [{driverExternalId|driverSerial}], useOrderObjects [{orderNo|id}], includeScheduledOrders, balancing (OFF/ON/ON_FORCE), balanceBy (WT/NUM), balancingFactor, startWith (EMPTY/CURRENT), lockType (NONE/ROUTES/RESOURCES), midRouteDepotVisits, depotTrips, depotVisitDuration, clustering. Returns planningId.",
        input: object({ body: json().optional() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "POST", "start_planning", body),
    ),
    stopPlanning: mutation(
      {
        description:
          "Stop a running optimization by planningId.",
        input: object({ body: json().optional() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "POST", "stop_planning", body),
    ),
    getPlanningStatus: query(
      {
        description:
          "Progress of an optimization by planningId: status (N new, R running, C cancelled, F finished, E error) and percentageComplete.",
        input: object({ body: json().optional() }),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "GET", "get_planning_status", body),
    ),
    updateDriverParameters: mutation(
      {
        description:
          "Change one driver's parameters for a date: externalId and date required; enabled, workTimeFrom, workTimeTo, assignedVehicle, vehicleCapacity1-4, startLatitude/startLongitude/startAddress, endLatitude/endLongitude/endAddress. Unschedules that driver's routes for the date.",
        input: object({ body: json().optional() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "POST", "update_driver_parameters", body),
    ),
    updateDriversParameters: mutation(
      {
        description:
          "Bulk driver parameter changes: updates[] (max 500), each with driver {serial|externalId}, date, enabled, workTime {from,to}, assignedVehicle, vehicleCapacity1-4, startLocation/endLocation {type custom|employeeDefault|startLocation, address, latitude, longitude}. Unschedules affected routes.",
        input: object({ body: json().optional() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "POST", "update_drivers_parameters", body),
    ),
    getEvents: query(
      {
        description:
          "Get driver mobile events (on_duty, off_duty, start_service, success, failed...) for live routes, up to 500 per call. Pass the previous response's tag as after_tag to continue.",
        input: object({ body: json().optional() }),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "GET", "get_events", body),
    ),
    getCompletionDetails: query(
      {
        description:
          "Get completion status, start/end times, positions, proof of delivery form and tracking URL for up to 500 orders in orders [{orderNo|id}]. includeCustomerFeedback adds feedback.",
        input: object({ body: json().optional() }),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "POST", "get_completion_details", body),
    ),
    updateCompletionDetails: mutation(
      {
        description:
          "Set order completion for up to 500 updates [{orderNo|id, data:{status, startTime, endTime}}]. status is unscheduled, scheduled, on_route, servicing, success, failed, rejected or cancelled; times are {unixTimestamp|utcTime|localTime}.",
        input: object({ body: json().optional() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "POST", "update_completion_details", body),
    ),
    updateDriversPositions: mutation(
      {
        description:
          "Upload GPS positions: updates [{driver:{serial|externalId}, positions:[{timestamp, latitude, longitude, speed?, accuracy?, heading?}]}], max 100 positions per driver, one entry per driver.",
        input: object({ body: json().optional() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => call(fetch, account, signal, "POST", "update_drivers_positions", body),
    ),
  });

export default defineApp({ user: { accounts: { optimoroute: optimoroute.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.optimoroute ?? [], (account) => tools(account, signal), { signal }), {
    title: "OptimoRoute",
    description: "Plan and dispatch delivery and field-service routes with OptimoRoute: orders, routes, planning runs, drivers and completion details.",
    icons,
    instructions: "Every tool takes one `body` object holding the request fields documented in its description. Reads with GET use query parameters (repeat arrays); bulk reads use POST bodies.",
  }),
}));
