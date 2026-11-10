import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { datatransferOptions, directoryOptions, reportsOptions } from "./openapi.js";

const googleAdmin = defineProvider({
  name: "Google Admin",
  hosts: ["admin.googleapis.com", "openidconnect.googleapis.com"],
  auth: {
    // Google has no dynamic client registration: the connect page asks for a Google Cloud OAuth client.
    oauth: oauth2({
      discover: "https://accounts.google.com",
      scopes: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/admin.directory.user",
        "https://www.googleapis.com/auth/admin.directory.user.alias",
        "https://www.googleapis.com/auth/admin.directory.user.security",
        "https://www.googleapis.com/auth/admin.directory.userschema",
        "https://www.googleapis.com/auth/admin.directory.group",
        "https://www.googleapis.com/auth/admin.directory.group.member",
        "https://www.googleapis.com/auth/admin.directory.orgunit",
        "https://www.googleapis.com/auth/admin.directory.domain",
        "https://www.googleapis.com/auth/admin.directory.customer",
        "https://www.googleapis.com/auth/admin.directory.rolemanagement",
        "https://www.googleapis.com/auth/admin.directory.device.chromeos",
        "https://www.googleapis.com/auth/admin.directory.device.mobile",
        "https://www.googleapis.com/auth/admin.directory.device.mobile.action",
        "https://www.googleapis.com/auth/admin.directory.resource.calendar",
        "https://www.googleapis.com/auth/admin.chrome.printers",
        "https://www.googleapis.com/auth/admin.reports.audit.readonly",
        "https://www.googleapis.com/auth/admin.reports.usage.readonly",
        "https://www.googleapis.com/auth/admin.datatransfer",
      ],
      // Google issues refresh tokens only when asked for offline access.
      authorizationParams: { access_type: "offline", prompt: "consent" },
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, object({ sub: string() }));
    return { accountInfo: { externalId: me.sub } };
  },
});

export default defineApp(
  { user: { accounts: { googleAdmin: googleAdmin.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.googleAdmin ?? [],
        (account) => {
          const mount = (options: typeof directoryOptions) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              directory: mount(directoryOptions),
              reports: mount(reportsOptions),
              datatransfer: mount(datatransferOptions),
            },
            { title: "Google Admin", description: "Google Workspace Admin SDK." },
          );
        },
        { signal },
      ),
      {
        title: "Google Admin",
        description:
          "Google Workspace Admin SDK. directory: users, groups and members, org units, domains, roles, Chrome OS and mobile devices, calendar resources, Chrome printers. reports: audit activity logs, customer and user usage. datatransfer: transfer data between users.",
        icons,
      },
    ),
  }),
);
