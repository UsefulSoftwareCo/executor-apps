import {
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://heyzine.com/mcp";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// Tools that change state; always treated as mutations whatever the server's hints say.
const mutations = [
  "heyzine_convert_attached_pdf",
  "heyzine_convert_pdf",
  "heyzine_convert_pdf_async",
  "heyzine_update_flipbook_design",
  "heyzine_delete_flipbook",
  "heyzine_set_flipbook_social",
  "heyzine_set_bookshelf_social",
  "heyzine_add_to_bookshelf",
  "heyzine_remove_from_bookshelf",
  "heyzine_access_setup",
  "heyzine_access_add",
  "heyzine_access_remove",
];
const kinds = Object.fromEntries(mutations.map((name) => [name, "mutation" as const]));

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const heyzine = defineProvider({
  name: "Heyzine",
  hosts: ["heyzine.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server publishes OAuth metadata with dynamic client registration (PKCE S256, scope mcp).
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { heyzine: heyzine.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.heyzine ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }, kinds), (tool, name) =>
            !mutations.includes(name) && toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Heyzine",
        description: "Convert PDFs into flipbooks and manage flipbooks, bookshelves, social metadata and password access.",
        icons,
      },
    ),
  }),
);
