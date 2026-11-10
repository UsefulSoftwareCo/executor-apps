import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
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

const signpath = defineProvider({
  name: "SignPath",
  hosts: ["app.signpath.io"],
  auth: {
    apiKey: secrets({
      label: "API token and organization ID",
      fields: object({ token: string({ minLength: 1 }), organizationId: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `https://app.signpath.io/API/v1/${encodeURIComponent(account.fields.organizationId)}/Organization`,
      { signal, headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" } },
    );
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { signpath: signpath.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.signpath ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SignPath",
        description:
          "Manage SignPath code signing: certificates, projects, signing policies, signing requests, users and audit logs.",
        instructions: "Every operation takes an organizationId path parameter; use the organization ID saved with the account.",
        icons,
      },
    ),
  }),
);
