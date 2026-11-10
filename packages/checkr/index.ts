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

const Account = object({ id: string() });

const checkr = defineProvider({
  name: "Checkr",
  hosts: ["api.checkr.com"],
  auth: {
    apiKey: secrets({
      label: "Secret API key or partner access token",
      fields: object({ key: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.checkr.com/v1/account", {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.key}:`)}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, Account);
    return { accountInfo: { externalId: me.id } };
  },
});

export default defineApp(
  { user: { accounts: { checkr: checkr.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.checkr ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Checkr",
        description:
          "Background screening with Checkr: candidates, reports, invitations, screenings, adverse actions, packages, nodes and accounts.",
        icons,
      },
    ),
  }),
);
