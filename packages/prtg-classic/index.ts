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
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every PRTG server is self-hosted, so the host is part of the account (monitor.example.com or host:port).
const baseUrl = (raw: string) => {
  const match = /^(?:https?:\/\/)?([A-Za-z0-9.-]+(?::\d+)?)\/?$/.exec(raw.trim());
  if (match === null) throw new Error("Enter the host of your PRTG server, for example monitor.example.com.");
  return `https://${match[1]}`;
};

const withToken = (url: string, token: string) => {
  const next = new URL(url);
  next.searchParams.set("apitoken", token);
  return next.toString();
};

const prtg = defineProvider({
  name: "PRTG Classic",
  auth: {
    // API token created under Setup > My Account > API Keys, sent as the apitoken query parameter. The server
    // host is part of the account, so the provider declares no static `hosts`; requests only go to that host.
    apiKey: secrets({
      label: "API token",
      fields: object({
        host: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = baseUrl(account.fields.host);
    const response = await fetch(withToken(`${base}/api/table.json?content=sensors&columns=objid&count=1`, account.fields.token), {
      signal,
      headers: { accept: "application/json" },
    });
    await decodeJson(response, object({ "prtg-version": string() }));
    return { accountInfo: { externalId: new URL(base).host, displayName: new URL(base).host } };
  },
});

type Type = "string" | "number";
type Field = [name: string, type: Type, required: boolean];
const s = (name: string, required = false): Field => [name, "string", required];
const n = (name: string, required = false): Field => [name, "number", required];

type Op = {
  name: string;
  path: string;
  description: string;
  fields: Field[];
  /** Fixed query parameters. */
  fixed?: Record<string, string>;
  /** Result is JSON; otherwise the body is returned as text. */
  json?: boolean;
  write?: boolean;
};

const id = n("id", true);
const tableFields = [
  s("columns"),
  s("filter"),
  n("count"),
  n("start"),
  s("sortby"),
  n("id"),
];
const tableNote =
  " columns is a comma-separated list (for example objid,device,sensor,status,message,lastvalue); filter takes a PRTG filter such as filter_status=5 (pass the part after filter_ keys in filter as raw query text, for example \"filter_status=5&filter_status=4\"); count and start page the result; sortby is a column name, prefix with - for descending; id limits to the subtree of an object.";

const table = (name: string, content: string, what: string, extra = ""): Op => ({
  name,
  path: "/api/table.json",
  fixed: { content },
  json: true,
  fields: tableFields,
  description: `List ${what} from the PRTG object tree.${extra}${tableNote}`,
});

const ops: Record<string, Op[]> = {
  objects: [
    table("listSensors", "sensors", "sensors", " Useful columns: objid, probe, group, device, sensor, status, message, lastvalue, priority, tags."),
    table("listDevices", "devices", "devices", " Useful columns: objid, probe, group, device, host, status, message, priority, tags."),
    table("listGroups", "groups", "groups", " Useful columns: objid, probe, group, status, totalsens, upsens, downsens."),
    table("listProbes", "probenodes", "probes", " Useful columns: objid, probe, status, totalsens, upsens, downsens."),
    table("listChannels", "channels", "channels of a sensor (set id to the sensor id)", " Useful columns: objid, name, lastvalue."),
    table("listMessages", "messages", "log messages", " Useful columns: objid, datetime, parent, type, name, status, message. Use filter_drel=today|7days|30days|... for the time range."),
    table("listTickets", "tickets", "tickets", " Useful columns: objid, datetime, name, status, priority, assignedto, message."),
    table("listToDos", "todos", "to-do items"),
    table("listNotifications", "notifications", "notification definitions"),
    table("listSchedules", "schedules", "schedules"),
    table("listReports", "reports", "reports"),
    table("listMaps", "maps", "maps"),
    table("listHistory", "history", "the configuration change history of an object (set id)"),
    {
      name: "getStatus",
      path: "/api/getstatus.htm",
      fixed: { id: "0", show: "nodash" },
      fields: [],
      description:
        "Get the overall server status: version, alarm counts, sensor counts by state, messages and to-dos, as XML text.",
    },
    {
      name: "getSensorDetails",
      path: "/api/getsensordetails.json",
      json: true,
      fields: [id],
      description: "Get the full details of one sensor by id: state, last value, last message, channels, intervals and timestamps.",
    },
    {
      name: "getObjectStatus",
      path: "/api/getobjectstatus.htm",
      fields: [id, s("name", true), s("show")],
      description:
        "Read a status value of an object. name is one of status, statusid, message, lastvalue, lastcheck, lastup, lastdown, name, probe, group, device, interval, priority and so on; show=text returns plain text.",
    },
    {
      name: "getObjectProperty",
      path: "/api/getobjectproperty.htm",
      fields: [id, s("name", true), s("show")],
      description:
        "Read a setting of an object by property name, for example name, tags, host, intervalgroup, priority, active, comments, scanningInterval. Returns XML text; pass show=text for plain text.",
    },
    {
      name: "getSensorTypes",
      path: "/api/sensortypes.json",
      json: true,
      fields: [],
      description: "List the sensor types this PRTG server supports.",
    },
    {
      name: "getHistoricData",
      path: "/api/historicdata.json",
      json: true,
      fields: [id, s("sdate", true), s("edate", true), n("avg"), s("usecaption"), s("pctshow"), s("pctmode"), s("pctavg")],
      description:
        "Fetch historic data of a sensor. sdate and edate are formatted yyyy-mm-dd-hh-mm-ss. avg is the averaging interval in seconds (0 for raw data). usecaption=1 names the channel columns.",
    },
  ],
  actions: [
    {
      name: "pause",
      path: "/api/pause.htm",
      write: true,
      fields: [id, s("pausemsg")],
      fixed: { action: "0" },
      description: "Pause monitoring of an object (and everything below it) until resumed. pausemsg is an optional message.",
    },
    {
      name: "pauseFor",
      path: "/api/pauseobjectfor.htm",
      write: true,
      fields: [id, n("duration", true), s("pausemsg")],
      description: "Pause an object for duration minutes, after which it resumes by itself.",
    },
    {
      name: "resume",
      path: "/api/pause.htm",
      write: true,
      fields: [id],
      fixed: { action: "1" },
      description: "Resume monitoring of a paused object.",
    },
    {
      name: "scanNow",
      path: "/api/scannow.htm",
      write: true,
      fields: [id],
      description: "Run the check of a sensor (or every sensor below a device or group) immediately.",
    },
    {
      name: "acknowledgeAlarm",
      path: "/api/acknowledgealarm.htm",
      write: true,
      fields: [id, s("ackmsg"), n("duration")],
      description:
        "Acknowledge the alarm of a sensor in Down state. ackmsg is the message; duration is in minutes (omit to acknowledge until the sensor is up again).",
    },
    {
      name: "setPriority",
      path: "/api/setpriority.htm",
      write: true,
      fields: [id, n("prio", true)],
      description: "Set the priority of an object from 1 (lowest) to 5 (highest).",
    },
    {
      name: "rename",
      path: "/api/rename.htm",
      write: true,
      fields: [id, s("value", true)],
      description: "Rename an object.",
    },
    {
      name: "setObjectProperty",
      path: "/api/setobjectproperty.htm",
      write: true,
      fields: [id, s("name", true), s("value", true)],
      description:
        "Change a setting of an object. name is the property name without the trailing underscore (for example tags, comments, host, interval); value is the new value. Use getObjectProperty to read the current value first.",
    },
    {
      name: "duplicate",
      path: "/api/duplicateobject.htm",
      write: true,
      fields: [id, s("name", true), n("targetid", true), s("host")],
      description:
        "Clone an object into a target group or device (targetid). name is the name of the copy; host is the address when cloning a device.",
    },
    {
      name: "delete",
      path: "/api/deleteobject.htm",
      write: true,
      fields: [id],
      fixed: { approve: "1" },
      description: "Delete an object and everything below it. This cannot be undone.",
    },
    {
      name: "simulateError",
      path: "/api/simulate.htm",
      write: true,
      fields: [id, s("action")],
      description: "Put a sensor into a simulated Down state (action=1) or clear the simulation (action=0).",
    },
    {
      name: "sortSubObjects",
      path: "/api/sortsubobjects.htm",
      write: true,
      fields: [id],
      description: "Sort the children of a group, probe or device alphabetically.",
    },
  ],
};

function schemaFor(fields: Field[]) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [name, type, required] of fields) {
    const base: Schema<unknown, boolean> = type === "number" ? number() : string();
    shape[name] = required ? base : base.optional();
  }
  return object(shape);
}

function describe(op: Op) {
  if (op.fields.length === 0) return op.description;
  const params = op.fields.map(([name, type, required]) => `- ${name} (${type}${required ? ", required" : ""})`);
  return `${op.description}\n\nParameters:\n${params.join("\n")}`;
}

type Params = Record<string, unknown>;

function build(
  base: string,
  url: (value: string) => string,
  fetcher: typeof fetch,
  signal: AbortSignal | undefined,
) {
  const call = async (op: Op, args: Params) => {
    const search = new URLSearchParams();
    for (const [name, value] of Object.entries(op.fixed ?? {})) search.set(name, value);
    for (const [name, value] of Object.entries(args)) {
      if (value === undefined || value === null) continue;
      // filter carries raw "filter_x=y" pairs.
      if (name === "filter") {
        for (const [k, v] of new URLSearchParams(String(value))) search.append(k, v);
        continue;
      }
      search.set(name, String(value));
    }
    const response = await fetcher(url(`${base}${op.path}?${search.toString()}`), {
      signal,
      headers: { accept: op.json === true ? "application/json" : "*/*" },
      redirect: "manual",
    });
    // Action endpoints answer 302 to an HTML page on success.
    if (response.status >= 300 && response.status < 400) return { ok: true };
    if (op.json === true) return decodeJson(response, json());
    const text = await response.text();
    if (!response.ok) throw new Error(`PRTG answered ${response.status}: ${text.slice(0, 300)}`);
    return { ok: true, body: text };
  };
  return router(
    Object.fromEntries(
      Object.entries(ops).map(([group, list]) => [
        group,
        router(
          Object.fromEntries(
            list.map((op) => {
              const spec = { description: describe(op), input: schemaFor(op.fields) };
              const run = async (_ctx: unknown, args: Params) => call(op, args);
              return [op.name, op.write === true ? mutation(spec, run) : query(spec, run)];
            }),
          ),
        ),
      ]),
    ),
  );
}

export default defineApp(
  { user: { accounts: { prtg: prtg.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.prtg ?? [],
        (account) =>
          withApprovals(
            build(baseUrl(account.fields.host), (value) => withToken(value, account.fields.token), fetch, signal),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "PRTG Classic",
        description:
          "Paessler PRTG Network Monitor: sensors, devices, groups, probes, channels, messages, tickets, historic data, and pause, resume, scan, acknowledge and configuration actions.",
        instructions:
          "Every PRTG object (probe, group, device, sensor) has a numeric id; the root group is 0. Start with objects.listSensors or objects.listDevices and pick columns explicitly. Status values: 3 up, 4 warning, 5 down, 7 paused, 13 unusual.",
        icons,
      },
    ),
  }),
);
