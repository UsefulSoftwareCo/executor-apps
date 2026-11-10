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
import { options } from "./openapi.js";

const uploadpost = defineProvider({
  name: "Upload-Post",
  hosts: ["api.upload-post.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.upload-post.com/api/uploadposts/me", {
      signal,
      headers: { Authorization: `Apikey ${account.fields.token}` },
    });
    if (!response.ok) throw new Error(`Upload-Post rejected the API key (${response.status})`);
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { uploadpost: uploadpost.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.uploadpost ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Upload-Post",
        description:
          "Publish and schedule videos, photos, text and documents to TikTok, Instagram, YouTube, LinkedIn, X and more; manage the queue, profiles, analytics, comments and DMs.",
        icons,
      },
    ),
  }),
);
