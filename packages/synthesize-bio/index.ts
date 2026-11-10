import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
  oauth2,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://app.synthesize.bio/api/mcp";

type Account =
  | { method: "apiKey"; fields: { apiKey: string } }
  | { method: "oauth"; fields: { access_token: string } };

// Platform API keys and OAuth access tokens are both sent as bearer tokens.
const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.apiKey}`,
});

const synthesizeBio = defineProvider({
  name: "Synthesize Bio",
  hosts: ["app.synthesize.bio"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
    // Synthesize Bio advertises dynamic client registration and a single "analyze" scope.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { synthesizeBio: synthesizeBio.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.synthesizeBio ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Synthesize Bio",
        description: "Resolve sample metadata and run bulk or single-cell gene expression analyses in Synthesize Bio.",
        icons,
      },
    ),
  }),
);
