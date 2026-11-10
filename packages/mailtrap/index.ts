import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  array,
  number,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { specs } from "./openapi.js";

const mailtrap = defineProvider({
  name: "Mailtrap",
  hosts: ["mailtrap.io", "send.api.mailtrap.io", "bulk.api.mailtrap.io", "sandbox.api.mailtrap.io"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://mailtrap.io/api/accounts", {
      signal,
      headers: { "Api-Token": account.fields.token },
    });
    await decodeJson(response, array(object({ id: number(), name: string() })));
  },
});

export default defineApp(
  { user: { accounts: { mailtrap: mailtrap.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mailtrap ?? [],
        (account) => {
          const mount = (options: (typeof specs)[keyof typeof specs]) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              account: mount(specs.account),
              contacts: mount(specs.contacts),
              campaigns: mount(specs.campaigns),
              sendingAdmin: mount(specs.sendingAdmin),
              transactional: mount(specs.transactional),
              bulk: mount(specs.bulk),
              sandboxSend: mount(specs.sandboxSend),
              sandbox: mount(specs.sandbox),
              templates: mount(specs.templates),
              inbound: mount(specs.inbound),
            },
            { title: "Mailtrap", description: "Mailtrap account." },
          );
        },
        { signal },
      ),
      {
        title: "Mailtrap",
        description:
          "Email delivery and testing with Mailtrap. " +
          "account: Accounts, users, permissions and API tokens. contacts: Contacts, lists, fields and imports/exports. campaigns: Email campaigns. sendingAdmin: Sending domains, suppressions, tracking opt-outs, stats and email logs. transactional: Send and batch-send transactional email. bulk: Send and batch-send bulk email. sandboxSend: Send into a sandbox inbox. sandbox: Sandbox projects, inboxes and messages. templates: Email templates. inbound: Inbound email." +
          " Most calls need the account id from account.getAllAccounts.",
        icons,
      },
    ),
  }),
);
