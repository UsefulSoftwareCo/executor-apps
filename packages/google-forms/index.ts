import { accountRouter, decodeJson, defineApp, defineProvider, oauth2, object, router, string, withApprovals } from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const forms = defineProvider({
  name: "Google Forms",
  hosts: ["forms.googleapis.com", "openidconnect.googleapis.com"],
  auth: {
    // Google has no dynamic client registration: the connect page asks for an OAuth client.
    oauth: oauth2({
      discover: "https://accounts.google.com",
      scopes: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/forms.body",
        "https://www.googleapis.com/auth/forms.responses.readonly",
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
  { user: { accounts: { forms: forms.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: await accountRouter(
          user?.accounts.forms ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
      },
      {
        title: "Google Forms",
        description: "Create and edit Google Forms and quizzes, and read their responses.",
        icons,
      },
    ),
  }),
);
