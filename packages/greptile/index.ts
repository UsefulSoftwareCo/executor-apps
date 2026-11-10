import { accountRouter, defineApp, defineProvider, oauth2, router, toolAnnotations, withApprovals } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://api.greptile.com/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

// The server publishes protected-resource metadata pointing at auth.greptile.com,
// which supports dynamic client registration. Scopes follow the authorization server's scopes_supported (read, offline_access); "write" is only in the resource metadata, so it is not requested.
const greptile = defineProvider({
  name: "Greptile",
  hosts: ["api.greptile.com", "auth.greptile.com"],
  auth: {
    oauth: oauth2({ discover: url, scopes: ["read", "offline_access"] }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp({ user: { accounts: { greptile: greptile.many() } }, icons }, async ({ user, cache, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.greptile ?? [],
      async (account) =>
        withApprovals(await mcpRouter({ url, account, headers: headers(account), cache, signal }), (tool) =>
          toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
        ),
      { signal },
    ),
    {
      title: "Greptile",
      description:
        "Greptile AI code review: search repository knowledge bases, read pull requests, code reviews and review comments, trigger reviews, manage custom context and view analytics.",
      icons,
    },
  ),
}));
