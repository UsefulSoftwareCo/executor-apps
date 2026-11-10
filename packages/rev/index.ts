import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import {
  alignmentOptions,
  asynchronousOptions,
  customVocabularyOptions,
  languageIdentificationOptions,
  sentimentAnalysisOptions,
  topicExtractionOptions,
} from "./openapi.js";

const rev = defineProvider({
  name: "Rev AI",
  hosts: ["api.rev.ai"],
  auth: {
    apiKey: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.rev.ai/speechtotext/v1/account", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    // The spec's GetAccount schema declares no required fields, so tolerate a missing email.
    const body = await decodeJson(response, record(json()));
    const email = typeof body["email"] === "string" ? body["email"] : "Rev AI account";
    return { accountInfo: { externalId: email, displayName: email } };
  },
});

export default defineApp(
  { user: { accounts: { rev: rev.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.rev ?? [],
        (account) => {
          const mount = (options: Parameters<typeof liveOpenapiRouter>[0] extends infer O ? Omit<O & object, "cache" | "fetch" | "signal" | "account"> : never) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              transcription: mount(asynchronousOptions),
              customVocabulary: mount(customVocabularyOptions),
              topicExtraction: mount(topicExtractionOptions),
              sentimentAnalysis: mount(sentimentAnalysisOptions),
              languageIdentification: mount(languageIdentificationOptions),
              alignment: mount(alignmentOptions),
            },
            { title: "Rev AI", description: "Rev AI account." },
          );
        },
        { signal },
      ),
      {
        title: "Rev AI",
        description:
          "Rev AI speech-to-text. transcription: jobs, transcripts, captions, summaries, translations. customVocabulary, topicExtraction, sentimentAnalysis, languageIdentification, alignment: companion APIs.",
        icons,
      },
    ),
  }),
);
