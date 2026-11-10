import {
  accountRouter,
  array,
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

const base = "https://api.webpushr.com/v1";

const webpushr = defineProvider({
  name: "Webpushr",
  hosts: ["api.webpushr.com"],
  auth: {
    apiKey: secrets({
      label: "REST API key and authentication token",
      fields: object({ key: string({ minLength: 1 }), token: string({ minLength: 1 }) }),
    }),
  },
  // The authentication endpoint only validates the key and token pair.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/authentication`, {
      method: "POST",
      signal,
      headers: {
        webpushrKey: account.fields.key,
        webpushrAuthToken: account.fields.token,
        "Content-Type": "application/json",
      },
    });
    await decodeJson(response, object({ status: string() }));
  },
});

type Fetch = typeof fetch;

function client(key: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = { webpushrKey: key, webpushrAuthToken: token, "Content-Type": "application/json" };
  return {
    get: async (path: string) => decodeJson(await fetcher(`${base}${path}`, { signal, headers }), json()),
    post: async (path: string, body: Record<string, unknown>) =>
      decodeJson(
        await fetcher(`${base}${path}`, {
          method: "POST",
          signal,
          headers,
          body: JSON.stringify(Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined))),
        }),
        json(),
      ),
  };
}

const campaignFields = {
  title: string({ minLength: 1 }),
  message: string({ minLength: 1 }),
  targetUrl: string({ minLength: 1 }),
  name: string().optional(),
  icon: string().optional(),
  expirePush: string().optional(),
  autoHide: number().optional(),
  sendAt: string().optional(),
  actionButtons: array(object({ title: string(), url: string() })).optional(),
};

const campaignDoc =
  "title is up to 100 characters, message up to 255, targetUrl is the page opened on click (up to 255). name is an internal campaign label. icon is an HTTPS URL to a 192x192 PNG. expirePush is how long delivery is retried for offline subscribers, a number plus m, h or d (default 4 weeks). autoHide is 1 to dismiss automatically or 0 to keep the notification until clicked. sendAt schedules the send, like '2026-03-04 13:30 -08:00', at least 5 minutes ahead. actionButtons are {title, url} buttons not supported by every browser. Returns the campaign ID.";

type CampaignInput = {
  title: string;
  message: string;
  targetUrl: string;
  name?: string | undefined;
  icon?: string | undefined;
  expirePush?: string | undefined;
  autoHide?: number | undefined;
  sendAt?: string | undefined;
  actionButtons?: ReadonlyArray<{ title: string; url: string }> | undefined;
};

function campaignBody(i: CampaignInput) {
  return {
    title: i.title,
    message: i.message,
    target_url: i.targetUrl,
    name: i.name,
    icon: i.icon,
    expire_push: i.expirePush,
    auto_hide: i.autoHide,
    send_at: i.sendAt,
    action_buttons: i.actionButtons,
  };
}

function build(c: ReturnType<typeof client>) {
  return router({
    notifications: router(
      {
        sendToAll: mutation(
          {
            description: `Send a push notification to all subscribers. ${campaignDoc} image is an HTTPS URL to a large image, shown only on Chrome for Android and Edge.`,
            input: object({ ...campaignFields, image: string().optional() }),
          },
          async (_ctx, i) => c.post("/notification/send/all", { ...campaignBody(i), image: i.image }),
        ),
        sendToSubscriber: mutation(
          {
            description: `Send a push notification to one subscriber by subscriber ID (sid). ${campaignDoc}`,
            input: object({ ...campaignFields, sid: string({ minLength: 1 }), image: string().optional() }),
          },
          async (_ctx, i) => c.post("/notification/send/sid", { ...campaignBody(i), sid: i.sid, image: i.image }),
        ),
        sendToSegments: mutation(
          {
            description: `Send a push notification to subscribers in one or more segments, given by integer segment IDs from the Webpushr dashboard. ${campaignDoc}`,
            input: object({ ...campaignFields, segment: array(number()), image: string().optional() }),
          },
          async (_ctx, i) =>
            c.post("/notification/send/segment", { ...campaignBody(i), segment: i.segment, image: i.image }),
        ),
        sendToAttribute: mutation(
          {
            description: `Send a push notification to subscribers whose custom attributes match, for example {"userEmail": "jane@example.com"}. Multiple pairs match with OR logic. Large images are not supported on this endpoint. ${campaignDoc}`,
            input: object({ ...campaignFields, attribute: record(string()) }),
          },
          async (_ctx, i) => c.post("/notification/send/attribute", { ...campaignBody(i), attribute: i.attribute }),
        ),
        status: query(
          {
            description:
              "Get the status of a campaign by the campaign ID returned when it was created: its state and counts of attempts, sent, failed, delivered, clicked and closed (returned as strings).",
            input: object({ campaignId: string({ minLength: 1 }) }),
          },
          async (_ctx, { campaignId }) => c.get(`/notification/status/id/${encodeURIComponent(campaignId)}`),
        ),
      },
      { title: "Notifications", description: "Send push campaigns and check their status." },
    ),
    subscribers: router(
      {
        count: query(
          {
            description: "Get the site's total lifetime subscriber count and active subscriber count (returned as strings).",
            input: object({}),
          },
          async () => c.get("/site/subscriber_count"),
        ),
      },
      { title: "Subscribers", description: "Subscriber counts." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { webpushr: webpushr.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.webpushr ?? [],
        (account) =>
          withApprovals(build(client(account.fields.key, account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Webpushr",
        description: "Send web push notifications to all subscribers, a subscriber, segments or custom attributes with Webpushr.",
        icons,
      },
    ),
  }),
);
