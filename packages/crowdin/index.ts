import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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
import { options } from "./openapi.js";

const Me = object({ data: object({ id: number(), username: string() }) });

const crowdin = defineProvider({
  name: "Crowdin",
  hosts: ["api.crowdin.com", "accounts.crowdin.com"],
  auth: {
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Crowdin offers no client registration: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://accounts.crowdin.com/oauth/authorize",
      tokenUrl: "https://accounts.crowdin.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: [
        "project",
        "project.settings",
        "project.member",
        "project.task",
        "project.report",
        "project.status",
        "project.source",
        "project.translation",
        "project.screenshot",
        "project.webhook",
        "project.advisor",
        "project.placeholder",
        "tm",
        "glossary",
        "mt",
        "language",
        "webhook",
        "style-guide",
        "ai",
        "ai.provider",
        "ai.prompt",
        "ai.translate",
        "ai.proxy",
        "ai.fine-tuning",
        "ai.request-log",
        "security-log",
        "notification",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.crowdin.com/api/v2/user", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, Me);
    return {
      accountInfo: {
        externalId: String(me.data.id),
        username: me.data.username,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { crowdin: crowdin.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.crowdin ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Crowdin",
        description:
          "Projects, source files, strings, translations, tasks, glossaries, translation memories, reports and AI in Crowdin's REST API v2.",
        icons,
      },
    ),
  }),
);
