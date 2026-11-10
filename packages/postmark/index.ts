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
import { accountOptions, serverOptions } from "./openapi.js";

const description =
  "Send and track transactional email with Postmark. server: send email and batches, templates, bounces, message search, inbound, stats, webhooks, suppressions (needs a Server API token). account: servers, domains, sender signatures, data removal (needs an Account API token).";

const postmark = defineProvider({
  name: "Postmark",
  hosts: ["api.postmarkapp.com"],
  auth: {
    serverToken: secrets({
      label: "Server API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    accountToken: secrets({
      label: "Account API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /server reads the server the token belongs to; GET /servers lists the account's servers.
  async health({ account, fetch, signal }) {
    if (account.method === "serverToken") {
      const response = await fetch("https://api.postmarkapp.com/server", {
        signal,
        headers: { Accept: "application/json", "X-Postmark-Server-Token": account.fields.token },
      });
      await decodeJson(response, object({}));
      return;
    }
    const response = await fetch("https://api.postmarkapp.com/servers?count=1&offset=0", {
      signal,
      headers: { Accept: "application/json", "X-Postmark-Account-Token": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { postmark: postmark.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.postmark ?? [],
        (account) => {
          const mount = (options: typeof serverOptions | typeof accountOptions) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          // A server token calls only the Server API and an account token only the Account API.
          return router(
            account.method === "serverToken" ? { server: mount(serverOptions) } : { account: mount(accountOptions) },
            { title: "Postmark", description },
          );
        },
        { signal },
      ),
      { title: "Postmark", description, icons },
    ),
  }),
);
