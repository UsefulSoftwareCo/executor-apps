import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const Me = object({ id: string(), name: string() });

const huggingface = defineProvider({
  name: "Hugging Face",
  hosts: ["huggingface.co"],
  auth: {
    token: secrets({
      label: "User access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Users create an OAuth app at huggingface.co/settings/applications/new.
    oauth: oauth2({
      discover: "https://huggingface.co",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [
        "openid",
        "profile",
        "read-repos",
        "write-repos",
        "manage-repos",
        "read-collections",
        "write-collections",
        "write-discussions",
        "inference-api",
        "read-endpoints",
        "write-endpoints",
        "jobs",
        "webhooks",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://huggingface.co/api/whoami-v2", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await decodeJson(response, Me);
    return {
      accountInfo: {
        externalId: me.id,
        username: me.name,
        profileUrl: `https://huggingface.co/${me.name}`,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { huggingface: huggingface.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.huggingface ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Hugging Face",
        description:
          "Models, datasets, Spaces, repos, collections, discussions, Inference Providers and the rest of the Hugging Face Hub API.",
        icons,
      },
    ),
  }),
);
