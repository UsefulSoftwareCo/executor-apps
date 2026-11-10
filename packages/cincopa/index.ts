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

const cincopa = defineProvider({
  name: "Cincopa",
  hosts: ["api.cincopa.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // ping.json validates the token and answers 403 for an invalid one.
  async health({ account, fetch, signal }) {
    const url = new URL("https://api.cincopa.com/v2/ping.json");
    url.searchParams.set("api_token", account.fields.token);
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, object({}));
  },
});

// These GET operations change state or mint credentials, so they need approval like a mutation: the live-stream
// operations create, start, stop, reset or delete streams; general.getTemp mints a temporary API token with chosen
// permissions; upload.uploadGetUploadToken mints an invite upload token; assets.assetGetUploadUrl generates an upload
// target. gallery.galleryDownload only returns a zip link for content the token can already read, so it is left ungated.
const liveMutations = new Set([
  "live.liveCreate",
  "live.liveStart",
  "live.liveStop",
  "live.liveReset",
  "live.liveDelete",
  "general.getTemp",
  "upload.uploadGetUploadToken",
  "assets.assetGetUploadUrl",
]);

export default defineApp(
  { user: { accounts: { cincopa: cincopa.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cincopa ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            tool.kind === "mutation" || liveMutations.has(name) ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Cincopa",
        description: "Manage Cincopa media: galleries, assets, uploads, portals, webhooks and live streams.",
        icons,
      },
    ),
  }),
);
