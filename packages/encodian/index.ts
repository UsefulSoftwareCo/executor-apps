import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  boolean,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { apis } from "./openapi.js";

const encodian = defineProvider({
  name: "Encodian",
  hosts: ["api.apps-encodian.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Reading the subscription status spends no credits.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.apps-encodian.com/api/v1/General/GetSubscriptionStatus", {
      signal,
      headers: { "X-ApiKey": account.fields.token },
    });
    await decodeJson(response, object({ subscriptionEnabled: boolean(), subscriptionLevel: string() }));
  },
});

export default defineApp(
  { user: { accounts: { encodian: encodian.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.encodian ?? [],
        (account) => {
          const mount = (options: (typeof apis)[keyof typeof apis]) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              word: mount(apis.word),
              pdf: mount(apis.pdf),
              excel: mount(apis.excel),
              powerpoint: mount(apis.powerpoint),
              image: mount(apis.image),
              barcode: mount(apis.barcode),
              conversion: mount(apis.conversion),
              general: mount(apis.general),
              utilities: mount(apis.utilities),
              sign: mount(apis.sign),
            },
            { title: "Encodian", description: "Encodian Flowr document actions." },
          );
        },
        { signal },
      ),
      {
        title: "Encodian",
        description:
          "Encodian Flowr document automation. word, pdf, excel, powerpoint: create, edit, merge, split, secure and extract from documents. image, barcode: image processing and barcode read/write. conversion: convert between document formats. general: email, archives, AI actions, subscription status. utilities: text, JSON, hashing, HTTP and other helpers. sign: electronic signing envelopes (needs an Encodian Sign subscription). Every action spends Encodian credits.",
        icons,
      },
    ),
  }),
);
