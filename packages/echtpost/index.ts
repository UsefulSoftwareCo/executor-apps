import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const Me = object({ account: object({ id: number(), name: string() }) });

const echtpost = defineProvider({
  name: "EchtPost",
  hosts: ["api.echtpost.de"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    oauth: oauth2({ discover: "https://my.echtpost.de", scopes: ["api"] }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.echtpost.de/v2/me", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: String(me.account.id), username: me.account.name } };
  },
});

export default defineApp(
  { user: { accounts: { echtpost: echtpost.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.echtpost ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "EchtPost",
        description:
          "Send real postcards by API: create and cancel cards, check text fit, manage contacts, groups, templates and motives, and read credits.",
        icons,
      },
    ),
  }),
);
