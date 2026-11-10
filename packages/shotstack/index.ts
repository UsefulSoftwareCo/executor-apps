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
import { editOptions, ingestOptions, serveOptions } from "./openapi.js";

const environmentOf = (account: { fields: { environment: string } }) => {
  const value = account.fields.environment.trim().toLowerCase();
  if (value !== "v1" && value !== "stage") throw new Error('Environment must be "v1" (production) or "stage" (sandbox).');
  return value;
};

const shotstack = defineProvider({
  name: "Shotstack",
  hosts: ["api.shotstack.io"],
  auth: {
    apiKey: secrets({
      label: "API key and environment",
      fields: object({
        environment: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  // Keys are per environment. Listing templates is a cheap read every key can make.
  async health({ account, fetch, signal }) {
    const response = await fetch(`https://api.shotstack.io/edit/${environmentOf(account)}/templates`, {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { shotstack: shotstack.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.shotstack ?? [],
        (account) => {
          const env = environmentOf(account);
          const mount = (options: typeof editOptions) =>
            withApprovals(
              liveOpenapiRouter({
                ...options,
                baseUrl: options.baseUrl.replace("/v1", `/${env}`),
                cache,
                fetch,
                signal,
                account,
              }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            );
          return router(
            { edit: mount(editOptions), serve: mount(serveOptions), ingest: mount(ingestOptions) },
            { title: "Shotstack", description: "Shotstack APIs." },
          );
        },
        { signal },
      ),
      {
        title: "Shotstack",
        description:
          "Programmatic video, image and audio. edit: render edits, templates, probe media, AI generation. serve: hosted assets. ingest: upload and transform source media.",
        icons,
      },
    ),
  }),
);
