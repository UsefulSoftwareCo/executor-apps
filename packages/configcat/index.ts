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
import { options, scimOptions } from "./openapi.js";

const configcat = defineProvider({
  name: "ConfigCat",
  hosts: ["api.configcat.com"],
  auth: {
    apiKey: secrets({
      label: "Public API credentials",
      fields: object({
        username: string({ minLength: 1 }),
        password: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.configcat.com/v1/me", {
      signal,
      headers: {
        Authorization: `Basic ${btoa(`${account.fields.username}:${account.fields.password}`)}`,
        Accept: "application/json",
      },
    });
    await decodeJson(response, object({ email: string() }));
  },
});

const scim = defineProvider({
  name: "ConfigCat SCIM",
  hosts: ["scim-api.configcat.com"],
  auth: {
    scim: secrets({
      label: "SCIM token (Authentication & Provisioning page) and organization ID",
      fields: object({ token: string({ minLength: 1 }), organizationId: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `https://scim-api.configcat.com/v2/${encodeURIComponent(account.fields.organizationId)}/ServiceProviderConfig`,
      { signal, headers: { Authorization: `Bearer ${account.fields.token}` } },
    );
    if (!response.ok) throw new Error(`ConfigCat SCIM health check failed (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { configcat: configcat.many(), scim: scim.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: await accountRouter(
          user?.accounts.configcat ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
        scim: await accountRouter(
          user?.accounts.scim ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...scimOptions, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
      },
      {
        title: "ConfigCat",
        description:
          "Manage ConfigCat feature flags: products, configs, environments, settings, targeting rules, segments, tags and members, plus SCIM user and group provisioning.",
        icons,
      },
    ),
  }),
);
