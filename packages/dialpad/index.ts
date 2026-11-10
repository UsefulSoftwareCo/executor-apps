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
import { options } from "./openapi.js";

const dialpad = defineProvider({
  name: "Dialpad",
  hosts: ["dialpad.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Dialpad has no dynamic client registration: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://dialpad.com/oauth2/authorize",
      tokenUrl: "https://dialpad.com/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["offline_access"],
    }),
  },
  // Every CompanyProto field is nullable in the spec, so only a 2xx JSON object is asserted.
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://dialpad.com/api/v2/company", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { dialpad: dialpad.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dialpad ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Dialpad",
        description:
          "Calls, SMS, users, offices, call centers, contacts, phone numbers, transcripts and stats from the Dialpad API.",
        icons,
      },
    ),
  }),
);
