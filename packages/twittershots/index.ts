import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.twittershots.com";

const twittershots = defineProvider({
  name: "TwitterShots",
  hosts: ["api.twittershots.com"],
  auth: {
    // Keys are created at https://twittershots.com/settings/keys and sent in the X-API-KEY header.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The usage endpoint is free and answers 401/403 for a bad key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/api/v1/usage`, {
      signal,
      headers: { "X-API-KEY": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({ remaining: number(), limit: number() }));
  },
});

async function failure(response: Response): Promise<never> {
  const text = await response.text();
  throw new Error(`TwitterShots answered ${response.status}: ${text.slice(0, 500)}`);
}

export default defineApp(
  { user: { accounts: { twittershots: twittershots.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.twittershots ?? [],
        (account) => {
          const headers = (accept: string) => ({ "X-API-KEY": account.fields.token, Accept: accept });
          return router({
            usage: query(
              { description: "Remaining and total API credits for this key. Free.", input: object({}) },
              async () => {
                const response = await fetch(`${base}/api/v1/usage`, { signal, headers: headers("application/json") });
                return decodeJson(response, object({ remaining: number(), limit: number() }));
              },
            ),
            screenshot: query(
              {
                description:
                  "Render a public post as an image and return a temporary hosted URL (returnType=url). Uses API credits; download the file promptly. width is numeric pixels (300-1000, default 410); height is auto or a numeric pixel value.",
                approval: always(),
                input: object({
                  tweetId: string({ minLength: 1 }),
                  format: string().optional(),
                  theme: string().optional(),
                  aspectRatio: string().optional(),
                  logo: string().optional(),
                  showFullText: boolean().optional(),
                  showTimestamp: boolean().optional(),
                  timeZoneOffset: string().optional(),
                  showViews: boolean().optional(),
                  showStats: boolean().optional(),
                  showMedia: boolean().optional(),
                  mediaLayout: string().optional(),
                  containerBackground: string().optional(),
                  backgroundImage: string().optional(),
                  containerPadding: number().optional(),
                  borderRadius: number().optional(),
                  width: number().optional(),
                  height: string().optional(),
                }),
              },
              async (_ctx, { tweetId, ...options }) => {
                const target = new URL(`${base}/api/v1/screenshot/${encodeURIComponent(tweetId)}`);
                target.searchParams.set("returnType", "url");
                for (const [key, value] of Object.entries(options)) {
                  if (value !== undefined) target.searchParams.set(key, String(value));
                }
                const response = await fetch(target.toString(), { signal, headers: headers("application/json") });
                const result = await decodeJson(
                  response,
                  object({ url: string(), format: string().optional(), tweetId: string().optional() }),
                );
                return result;
              },
            ),
            content: router({
              get: query(
                {
                  description: "Fetch one public post as Markdown. Uses API credits.",
                  approval: always(),
                  input: object({
                    tweetId: string({ minLength: 1 }),
                    includeStats: boolean().optional(),
                    includeMedia: boolean().optional(),
                    includeQuoted: boolean().optional(),
                  }),
                },
                async (_ctx, { tweetId, ...options }) => {
                  const target = new URL(`${base}/api/v1/content/${encodeURIComponent(tweetId)}`);
                  for (const [key, value] of Object.entries(options)) {
                    if (value !== undefined) target.searchParams.set(key, String(value));
                  }
                  const response = await fetch(target.toString(), { signal, headers: headers("text/markdown") });
                  if (!response.ok) return failure(response);
                  return { markdown: await response.text() };
                },
              ),
              bulk: query(
                {
                  description:
                    "Fetch up to 100 public posts as Markdown. Uses API credits; the cost per id is not documented (up to 100 ids per call). Check each result's success flag.",
                  approval: always(),
                  input: object({ tweetIds: array(string({ minLength: 1 })) }),
                },
                async (_ctx, { tweetIds }) => {
                  const response = await fetch(`${base}/api/v1/content/tweets`, {
                    method: "POST",
                    signal,
                    headers: { ...headers("application/json"), "Content-Type": "application/json" },
                    body: JSON.stringify({ tweetIds }),
                  });
                  return decodeJson(
                    response,
                    object({
                      results: array(object({ tweetId: string(), markdown: string().optional(), success: boolean() })),
                      total: number(),
                      successful: number(),
                      failed: number(),
                    }),
                  );
                },
              ),
            }),
          });
        },
        { signal },
      ),
      {
        title: "TwitterShots",
        description: "Render public X (Twitter) posts as screenshots, fetch post content as Markdown, and check API credits.",
        instructions:
          "Screenshot and content calls use API credits (bulk cost per id is not documented) and ask for approval. Screenshot always returns a temporary hosted URL, not image bytes. Post ids may be numeric or full status URLs for screenshots; content endpoints need numeric ids.",
        icons,
      },
    ),
  }),
);
