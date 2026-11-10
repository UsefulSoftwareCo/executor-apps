import {
  accountRouter,
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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const API = "https://api.route4me.com";
const WH = "https://wh.route4me.com";

const route4me = defineProvider({
  name: "Route4Me",
  hosts: ["api.route4me.com", "wh.route4me.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const url = new URL(`${API}/api.v4/route.php`);
    url.searchParams.set("api_key", account.fields.token);
    url.searchParams.set("limit", "1");
    const response = await fetch(url.toString(), { signal, headers: { Accept: "application/json" } });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

// Route4Me authenticates with an api_key query parameter on every request.
function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (origin: string, method: string, path: string, params: Params = {}, body?: unknown) => {
    if (path.includes("?") || path.includes("#") || path.includes("..") || !path.startsWith("/"))
      throw new Error("path must start with / and must not contain ?, # or ..; use the query field");
    const url = new URL(`${origin}${path}`);
    if (url.origin !== origin) throw new Error("path must stay on the Route4Me host");
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || key === "api_key") continue;
      url.searchParams.set(key, String(value));
    }
    url.searchParams.set("api_key", token);
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const Query = record(string());
const queryDoc = "Extra query parameters keyed exactly as the Route4Me API reference names them.";
const listInput = object({ limit: number().optional(), offset: number().optional(), query: Query.optional() });
const idInput = (name: string) => object({ [name]: string({ minLength: 1 }) });

function build(call: Call) {
  const get = (description: string, path: string, origin = API) =>
    query({ description: `${description} ${queryDoc}`, input: listInput }, (_c, { limit, offset, query: q }) =>
      call(origin, "GET", path, { limit, offset, ...(q ?? {}) }),
    );
  const byId = (description: string, path: string, param: string, origin = API) =>
    query({ description: `${description} ${queryDoc}`, input: object({ id: string({ minLength: 1 }), query: Query.optional() }) }, (_c, { id, query: q }) =>
      call(origin, "GET", path, { ...(q ?? {}), [param]: id }),
    );
  const post = (description: string, path: string, origin = API) =>
    mutation({ description: `${description} body is the JSON object from the API reference.`, input: object({ body: json(), query: Query.optional() }) }, (_c, { body, query: q }) =>
      call(origin, "POST", path, q ?? {}, body),
    );
  const put = (description: string, path: string, origin = API) =>
    mutation({ description: `${description} body is the JSON object from the API reference; ID fields go in query.`, input: object({ query: Query, body: json().optional() }) }, (_c, { query: q, body }) =>
      call(origin, "PUT", path, q, body),
    );
  const del = (description: string, path: string, origin = API) =>
    mutation({ description: `${description} ID parameters go in query; body is used by endpoints that take an ID list.`, input: object({ query: Query.optional(), body: json().optional() }) }, (_c, { query: q, body }) =>
      call(origin, "DELETE", path, q ?? {}, body),
    );

  return router({
    optimizations: router(
      {
        list: get("List optimization problems (limit, offset, query.state).", "/api.v4/optimization_problem.php"),
        get: byId("Get an optimization problem by id.", "/api.v4/optimization_problem.php", "optimization_problem_id"),
        create: post("Create and run an optimization (addresses, parameters).", "/api.v4/optimization_problem.php"),
        reoptimize: put("Re-optimize an optimization; query needs optimization_problem_id and reoptimize=1.", "/api.v4/optimization_problem.php"),
        insertAddress: put("Insert addresses into an optimization; query needs optimization_problem_id.", "/api.v4/optimization_problem.php"),
        remove: del("Remove optimizations; body is {\"optimization_problem_ids\": [...]}.", "/api.v4/optimization_problem.php"),
      },
      { title: "Optimizations", description: "Create, fetch, re-optimize and remove optimization problems." },
    ),
    routes: router(
      {
        list: get("List routes (limit, offset).", "/api.v4/route.php"),
        get: byId("Get a route by id; query flags include notes, directions, device_tracking_history, route_path_output.", "/api.v4/route.php", "route_id"),
        search: get("Search routes; query takes route_id, query, start_date, end_date and similar filters.", "/api.v4/route.php"),
        update: put("Update a route; query needs route_id.", "/api.v4/route.php"),
        addDestinations: put("Add addresses to a route; query needs route_id, body has addresses.", "/api.v4/route.php"),
        remove: del("Remove routes; query.route_id is a comma-separated list of route ids.", "/api.v4/route.php"),
        getDestination: get("Get an address on a route; query needs route_id and route_destination_id.", "/api.v4/address.php"),
        updateDestination: put("Update an address on a route (visited, departed, time windows, notes); query needs route_id and route_destination_id.", "/api.v4/address.php"),
        removeDestination: del("Remove an address from a route; query needs route_id and route_destination_id.", "/api.v4/address.php"),
        share: post("Share a route by email; query needs route_id and response_format.", "/actions/route/share_route.php"),
        merge: post("Merge routes; body lists route_ids.", "/actions/merge_routes.php"),
        moveDestination: post("Move a destination between routes; body has to_route_id, route_destination_id, after_destination_id.", "/actions/route/move_route_destination.php"),
        scheduleCalendar: get("Get the schedule calendar (query.schedule_date_from / schedule_date_to).", "/api/schedule_calendar_data.php"),
      },
      { title: "Routes", description: "Routes and the destinations on them." },
    ),
    orders: router(
      {
        list: get("List or search orders (limit, offset, query.query, query.fields).", "/api.v4/order.php"),
        get: byId("Get an order by order_id.", "/api.v4/order.php", "order_id"),
        create: post("Create an order.", "/api.v4/order.php"),
        update: put("Update an order; body includes order_id and changed fields.", "/api.v4/order.php"),
        remove: del("Remove orders; body is {\"order_ids\": [...]}.", "/api.v4/order.php"),
        customFields: get("List order custom user fields.", "/api.v4/order_custom_user_fields.php"),
        addCustomField: post("Add an order custom user field.", "/api.v4/order_custom_user_fields.php"),
        updateCustomField: put("Update an order custom user field; query needs order_custom_field_id.", "/api.v4/order_custom_user_fields.php"),
        removeCustomField: del("Remove an order custom user field; body has order_custom_user_field_id.", "/api.v4/order_custom_user_fields.php"),
      },
      { title: "Orders", description: "Orders and order custom fields." },
    ),
    addressBook: router(
      {
        list: get("List address book locations (limit, offset).", "/api.v4/address_book.php"),
        search: get("Search locations; query.query is the search text, query.fields selects columns.", "/api.v4/address_book.php"),
        get: byId("Get locations by address_id (comma-separated ids allowed).", "/api.v4/address_book.php", "address_id"),
        create: post("Create a location.", "/api.v4/address_book.php"),
        update: put("Update a location; body has address_id and changed fields.", "/api.v4/address_book.php"),
        remove: del("Remove locations; body is {\"address_ids\": [...]}.", "/api.v4/address_book.php"),
        groups: get("List address book groups.", "/api.v4/address_book_group.php"),
        getGroup: byId("Get a group by group id.", "/api.v4/address_book_group.php", "group_id"),
        createGroup: post("Create a group.", "/api.v4/address_book_group.php"),
        updateGroup: put("Update a group.", "/api.v4/address_book_group.php"),
        removeGroup: del("Remove a group.", "/api.v4/address_book_group.php"),
        groupContacts: get("Get contacts in a group; query needs group_id.", "/api/address_book/get_search_group_addresses.php"),
      },
      { title: "Address book", description: "Saved locations and groups." },
    ),
    zones: router(
      {
        avoidanceList: get("List avoidance zones.", "/api.v4/avoidance.php"),
        avoidanceGet: byId("Get an avoidance zone by territory_id.", "/api.v4/avoidance.php", "territory_id"),
        avoidanceCreate: post("Create an avoidance zone.", "/api.v4/avoidance.php"),
        avoidanceUpdate: put("Update an avoidance zone.", "/api.v4/avoidance.php"),
        avoidanceRemove: del("Remove an avoidance zone; query needs territory_id.", "/api.v4/avoidance.php"),
        territoryList: get("List territories.", "/api.v4/territory.php"),
        territoryGet: byId("Get a territory by territory_id.", "/api.v4/territory.php", "territory_id"),
        territoryCreate: post("Create a territory.", "/api.v4/territory.php"),
        territoryUpdate: put("Update a territory.", "/api.v4/territory.php"),
        territoryRemove: del("Remove a territory; query needs territory_id.", "/api.v4/territory.php"),
      },
      { title: "Zones", description: "Avoidance zones and territories." },
    ),
    geocoding: router(
      {
        geocode: query(
          {
            description:
              "Forward or reverse geocode. The Route4Me API takes a POST with the data in the query string: query.addresses is the address text (several addresses separated by newlines) or a 'lat,lng' pair for reverse geocoding, query.format is json or xml.",
            input: object({ query: Query }),
          },
          (_c, { query: q }) => call(API, "POST", "/api/geocoder.php", q),
        ),
      },
      { title: "Geocoding", description: "Convert addresses to coordinates and back." },
    ),
    tracking: router(
      {
        assetTracking: get("Get asset tracking data; query takes tracking (a tracking number).", "/api.v4/status.php"),
        deviceLocation: get("Get a device location for a route; query needs route_id.", "/api/track/get_device_location.php"),
        userLocations: get("Get all user locations.", "/api/track/view_user_locations.php"),
        insert: mutation(
          { description: "Insert route tracking data (the API takes a GET); query carries member_id, route_id, course, speed, lat, lng, device_type, device_guid and related fields.", input: object({ query: Query }) },
          (_c, { query: q }) => call(API, "GET", "/track/set.php", q),
        ),
      },
      { title: "Tracking", description: "GPS tracking data." },
    ),
    activities: router(
      {
        list: get("List activities (limit, offset; query.route_id, query.activity_type to filter).", "/api/get_activities.php"),
        log: post("Log a message to the activity feed; query needs route_id and activity_type.", "/api.v4/activity_feed.php"),
      },
      { title: "Activity feed", description: "Team activity events." },
    ),
    notes: router(
      {
        add: post("Add a note to a route destination; query needs route_id and address_id.", "/actions/addRouteNotes.php"),
        customTypes: get("List custom note types.", "/api.v4/note_custom_types.php"),
        addCustomType: post("Add a custom note type.", "/api.v4/note_custom_types.php"),
      },
      { title: "Notes", description: "Route notes and note types." },
    ),
    members: router(
      {
        list: get("List sub-users (or pass query.member_id for one).", "/api.v4/user.php"),
        get: byId("Get a user by member_id.", "/api.v4/user.php", "member_id"),
        create: post("Create a sub-user.", "/api.v4/user.php"),
        update: put("Update a user.", "/api.v4/user.php"),
        remove: del("Remove a user; body has member_id.", "/api.v4/user.php"),
        config: get("Get account configuration data.", "/api.v4/configuration-settings.php"),
        addConfig: post("Add a configuration key.", "/api.v4/configuration-settings.php"),
        updateConfig: put("Update a configuration key value.", "/api.v4/configuration-settings.php"),
        removeConfig: del("Remove a configuration key.", "/api.v4/configuration-settings.php"),
      },
      { title: "Members", description: "Users and account configuration." },
    ),
    vehicles: router(
      {
        list: get("List vehicles (query.show: active, pending, deleted, all; query.search_query).", "/modules/api/v5.0/vehicles", WH),
        get: query({ description: "Get a vehicle by id.", input: idInput("id") }, (_c, { id }) =>
          call(WH, "GET", `/modules/api/v5.0/vehicles/${encodeURIComponent(id)}`),
        ),
        create: post("Create a vehicle.", "/modules/api/v5.0/vehicles", WH),
        update: mutation({ description: "Update a vehicle; body is the vehicle JSON.", input: object({ id: string({ minLength: 1 }), body: json() }) }, (_c, { id, body }) =>
          call(WH, "PATCH", `/modules/api/v5.0/vehicles/${encodeURIComponent(id)}`, {}, body),
        ),
        remove: mutation({ description: "Remove a vehicle.", input: idInput("id") }, (_c, { id }) =>
          call(WH, "DELETE", `/modules/api/v5.0/vehicles/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Vehicles", description: "Fleet vehicles." },
    ),
    request: mutation(
      {
        description:
          "Escape hatch: send any request to the Route4Me API. host is api or wh (wh.route4me.com serves the v5 warehouse modules such as vehicles and telematics). path starts with /, for example /api.v4/route.php. api_key is added for you.",
        input: object({
          host: string(),
          method: string(),
          path: string({ minLength: 1 }),
          query: Query.optional(),
          body: json().optional(),
        }),
      },
      (_c, { host, method, path, query: q, body }) => {
        const m = method.toUpperCase();
        if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(m)) throw new Error("method must be GET, POST, PUT, PATCH or DELETE");
        if (host !== "api" && host !== "wh") throw new Error("host must be api or wh");
        return call(host === "api" ? API : WH, m, path, q ?? {}, body);
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { route4me: route4me.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.route4me ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Route4Me",
        description:
          "Route optimization and last-mile delivery in Route4Me: optimizations, routes, orders, address book, territories, avoidance zones, geocoding, tracking, activity feed, users and vehicles.",
        icons,
        instructions:
          "Tools take a query record for the parameter names used in the Route4Me API reference (route_id, optimization_problem_id, order_id, ...). The api_key is added automatically. Create tools take a JSON body as shown in the reference.",
      },
    ),
  }),
);
