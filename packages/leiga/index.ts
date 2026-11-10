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

const leiga = defineProvider({
  name: "Leiga",
  hosts: ["app.leiga.com"],
  auth: {
    apiKey: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Vendor examples show a top-level `code` of "0" on success; the docs never define it, so this is
  // observed rather than documented. Require it: a missing or non-"0" code fails the check.
  // decodeJson throws on non-2xx responses.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.leiga.com/openapi/api/project/list", {
      signal,
      headers: { accessToken: account.fields.token },
    });
    const body = await decodeJson(response, object({}));
    const code = (body as { code?: unknown }).code;
    if (String(code) !== "0") throw new Error(`Leiga did not accept the access token (code ${String(code)})`);
  },
});

export default defineApp(
  { user: { accounts: { leiga: leiga.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.leiga ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Leiga",
        description:
          "Manage Leiga projects, issues, epics, sprints, versions, tags, comments, files, webhooks and members.",
        icons,
      },
    ),
  }),
);
