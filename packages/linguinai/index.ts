import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://api.linguin.ai/v2";

const linguin = defineProvider({
  name: "Linguin AI",
  hosts: ["api.linguin.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /v2/status is free: it reports quota and does not count as a detection.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/status`, {
      signal,
      headers: { authorization: `Bearer ${account.fields.token}`, accept: "application/json" },
    });
    await decodeJson(
      response,
      object({ status: object({ detections_today: number(), daily_limit: number(), remaining_today: number() }) }),
    );
    return {};
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = { authorization: `Bearer ${token}`, accept: "application/json" };
  return {
    get: async (path: string, authenticated = true) =>
      decodeJson(await fetcher(`${base}${path}`, { signal, ...(authenticated ? { headers } : {}) }), json()),
    post: async (path: string, q: string | readonly string[]) =>
      decodeJson(
        await fetcher(`${base}${path}`, {
          method: "POST",
          signal,
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify({ q }),
        }),
        json(),
      ),
  };
}

// The detection endpoints are POSTs, but they only analyse text and change nothing, so they are queries.
export default defineApp(
  { user: { accounts: { linguin: linguin.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.linguin ?? [],
        (account) => {
          const c = client(account.fields.token, fetch, signal);
          return router({
            detectLanguage: query(
              {
                description:
                  "Detect the language(s) of one text. Returns candidates as { lang, confidence } with ISO 639-1 (or 639-2) codes. Counts as one detection against the daily quota.",
                input: object({ text: string({ minLength: 1 }) }),
              },
              async (_ctx, { text }) => c.post("/detect/language", text),
            ),
            detectLanguages: query(
              {
                description:
                  "Detect the language(s) of several texts. Results come back in input order. Fails as a whole, with no partial detections, if the daily quota cannot cover every text. Check getAccountStatus before large batches.",
                input: object({ texts: array(string({ minLength: 1 })) }),
              },
              async (_ctx, { texts }) => c.post("/bulk_detect/language", texts),
            ),
            checkProfanity: query(
              {
                description:
                  "Score one English text for profanity, from 0 (clean) to 1 (profane). English only. Counts as one detection against the daily quota.",
                input: object({ text: string({ minLength: 1 }) }),
              },
              async (_ctx, { text }) => c.post("/detect/profanity", text),
            ),
            checkProfanityBatch: query(
              {
                description:
                  "Score several English texts for profanity. Scores come back in input order. Fails as a whole if the daily quota cannot cover every text.",
                input: object({ texts: array(string({ minLength: 1 })) }),
              },
              async (_ctx, { texts }) => c.post("/bulk_detect/profanity", texts),
            ),
            getAccountStatus: query(
              {
                description:
                  "Today's detections, the daily limit and the remaining quota. -1 means unlimited.",
                input: object({}),
              },
              async () => c.get("/status"),
            ),
            listSupportedLanguages: query(
              {
                description: "Supported language codes with their English name and native names or aliases.",
                input: object({}),
              },
              async () => c.get("/languages", false),
            ),
          });
        },
        { signal },
      ),
      {
        title: "Linguin AI",
        description:
          "Detect the language of text and score English text for profanity, one at a time or in bulk, and check your daily detection quota.",
        icons,
      },
    ),
  }),
);
