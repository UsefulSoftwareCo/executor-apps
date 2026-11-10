import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const Identity = object({
  identity: object({ id: number(), first_name: string(), last_name: string(), email_address: string() }),
});

// Basecamp has no API keys or client registration: the connect page asks for an OAuth app's
// client, created at https://launchpad.37signals.com/integrations.
const basecamp = defineProvider({
  name: "Basecamp",
  hosts: ["3.basecampapi.com", "launchpad.37signals.com"],
  auth: {
    oauth: oauth2({
      authorizationUrl: "https://launchpad.37signals.com/authorization/new",
      tokenUrl: "https://launchpad.37signals.com/authorization/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://launchpad.37signals.com/authorization.json", {
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.access_token}`,
        "User-Agent": "Executor (https://executor.sh)",
      },
    });
    const { identity } = await decodeJson(response, Identity);
    return {
      accountInfo: {
        externalId: String(identity.id),
        displayName: `${identity.first_name} ${identity.last_name}`,
        email: identity.email_address,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { basecamp: basecamp.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.basecamp ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              signal,
              account,
              // Basecamp rejects requests without an identifying User-Agent.
              fetch: (input, init) => {
                const headers = new Headers(init?.headers);
                headers.set("User-Agent", "Executor (https://executor.sh)");
                return fetch(input, { ...init, headers });
              },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Basecamp",
        description:
          "Projects, to-dos, messages, schedules, files, Campfire chats, card tables and the rest of the Basecamp 3 REST API.",
        instructions:
          "Every tool takes the Basecamp account ID as its accountId argument: the number in your Basecamp URL, as in 3.basecamp.com/<accountId>/.",
        icons,
      },
    ),
  }),
);
