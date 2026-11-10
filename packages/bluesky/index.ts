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
import { appOptions, chatOptions, ozoneOptions } from "./openapi.js";

const origin = "https://bsky.social";

type Fetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const createSession = async (fetch: Fetch, identifier: string, password: string, signal?: AbortSignal) => {
  const response = await fetch(`${origin}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  if (!response.ok) throw new Error(`Bluesky rejected the handle or app password (${response.status})`);
  return decodeJson(response, object({ accessJwt: string({ minLength: 1 }) }));
};

const bluesky = defineProvider({
  name: "Bluesky",
  hosts: ["bsky.social"],
  auth: {
    appPassword: secrets({
      label: "App password",
      fields: object({
        handle: string({ minLength: 1 }),
        appPassword: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    await createSession(fetch, account.fields.handle, account.fields.appPassword, signal);
  },
});

export default defineApp(
  { user: { accounts: { bluesky: bluesky.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bluesky ?? [],
        (account) => {
          // Bluesky has no long-lived bearer token: an app password is exchanged for a short-lived
          // access JWT, which this wrapper mints per session and puts on every request.
          let session: Promise<string> | undefined;
          const authed: Fetch = async (input, init) => {
            session ??= createSession(fetch, account.fields.handle, account.fields.appPassword, signal)
              .then((s) => s.accessJwt)
              .catch((error) => {
                session = undefined;
                throw error;
              });
            const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
            headers.set("Authorization", `Bearer ${await session}`);
            return fetch(input, { ...init, headers });
          };
          const mount = (options: typeof appOptions | typeof chatOptions | typeof ozoneOptions) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch: authed, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            { app: mount(appOptions), chat: mount(chatOptions), ozone: mount(ozoneOptions) },
            { title: "Bluesky", description: "Bluesky account tools." },
          );
        },
        { signal },
      ),
      {
        title: "Bluesky",
        description:
          "Bluesky and the AT Protocol: read feeds and profiles, post, like, follow, manage lists, send chat messages and run repo and moderation calls.",
        icons,
      },
    ),
  }),
);
