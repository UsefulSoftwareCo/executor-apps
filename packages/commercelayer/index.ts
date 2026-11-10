import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options, originOf } from "./openapi.js";

// Commerce Layer access tokens are JWTs whose `organization.slug` claim names the organization (and so the API host)
// the credentials belong to. The token endpoint is shared by every organization. The vendor docs do not describe the
// claim; it is taken from the published @commercelayer/sdk 8.0.2 source (extractTokenData/baseURL), which builds
// https://{organization.slug}.commercelayer.io/api from it.
function organizationSlug(token: string): string {
  const payload = token.split(".")[1];
  if (payload === undefined) throw new Error("Commerce Layer access token is not a JWT.");
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  const slug: unknown = (JSON.parse(json) as { organization?: { slug?: unknown } }).organization?.slug;
  if (typeof slug !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(slug))
    throw new Error("Commerce Layer access token has no organization slug.");
  return slug;
}

const commercelayer = defineProvider({
  name: "Commerce Layer",
  hosts: ["*.commercelayer.io"],
  auth: {
    // An "integration" API credential (client id + client secret), created in the Commerce Layer dashboard:
    // https://docs.commercelayer.io/core/authentication/client-credentials
    // The credential's role fixes its permissions; an optional market scope is not requested here.
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://auth.commercelayer.io/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const slug = organizationSlug(account.fields.access_token);
    const response = await fetch(`${originOf(slug)}/api/organization`, {
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.access_token}`,
        Accept: "application/vnd.api+json",
      },
    });
    // The organization slug is the stable identity; the vendor schema does not require `id` on this resource.
    await decodeJson(response, object({ data: object({ type: string() }) }));
    return { accountInfo: { externalId: slug, displayName: slug } };
  },
});

export default defineApp(
  { user: { accounts: { commercelayer: commercelayer.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.commercelayer ?? [],
        (account) => {
          const origin = originOf(organizationSlug(account.fields.access_token));
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/api`,
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
        title: "Commerce Layer",
        description:
          "Orders, customers, SKUs, prices, stock, shipments, payments, promotions and every other resource of the Commerce Layer Core API.",
        instructions:
          "Requests and responses are JSON:API. What a call may do depends on the role of the API credential in the Commerce Layer dashboard; a 403 means the role lacks that permission.",
        icons,
      },
    ),
  }),
);
