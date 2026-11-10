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

const description =
  "Stedi healthcare EDI. healthcare: real-time eligibility checks and 837 claim submission. claims: claim validation, creation, attachments and lifecycle. batchEligibility: batch eligibility. enrollment: transaction enrollment. payers: payer directory search. eventDestinations: webhook and event destinations. core: EDI transactions and executions.";

const stedi = defineProvider({
  name: "Stedi",
  hosts: [
    "healthcare.us.stedi.com",
    "claims.us.stedi.com",
    "manager.us.stedi.com",
    "enrollments.us.stedi.com",
    "payers.us.stedi.com",
    "events.us.stedi.com",
    "core.us.stedi.com",
  ],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://payers.us.stedi.com/2024-04-01/payers?pageSize=1", {
      signal,
      headers: { Authorization: account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { stedi: stedi.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.stedi ?? [],
        (account) => {
          const mount = (options: (typeof apis)[keyof typeof apis]) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              healthcare: mount(apis.healthcare),
              claims: mount(apis.claims),
              batchEligibility: mount(apis.batchEligibility),
              enrollment: mount(apis.enrollment),
              payers: mount(apis.payers),
              eventDestinations: mount(apis.eventDestinations),
              core: mount(apis.core),
            },
            { title: "Stedi", description },
          );
        },
        { signal },
      ),
      { title: "Stedi", description, icons },
    ),
  }),
);
