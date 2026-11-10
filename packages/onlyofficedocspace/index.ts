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
import { options } from "./openapi.js";


// ONLYOFFICE DocSpace portals are cloud or self-hosted, so the portal URL is part of the account. The provider declares
// no `hosts`: instance domains are arbitrary and the framework only accepts static lists, so the token
// is not host-restricted by the framework. Mitigations: tool calls pin allowedOrigin to the account's own
// instance origin, and instanceBase requires https. The health fetch is not pinned beyond that.
// Same pattern as the other self-hosted packages in this batch (gitea, metabase, unleash).
// Sub-path installs (https://example.com/btcpay) keep their path.
function instanceBase(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your DocSpace portal URL, for example https://docspace.example.com.");
  }
  if (url.protocol !== "https:") throw new Error("The DocSpace portal must use https.");
  if (url.search !== "" || url.hash !== "") throw new Error("The DocSpace portal URL must not include a query or fragment.");
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

const onlyofficedocspace = defineProvider({
  name: "ONLYOFFICE DocSpace",
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        instance: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = instanceBase(account.fields.instance);
    const response = await fetch(`${base}/api/2.0/people/@self`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ response: object({ id: string() }) }));
    return { accountInfo: { externalId: `${base}:${me.response.id}`, displayName: base } };
  },
});

export default defineApp(
  { user: { accounts: { onlyofficedocspace: onlyofficedocspace.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.onlyofficedocspace ?? [],
        (account) => {
          const base = instanceBase(account.fields.instance);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: new URL(base).origin,
              baseUrl: base,
              cache,
              fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "ONLYOFFICE DocSpace",
        description:
          "Rooms, files, folders, users, groups, sharing and portal settings on an ONLYOFFICE DocSpace portal.",
        icons,
      },
    ),
  }),
);
