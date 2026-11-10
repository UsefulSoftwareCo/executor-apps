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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.pushalert.co/rest/v1";

const pushalert = defineProvider({
  name: "PushAlert",
  hosts: ["api.pushalert.co"],
  auth: {
    apiKey: secrets({
      label: "REST API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing segments is read-only and authenticated.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/segments`, {
      signal,
      headers: { Authorization: `api_key=${account.fields.token}` },
    });
    await decodeJson(response, object({ success: boolean() }));
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = { Authorization: `api_key=${token}` };
  return {
    get: async (path: string) => decodeJson(await fetcher(`${base}${path}`, { signal, headers }), json()),
    // The API takes form-encoded fields; arrays and objects are sent as JSON strings.
    post: async (path: string, fields: Record<string, unknown> = {}) => {
      const body = new URLSearchParams();
      for (const [key, value] of Object.entries(fields)) {
        if (value === undefined) continue;
        body.set(key, typeof value === "object" && value !== null ? JSON.stringify(value) : String(value));
      }
      return decodeJson(await fetcher(`${base}${path}`, { method: "POST", signal, headers, body }), json());
    },
  };
}

const segmentId = number();
const subscribers = array(string({ minLength: 1 }));

function build(c: ReturnType<typeof client>) {
  return router({
    notifications: router(
      {
        send: mutation(
          {
            description:
              "Send a notification to all subscribers, one subscriber, a list of subscribers, or an Audience Creator audience. title is up to 64 characters, message up to 192, url is the page opened on click. Pass at most one of subscriber and subscribers. Returns the notification id.",
            input: object({
              title: string({ minLength: 1 }),
              message: string({ minLength: 1 }),
              url: string({ minLength: 1 }),
              icon: string().optional(),
              largeImage: string().optional(),
              action1: object({ title: string(), url: string() }).optional(),
              action2: object({ title: string(), url: string() }).optional(),
              audienceId: number().optional(),
              subscriber: string().optional(),
              subscribers: subscribers.optional(),
              titleAttr: string().optional(),
              messageAttr: string().optional(),
              urlAttr: string().optional(),
              expireTime: number().optional(),
              scheduleTime: number().optional(),
              timezoneSchedule: string().optional(),
            }),
          },
          async (_ctx, i) =>
            c.post("/send", {
              title: i.title,
              message: i.message,
              url: i.url,
              icon: i.icon,
              large_image: i.largeImage,
              action1: i.action1,
              action2: i.action2,
              audience_id: i.audienceId,
              subscriber: i.subscriber,
              subscribers: i.subscribers,
              title_attr: i.titleAttr,
              message_attr: i.messageAttr,
              url_attr: i.urlAttr,
              expire_time: i.expireTime,
              schedule_time: i.scheduleTime,
              timezone_schedule: i.timezoneSchedule,
            }),
        ),
        sendToSegment: mutation(
          {
            description: "Send a notification to every subscriber in a segment. Returns the notification id.",
            input: object({
              segmentId,
              title: string({ minLength: 1 }),
              message: string({ minLength: 1 }),
              url: string({ minLength: 1 }),
              icon: string().optional(),
            }),
          },
          async (_ctx, i) =>
            c.post(`/segment/${i.segmentId}/send`, { title: i.title, message: i.message, url: i.url, icon: i.icon }),
        ),
        stats: query(
          {
            description: "Get delivery stats for a notification: attempted, delivered, clicked and click-through rate.",
            input: object({ id: string({ minLength: 1 }) }),
          },
          async (_ctx, { id }) => c.get(`/info/${encodeURIComponent(id)}`),
        ),
        deleteScheduled: mutation(
          {
            description: "Delete a scheduled notification that has not been sent yet.",
            input: object({ id: string({ minLength: 1 }) }),
          },
          async (_ctx, { id }) => c.post(`/delete/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Notifications", description: "Send notifications, read their stats and cancel scheduled ones." },
    ),
    segments: router(
      {
        list: query(
          { description: "List all segments with their ids, names and subscriber counts.", input: object({}) },
          async () => c.get("/segments"),
        ),
        create: mutation(
          { description: "Create a segment. Returns its id.", input: object({ name: string({ minLength: 1 }) }) },
          async (_ctx, { name }) => c.post("/segment/create", { name }),
        ),
        delete: mutation(
          { description: "Delete a segment by id.", input: object({ id: number() }) },
          async (_ctx, { id }) => c.post("/segment/delete", { id }),
        ),
        addSubscribers: mutation(
          {
            description: "Add subscribers, by subscriber id, to a segment.",
            input: object({ segmentId, subscribers }),
          },
          async (_ctx, i) => c.post(`/segment/${i.segmentId}/add`, { subscribers: i.subscribers }),
        ),
        removeSubscribers: mutation(
          {
            description: "Remove subscribers, by subscriber id, from a segment.",
            input: object({ segmentId, subscribers }),
          },
          async (_ctx, i) => c.post(`/segment/${i.segmentId}/remove`, { subscribers: i.subscribers }),
        ),
      },
      { title: "Segments", description: "Group subscribers into segments." },
    ),
    attributes: router(
      {
        get: query(
          {
            description: "Get the custom attributes stored for a subscriber.",
            input: object({ subscriber: string({ minLength: 1 }) }),
          },
          // The API exposes this read as a POST.
          async (_ctx, { subscriber }) => c.post("/attribute/get", { subscriber }),
        ),
        put: mutation(
          {
            description:
              "Set custom attributes on a subscriber. Keys are up to 32 characters and values up to 128. attributes is a map of key to string value.",
            input: object({ subscriber: string({ minLength: 1 }), attributes: record(string()) }),
          },
          async (_ctx, i) => c.post("/attribute/put", { subscriber: i.subscriber, attributes: i.attributes }),
        ),
      },
      { title: "Attributes", description: "Read and write custom subscriber attributes." },
    ),
    track: router(
      {
        event: mutation(
          {
            description: "Record a custom event for a subscriber to trigger automated notifications.",
            input: object({
              subscriber: string({ minLength: 1 }),
              eventCategory: string({ minLength: 1 }),
              eventAction: string({ minLength: 1 }),
              eventLabel: string().optional(),
              eventValue: number().optional(),
            }),
          },
          async (_ctx, i) => c.post("/track/event", i),
        ),
        abandonedCart: mutation(
          {
            description:
              "Schedule an abandoned-cart notification for a subscriber. firstName and totalItems personalise it.",
            input: object({
              subscriber: string({ minLength: 1 }),
              firstName: string().optional(),
              totalItems: number().optional(),
            }),
          },
          async (_ctx, i) =>
            c.post("/abandonedCart", {
              subscriber: i.subscriber,
              extra_info:
                i.firstName === undefined && i.totalItems === undefined
                  ? undefined
                  : { first_name: i.firstName, total_items: i.totalItems },
            }),
        ),
        cancelAbandonedCart: mutation(
          {
            description: "Cancel a scheduled abandoned-cart notification, for example after the order completes.",
            input: object({ subscriber: string({ minLength: 1 }) }),
          },
          async (_ctx, { subscriber }) => c.post("/abandonedCart/delete", { subscriber }),
        ),
      },
      { title: "Events", description: "Custom events and abandoned-cart automation." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { pushalert: pushalert.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pushalert ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "PushAlert",
        description: "Send web push notifications, manage segments and subscriber attributes, and track events with PushAlert.",
        icons,
      },
    ),
  }),
);
