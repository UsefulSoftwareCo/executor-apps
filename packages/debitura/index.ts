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
import { collectionPartnerOptions, options } from "./openapi.js";

const collectionPartner = defineProvider({
  name: "Debitura Collection Partner",
  hosts: ["collectionpartner-api.debitura.com"],
  auth: {
    apiKey: secrets({
      label: "Collection Partner API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://collectionpartner-api.debitura.com/me", {
      signal,
      headers: { XApiKey: account.fields.token },
    });
    await decodeJson(response, object({ id: string() }));
  },
});

const debitura = defineProvider({
  name: "Debitura",
  hosts: ["customer-api.debitura.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://customer-api.debitura.com/me", {
      signal,
      headers: { XApiKey: account.fields.token },
    });
    await decodeJson(response, object({ id: string() }));
  },
});

export default defineApp(
  { user: { accounts: { debitura: debitura.many(), collectionPartner: collectionPartner.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        customer: await accountRouter(
          user?.accounts.debitura ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
        collectionPartner: await accountRouter(
          user?.accounts.collectionPartner ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...collectionPartnerOptions, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
      },
      {
        title: "Debitura",
        description: "International debt collection with Debitura: submit and track cases, check coverage, manage divisions, payments, tasks and webhooks, plus the Collection Partner API for partners.",
        icons,
      },
    ),
  }),
);
