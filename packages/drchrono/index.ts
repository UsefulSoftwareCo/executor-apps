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

const User = object({ id: number(), username: string() });

const drchrono = defineProvider({
  name: "DrChrono",
  hosts: ["app.drchrono.com"],
  auth: {
    // DrChrono has no API keys: apps are registered at https://app.drchrono.com/api-management/.
    oauth: oauth2({
      authorizationUrl: "https://app.drchrono.com/o/authorize/",
      tokenUrl: "https://app.drchrono.com/o/token/",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "form",
      scopes: [
        "user:read",
        "user:write",
        "calendar:read",
        "calendar:write",
        "patients:read",
        "patients:write",
        "patients:summary:read",
        "patients:summary:write",
        "clinical:read",
        "clinical:write",
        "billing:read",
        "billing:write",
        "billing:patient-payment:read",
        "billing:patient-payment:write",
        "labs:read",
        "labs:write",
        "messages:read",
        "messages:write",
        "tasks:read",
        "tasks:write",
        "settings:read",
        "settings:write",
      ],
      scopeSeparator: " ",
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.drchrono.com/api/users/current", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, User);
    return { accountInfo: { externalId: String(me.id), username: me.username } };
  },
});

const description =
  "Patients, appointments, clinical records, billing, labs, messages and tasks in DrChrono.";

export default defineApp(
  { user: { accounts: { drchrono: drchrono.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.drchrono ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      { title: "DrChrono", description, icons },
    ),
  }),
);
