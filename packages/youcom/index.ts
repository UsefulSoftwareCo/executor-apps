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
import { apis } from "./openapi.js";

const youcom = defineProvider({
  name: "You.com",
  hosts: ["api.you.com", "ydc-index.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Account balance is a read-only call any key can make.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.you.com/v1/billing/account_balance", {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { youcom: youcom.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.youcom ?? [],
        (account) => {
          const mount = (options: (typeof apis)[keyof typeof apis]) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              search: mount(apis.search),
              contents: mount(apis.contents),
              answer: mount(apis.answer),
              research: mount(apis.research),
              financeResearch: mount(apis.financeResearch),
              billing: mount(apis.billing),
              images: mount(apis.images),
            },
            { title: "You.com", description: "You.com account." },
          );
        },
        { signal },
      ),
      {
        title: "You.com",
        description:
          "You.com web intelligence for agents. search: real-time web and news results. contents: extract page content. answer: cited answers. research: deep cited research tasks. financeResearch: finance research. images: image search. billing: account balance.",
        icons,
      },
    ),
  }),
);
