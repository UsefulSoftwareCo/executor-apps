import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://artificialanalysis.ai/api/v2";

const artificialanalysis = defineProvider({
  name: "Artificial Analysis",
  hosts: ["artificialanalysis.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The API has no account endpoint; a media leaderboard is the cheapest authenticated read.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/data/media/text-to-speech`, {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

const Query = record(json()).optional();

const search = (params: Record<string, unknown> | undefined) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null) continue;
    out.set(key, String(value));
  }
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const get = (description: string, path: string, params: string, account: Account, signal: AbortSignal) =>
  query(
    { description: `${description} Query parameters go in "query": ${params}.`, input: object({ query: Query }) },
    async ({ fetch }, input) =>
      decodeJson(
        await fetch(`${base}${path}${search(input.query as Record<string, unknown> | undefined)}`, {
          signal,
          headers: { "x-api-key": account.fields.token },
        }),
        json(),
      ),
  );

const tools = (account: Account, signal: AbortSignal) => {
  const media = (kind: string, what: string, params: string) =>
    get(`List ranked ${what} models with arena ELO scores, ranks and metadata.`, `/data/media/${kind}`, params, account, signal);
  return router({
    llms: router({
      models: get(
        "List LLMs with benchmark scores (Artificial Analysis Intelligence, Coding and Math indices, evaluations), pricing, and median output speed and latency.",
        "/data/llms/models",
        "none documented (speed and latency use prompt_length=medium, 1k input tokens)",
        account,
        signal,
      ),
    }),
    media: router({
      textToImage: media("text-to-image", "text-to-image", "include_categories=true adds per-category rankings"),
      imageEditing: media("image-editing", "image-editing", "none"),
      textToSpeech: media("text-to-speech", "text-to-speech", "none"),
      textToVideo: media("text-to-video", "text-to-video", "include_categories=true adds per-category rankings"),
      imageToVideo: media("image-to-video", "image-to-video", "include_categories=true adds per-category rankings"),
    }),
    critpt: router({
      evaluate: mutation(
        {
          description:
            "Submit generated solutions to the CritPt physics benchmark for grading. Needs approved CritPt access (403 otherwise) and is limited to 10 requests per 24 hours. submissions must cover every problem in the public set.",
          input: object({
            submissions: array(
              object({
                problem_id: string(),
                generated_code: string(),
                model: string(),
                generation_config: json(),
                messages: json().optional(),
              }),
            ),
            batch_metadata: json(),
          }),
          approval: always(),
        },
        async ({ fetch }, input) =>
          decodeJson(
            await fetch(`${base}/critpt/evaluate`, {
              method: "POST",
              signal,
              headers: { "x-api-key": account.fields.token, "content-type": "application/json" },
              body: JSON.stringify(input),
            }),
            json(),
          ),
      ),
    }),
  });
};

export default defineApp({ user: { accounts: { artificialanalysis: artificialanalysis.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.artificialanalysis ?? [], (account) => tools(account, signal), { signal }), {
    title: "Artificial Analysis",
    description:
      "Independent AI benchmarks from Artificial Analysis: LLM intelligence, coding and math indices, pricing, speed and latency, plus image, video and speech arena rankings.",
    instructions:
      "The free data API allows 1,000 requests per day: reuse results instead of re-calling. Attribution to https://artificialanalysis.ai/ is required when showing this data.",
    icons,
  }),
}));
