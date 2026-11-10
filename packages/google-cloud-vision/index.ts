import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  header,
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

const googleCloudVision = defineProvider({
  name: "Google Cloud Vision",
  hosts: ["vision.googleapis.com", "openidconnect.googleapis.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
      // Header placement keeps the key out of URLs and logs.
      request: ({ apiKey }) => header("x-goog-api-key", apiKey),
    }),
    // Google has no dynamic client registration: the connect page asks for a Google Cloud OAuth client.
    oauth: oauth2({
      discover: "https://accounts.google.com",
      scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/cloud-vision"],
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
    // Vision has no free read-only endpoint, so send an empty batch: Google rejects a bad key before looking at the body.
    const response = await fetch(account.url("https://vision.googleapis.com/v1/images:annotate"), {
      signal,
      method: "POST",
      headers: { ...account.headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ requests: [] }),
    });
    const text = await response.text();
    if (response.status === 400 && text.includes("API_KEY_INVALID")) {
      throw new Error("Google rejected the API key. Check it and that the Cloud Vision API is enabled.");
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Google rejected the API key (${response.status}). Enable the Cloud Vision API for its project.`);
    }
    if (!response.ok) {
      throw new Error(`Google Cloud Vision health check failed (${response.status}).`);
    }
  },
});

export default defineApp(
  { user: { accounts: { googleCloudVision: googleCloudVision.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.googleCloudVision ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Google Cloud Vision",
        description:
          "Analyse images and PDFs with Google Cloud Vision: labels, OCR, faces, landmarks, logos, safe search, web detection, and Product Search catalogs.",
        icons,
      },
    ),
  }),
);
