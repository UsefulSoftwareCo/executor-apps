import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { chatOptions, onairOptions, webhooksOptions } from "./openapi.js";


const roam = defineProvider({
  name: "Roam",
  hosts: ["api.ro.am", "ro.am"],
  auth: {
    apiKey: secrets({
      label: "API key or personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Roam publishes RFC 8414 metadata but registration is per API client: the connect page asks for the OAuth app's client.
    oauth: oauth2({
      discover: "https://ro.am",
      scopes: [
        "chat:history",
        "chat:read",
        "chat:send_message",
        "chat:join",
        "group:read",
        "group:write",
        "user:read",
        "user:read.email",
        "user:read.status",
        "user:write.status",
        "meetings:read",
        "transcript:read",
        "calendar:read",
        "calendar:write",
        "folders:read",
        "item:write",
        "lobby:read",
        "magicast:read",
        "meetinglink:read",
        "meetinglink:write",
        "user:read.statusBubble",
        "user:write.statusBubble",
        "onair:read",
        "onair:write",
        "webhook:read",
        "webhook:write",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.ro.am/v1/token.info", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    await decodeJson(response, object({ user: object({ id: string(), name: string() }) }));
  },
});

export default defineApp(
  { user: { accounts: { roam: roam.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.roam ?? [],
        (account) => {
          const mount = (options: Parameters<typeof liveOpenapiRouter>[0] extends infer O ? Omit<O & object, "cache" | "fetch" | "signal" | "account"> : never) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            { chat: mount(chatOptions), onair: mount(onairOptions), webhooks: mount(webhooksOptions) },
            { title: "Roam", description: "Roam virtual office." },
          );
        },
        { signal },
      ),
      {
        title: "Roam",
        description:
          "Roam HQ virtual office. chat: chats, messages, reactions, groups, users and status, meetings, transcripts, magicasts, lobbies, calendar, guest badges. onair: On-Air events, guests and attendance. webhooks: webhook subscriptions and failed deliveries.",
        icons,
      },
    ),
  }),
);
