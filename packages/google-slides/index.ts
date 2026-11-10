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
import { icons } from "./icon.js";
import { meta, tools } from "./tools.js";

const google = defineProvider({
  name: "Google Slides",
  hosts: ["slides.googleapis.com", "openidconnect.googleapis.com"],
  auth: {
    // Google offers no client registration: the connect page asks for an OAuth client created in Google Cloud.
    oauth: oauth2({
      discover: "https://accounts.google.com",
      scopes: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/presentations",
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
  { user: { accounts: { google: google.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.google ?? [],
        (account) =>
          withApprovals(tools(account.fields.access_token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      { ...meta, icons },
    ),
  }),
);
