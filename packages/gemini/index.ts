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

const UserInfo = object({ sub: string() });

const gemini = defineProvider({
  name: "Gemini",
  hosts: ["generativelanguage.googleapis.com", "openidconnect.googleapis.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
    // Google has no dynamic client registration: the connect page asks for a Google Cloud OAuth client.
    oauth: oauth2({
      discover: "https://accounts.google.com",
      scopes: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/generative-language.retriever",
      ],
      authorizationParams: { access_type: "offline", prompt: "consent" },
    }),
  },
  async health({ account, fetch, signal }) {
    if (account.method === "oauth") {
      const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        signal,
        headers: { Authorization: `Bearer ${account.fields.access_token}` },
      });
      const me = await decodeJson(response, UserInfo);
      return { accountInfo: { externalId: me.sub } };
    }
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1", {
      signal,
      headers: { "x-goog-api-key": account.fields.apiKey },
    });
    if (!response.ok) {
      throw new Error(`Google rejected the API key (${response.status}). Check it and that the Gemini API is enabled.`);
    }
  },
});

export default defineApp(
  { user: { accounts: { gemini: gemini.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gemini ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Gemini",
        description:
          "Google Gemini API: generate text and multimodal content, embeddings, token counts, files, cached contents, batches, tuned models, file search stores and Veo/Imagen predictions.",
        icons,
      },
    ),
  }),
);
