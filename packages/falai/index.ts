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
import { options, queueOptions } from "./openapi.js";

const falai = defineProvider({
  name: "fal.ai",
  hosts: ["api.fal.ai", "queue.fal.run"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Lists one model; works for any key permission preset.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.fal.ai/v1/models?limit=1", {
      signal,
      headers: { Authorization: `Key ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { falai: falai.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.falai ?? [],
        (account) => {
          const approve = <T extends Parameters<typeof withApprovals>[0]>(r: T) =>
            withApprovals(r, (tool) => (tool.kind === "mutation" ? always() : undefined));
          return router(
            {
              platform: approve(liveOpenapiRouter({ ...options, cache, fetch, signal, account })),
              queue: approve(liveOpenapiRouter({ ...queueOptions, cache, fetch, signal, account })),
            },
            { title: "fal.ai", description: "fal.ai account." },
          );
        },
        { signal },
      ),
      {
        title: "fal.ai",
        description:
          "Generative media on fal.ai. queue: submit a request to any model endpoint (image, video, audio), poll its status, fetch or cancel it. platform: search models, pricing and usage, API keys, assets, compute and serverless apps.",
        instructions:
          "To run a model, call queue.root.queueSubmit with endpoint_id (for example fal-ai/flux/dev; slashes are sent as-is) and the model's input as the body, then poll queue.requests.queueStatus and fetch queue.requests.queueResult. queueCancel cancels a request. Status, result and cancel take the endpoint id without a trailing subpath, as in the status_url returned by submit (fal-ai/flux for fal-ai/flux/dev). Use platform model search to find endpoint ids and their schemas.",
        icons,
      },
    ),
  }),
);
