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
  query,
  array,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://serv.amazingmarvin.com/api";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "fullAccess"; fields: { token: string; fullAccessToken: string } };

const marvin = defineProvider({
  name: "Amazing Marvin",
  hosts: ["serv.amazingmarvin.com"],
  auth: {
    // Marvin has no OAuth. Both tokens come from the API strategy in the app (app.amazingmarvin.com/pre?api).
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    fullAccess: secrets({
      label: "API token and full access token",
      fields: object({ token: string({ minLength: 1 }), fullAccessToken: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/me`, { signal, headers: headers(account) });
    await decodeJson(response, object({}));
  },
});

function headers(account: Account, extra: Record<string, string> = {}): Record<string, string> {
  return {
    "X-API-Token": account.fields.token,
    ...(account.method === "fullAccess" ? { "X-Full-Access-Token": account.fields.fullAccessToken } : {}),
    ...extra,
  };
}

type Params = Record<string, unknown>;

function client(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  return async (method: "GET" | "POST", path: string, search: Params = {}, body?: Params, extra: Record<string, string> = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: { ...headers(account, extra), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    // Some endpoints answer with a bare string such as "OK".
    const text = await response.text();
    if (!response.ok) throw new Error(`Marvin ${method} ${path} failed with ${response.status}: ${text.slice(0, 500)}`);
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  };
}

const requireFull = (account: Account) => {
  if (account.method !== "fullAccess") throw new Error("This tool needs the full access token. Reconnect with the API token and full access token.");
};

const strings = array(string());
const fields = record(json());

const taskFields = {
  title: string().optional(),
  done: boolean().optional(),
  day: string().optional(),
  parentId: string().optional(),
  labelIds: strings.optional(),
  firstScheduled: string().optional(),
  rank: number().optional(),
  dailySection: string().optional(),
  bonusSection: string().optional(),
  customSection: string().optional(),
  timeBlockSection: string().optional(),
  note: string().optional(),
  dueDate: string().optional(),
  timeEstimate: number().optional(),
  isReward: boolean().optional(),
  isFrogged: number().optional(),
  plannedWeek: string().optional(),
  plannedMonth: string().optional(),
  rewardPoints: number().optional(),
  rewardId: string().optional(),
  backburner: boolean().optional(),
  reviewDate: string().optional(),
  itemSnoozeTime: number().optional(),
  permaSnoozeTime: number().optional(),
  timeZoneOffset: number().optional(),
};

function build(account: Account, call: ReturnType<typeof client>) {
  const idInput = object({ id: string() });
  return router({
    me: query({ description: "Profile of the authenticated user.", input: object({}) }, async () => call("GET", "/me")),
    kudos: query({ description: "Kudos total, level and kudos remaining to the next level.", input: object({}) }, async () => call("GET", "/kudos")),
    tasks: router(
      {
        today: query(
          {
            description: "Tasks and projects scheduled for a day, including rollover and auto-scheduled items. The vendor notes the server is UTC+0 so time zone issues are possible; pass date (YYYY-MM-DD) to get the right day.",
            input: object({ date: string().optional() }),
          },
          async (_ctx, { date }) => call("GET", "/todayItems", { date }),
        ),
        due: query(
          { description: "Open items due on or before a date (YYYY-MM-DD).", input: object({ by: string() }) },
          async (_ctx, { by }) => call("GET", "/dueItems", { by }),
        ),
        children: query(
          { description: "Open tasks and projects that are direct children of a project or category.", input: object({ parentId: string() }) },
          async (_ctx, { parentId }) => call("GET", "/children", { parentId }),
        ),
        timeBlocks: query(
          { description: "Time blocks for a day.", input: object({ date: string().optional() }) },
          async (_ctx, { date }) => call("GET", "/todayTimeBlocks", { date }),
        ),
        add: mutation(
          {
            description:
              "Create a task. By default Marvin parses the title for shortcuts (+today, #Category, @label); set parseTitle false to keep it literal. Dates are YYYY-MM-DD, timeEstimate is milliseconds, isStarred is a number (the vendor example uses 3), parentId is a project or category id (omit for the inbox).",
            input: object({ ...taskFields, title: string(), isStarred: number().optional(), parseTitle: boolean().optional() }),
            approval: always(),
          },
          async (_ctx, { parseTitle, ...body }) =>
            call("POST", "/addTask", {}, body, parseTitle === false ? { "X-Auto-Complete": "false" } : {}),
        ),
        markDone: mutation(
          { description: "Mark a task done (experimental per the vendor). timeZoneOffset is in minutes and determines the date the task is recorded as done.", input: object({ itemId: string(), timeZoneOffset: number().optional() }), approval: always() },
          async (_ctx, input) => call("POST", "/markDone", {}, input),
        ),
        trackedItem: query({ description: "The task currently being time tracked, if any.", input: object({}) }, async () => call("GET", "/trackedItem")),
        startTracking: mutation(
          { description: "Start time tracking a task.", input: object({ taskId: string() }), approval: always() },
          async (_ctx, { taskId }) => call("POST", "/track", {}, { taskId, action: "START" }),
        ),
        stopTracking: mutation(
          {
            description: "Stop time tracking a task. Marvin does not update the task's duration and times for you; do that with docs.update.",
            input: object({ taskId: string() }),
            approval: always(),
          },
          async (_ctx, { taskId }) => call("POST", "/track", {}, { taskId, action: "STOP" }),
        ),
        times: query(
          { description: "Tracked time entries for up to 100 tasks. Read-only: the vendor documents POST /api/tracks (alias /api/times) as the way to get time track data; nothing is written.", input: object({ taskIds: strings }) },
          async (_ctx, { taskIds }) => call("POST", "/tracks", {}, { taskIds }),
        ),
      },
      { title: "Tasks", description: "Today's and due tasks, task creation, completion and time tracking." },
    ),
    projects: router(
      {
        add: mutation(
          {
            description: "Create a project. Same fields as tasks.add except priority (high, mid, low) replaces isStarred. For an unscheduled project pass day as null (the vendor says to use day=null); this was not tested against a live account.",
            input: object({ ...taskFields, title: string(), day: json().optional(), priority: string().optional() }),
            approval: always(),
          },
          async (_ctx, body) => call("POST", "/addProject", {}, body),
        ),
      },
      { title: "Projects", description: "Create projects." },
    ),
    categories: query({ description: "All categories and projects (id, title, type, parentId, color).", input: object({}) }, async () => call("GET", "/categories")),
    labels: query({ description: "All labels in sort order.", input: object({}) }, async () => call("GET", "/labels")),
    goals: query({ description: "All goals.", input: object({}) }, async () => call("GET", "/goals")),
    events: router(
      {
        add: mutation(
          {
            description: "Create a calendar event (experimental). start is an ISO time, length is milliseconds, note is markdown. Calendar sync happens only while a Marvin client is running.",
            input: object({ title: string(), start: string(), length: number().optional(), note: string().optional() }),
            approval: always(),
          },
          async (_ctx, body) => call("POST", "/addEvent", {}, body),
        ),
      },
      { title: "Events", description: "Calendar events." },
    ),
    habits: router(
      {
        list: query(
          { description: "List habits. raw returns full objects and needs the full access token.", input: object({ raw: boolean().optional() }) },
          async (_ctx, { raw }) => {
            if (raw === true) requireFull(account);
            return call("GET", "/habits", raw === true ? { raw: 1 } : {});
          },
        ),
        get: query({ description: "One habit with its full history.", input: idInput }, async (_ctx, { id }) => call("GET", "/habit", { id })),
        record: mutation(
          {
            description: "Record a habit value at a time (milliseconds since epoch). updateDB also updates the synced Habit document.",
            input: object({ habitId: string(), time: number(), value: number(), updateDB: boolean().optional() }),
            approval: always(),
          },
          async (_ctx, body) => call("POST", "/updateHabit", {}, body),
        ),
        undo: mutation(
          { description: "Undo the latest habit record.", input: object({ habitId: string(), updateDB: boolean().optional() }), approval: always() },
          async (_ctx, body) => call("POST", "/updateHabit", {}, { ...body, undo: true }),
        ),
        rewriteHistory: mutation(
          {
            description: "Replace a habit's history with a flat array [time, value, time, value, ...].",
            input: object({ habitId: string(), history: array(number()), updateDB: boolean().optional() }),
            approval: always(),
          },
          async (_ctx, body) => call("POST", "/updateHabit", {}, body),
        ),
      },
      { title: "Habits", description: "Habit history and recording (experimental API)." },
    ),
    rewards: router(
      {
        claim: mutation(
          {
            description: "Claim reward points for an item (itemId, or MANUAL). date is YYYY-MM-DD. Returns the profile.",
            input: object({ points: number(), itemId: string(), date: string() }),
            approval: always(),
          },
          async (_ctx, body) => call("POST", "/claimRewardPoints", {}, { ...body, op: "CLAIM" }),
        ),
        unclaim: mutation(
          { description: "Undo a reward point claim. Returns the profile.", input: object({ itemId: string(), date: string() }), approval: always() },
          async (_ctx, body) => call("POST", "/unclaimRewardPoints", {}, { ...body, op: "UNCLAIM" }),
        ),
        spend: mutation(
          { description: "Spend reward points. Returns the profile.", input: object({ points: number(), date: string() }), approval: always() },
          async (_ctx, body) => call("POST", "/spendRewardPoints", {}, { ...body, op: "SPEND" }),
        ),
        reset: mutation(
          { description: "Permanently wipe the reward points earn and spend history. Needs the full access token.", input: object({}), approval: always() },
          async () => {
            requireFull(account);
            return call("POST", "/resetRewardPoints");
          },
        ),
      },
      { title: "Rewards", description: "Reward points." },
    ),
    reminders: router(
      {
        list: query({ description: "List reminders. Needs the full access token.", input: object({}) }, async () => {
          requireFull(account);
          return call("GET", "/reminders");
        }),
        set: mutation(
          {
            description: "Set reminders. Each has time, offset, reminderId, type, title, snooze, autoSnooze and canTrack. This sends task titles to Marvin's server.",
            input: object({ reminders: array(fields) }),
            approval: always(),
          },
          async (_ctx, body) => call("POST", "/reminder/set", {}, body),
        ),
        delete: mutation(
          { description: "Delete reminders by id.", input: object({ reminderIds: strings }), approval: always() },
          async (_ctx, body) => call("POST", "/reminder/delete", {}, body),
        ),
        deleteAll: mutation(
          { description: "Delete every reminder. Needs the full access token.", input: object({}), approval: always() },
          async () => {
            requireFull(account);
            return call("POST", "/reminder/deleteAll");
          },
        ),
      },
      { title: "Reminders", description: "Task reminders." },
    ),
    docs: router(
      {
        get: query(
          { description: "Read any document (task, project, category, label, profile item) by id. Needs the full access token.", input: idInput },
          async (_ctx, { id }) => {
            requireFull(account);
            return call("GET", "/doc", { id });
          },
        ),
        update: mutation(
          {
            description:
              "Update a document by setting fields (experimental). setters is a list of { key, val }. Also set fieldUpdates.FIELD and updatedAt for sync. Malformed documents can crash Marvin on startup. Needs the full access token.",
            input: object({ itemId: string(), setters: array(object({ key: string(), val: json() })) }),
            approval: always(),
          },
          async (_ctx, body) => {
            requireFull(account);
            return call("POST", "/doc/update", {}, body);
          },
        ),
        create: mutation(
          {
            description:
              "Create a raw document (experimental). doc needs _id, db and its fields; createdAt is recommended. Malformed documents can crash Marvin on startup. Needs the full access token.",
            input: object({ doc: fields }),
            approval: always(),
          },
          async (_ctx, { doc }) => {
            requireFull(account);
            return call("POST", "/doc/create", {}, doc);
          },
        ),
        delete: mutation(
          { description: "Permanently delete a document (experimental; there is no server trash). Needs the full access token.", input: object({ itemId: string() }), approval: always() },
          async (_ctx, body) => {
            requireFull(account);
            return call("POST", "/doc/delete", {}, body);
          },
        ),
      },
      { title: "Documents", description: "Raw document access and edits, for anything the typed tools do not cover. Full access token only." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { marvin: marvin.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.marvin ?? [],
        (account) => withApprovals(build(account, client(account, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Amazing Marvin",
        description: "Amazing Marvin tasks, projects, categories, labels, goals, time tracking, habits, reminders and reward points.",
        icons,
        instructions: "Dates are YYYY-MM-DD and durations are milliseconds. Pass date to tasks.today because Marvin's server runs on UTC. Tools marked as needing the full access token fail on an API-token-only account.",
      },
    ),
  }),
);
