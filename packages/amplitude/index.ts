import {
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
  router,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const usUrl = "https://mcp.amplitude.com/mcp";
const euUrl = "https://mcp.eu.amplitude.com/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

// Both servers publish OAuth metadata with dynamic client registration and their
// scopes (all:read, all:write, offline_access) in the protected-resource metadata.
const amplitude = defineProvider({
  name: "Amplitude",
  hosts: ["mcp.amplitude.com"],
  auth: {
    oauth: oauth2({ discover: usUrl }),
  },
  health: (check) => mcpHealth(check, { url: usUrl, headers: headers(check.account) }),
});

const amplitudeEu = defineProvider({
  name: "Amplitude (EU)",
  hosts: ["mcp.eu.amplitude.com"],
  auth: {
    oauth: oauth2({ discover: euUrl }),
  },
  health: (check) => mcpHealth(check, { url: euUrl, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { amplitude: amplitude.many(), amplitudeEu: amplitudeEu.many() } }, icons },
  async ({ user, cache, signal }) => {
    const mount = (url: string) => async (account: Account & { readonly id: string }) =>
      withApprovals(await mcpRouter({ url, account, headers: headers(account), cache, signal }), (tool) =>
        toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
      );
    return {
      tools: router(
        router(
          {
            us: await accountRouter(user?.accounts.amplitude ?? [], mount(usUrl), { signal }),
            eu: await accountRouter(user?.accounts.amplitudeEu ?? [], mount(euUrl), { signal }),
          },
          { title: "Amplitude", description: "Amplitude product analytics.", icons },
        ),
        {
          title: "Amplitude",
          description: "Amplitude product analytics: search and query charts, events, users, dashboards, experiments and session replays. Use the us group for US data residency and eu for EU residency.",
          icons,
        },
      ),
    };
  },
);
