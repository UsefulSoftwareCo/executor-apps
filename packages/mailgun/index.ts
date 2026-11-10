import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { inspectOptions, optimizeOptions, sendOptions, validateOptions } from "./openapi.js";

const origins = { us: "https://api.mailgun.net", eu: "https://api.eu.mailgun.net" } as const;

function originFor(raw: string): string {
  const region = raw.trim().toLowerCase();
  if (region !== "us" && region !== "eu") throw new Error("Region must be us or eu.");
  return origins[region];
}

const mailgun = defineProvider({
  name: "Mailgun",
  hosts: ["api.mailgun.net", "api.eu.mailgun.net"],
  auth: {
    apiKey: secrets({
      label: "Private API key (region: us or eu)",
      fields: object({
        region: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${originFor(account.fields.region)}/v4/domains?limit=1`, {
      signal,
      headers: { Authorization: `Basic ${btoa(`api:${account.fields.token}`)}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { mailgun: mailgun.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mailgun ?? [],
        (account) => {
          const origin = originFor(account.fields.region);
          const mount = (options: typeof sendOptions) =>
            withApprovals(
              liveOpenapiRouter({
                ...options,
                allowedOrigin: origin,
                baseUrl: origin,
                cache,
                fetch,
                signal,
                account: { ...account, fields: { ...account.fields, user: "api" } },
              }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            );
          return router(
            {
              send: mount(sendOptions),
              validate: mount(validateOptions),
              inspect: mount(inspectOptions),
              optimize: mount(optimizeOptions),
            },
            { title: "Mailgun", description: "Mailgun account." },
          );
        },
        { signal },
      ),
      {
        title: "Mailgun",
        description:
          "Mailgun. send: messages, domains, routes, webhooks, templates, mailing lists, suppressions, events, stats, IPs, keys, subaccounts. validate: single and bulk email validation. inspect: email preview, accessibility and analysis. optimize: deliverability, blocklist and spam trap monitoring, inbox placement, DMARC.",
        instructions:
          "The account's region (us or eu) selects the Mailgun API host; use eu if your domains were created in the EU region.",
        icons,
      },
    ),
  }),
);
