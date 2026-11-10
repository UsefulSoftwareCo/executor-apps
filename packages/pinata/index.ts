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
import { ipfsOptions, uploadsOptions, v3Options, x402Options } from "./openapi.js";

const pinata = defineProvider({
  name: "Pinata",
  hosts: ["api.pinata.cloud", "uploads.pinata.cloud"],
  auth: {
    apiKey: secrets({
      label: "API key (JWT)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.pinata.cloud/data/testAuthentication", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ message: string() }));
  },
});

export default defineApp(
  { user: { accounts: { pinata: pinata.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pinata ?? [],
        (account) => {
          const mount = (options: Parameters<typeof liveOpenapiRouter>[0] extends infer O ? Omit<O & object, "cache" | "fetch" | "signal" | "account"> : never) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              files: mount(v3Options),
              ipfs: mount(ipfsOptions),
              uploads: mount(uploadsOptions),
              x402: mount(x402Options),
            },
            { title: "Pinata", description: "Pinata account." },
          );
        },
        { signal },
      ),
      {
        title: "Pinata",
        description:
          "Pinata IPFS. files: V3 files, groups, gateways, signed upload URLs, API keys, vectors. ipfs: legacy pinning and pin-by-CID API. uploads: file uploads and upload sessions. x402: payment instructions.",
        icons,
      },
    ),
  }),
);
