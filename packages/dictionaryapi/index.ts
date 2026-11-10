import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  plain,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

// Each Merriam-Webster key is issued for specific references (at most two), so an account
// holds one key plus the reference it was issued for. Values are the URL path segments.
const references = [
  "collegiate",
  "thesaurus",
  "learners",
  "medical",
  "spanish",
  "sd2",
  "sd3",
  "sd4",
  "ithesaurus",
] as const;
type Reference = (typeof references)[number];
const isReference = (value: string): value is Reference => (references as readonly string[]).includes(value);

const dictionary = defineProvider({
  name: "Merriam-Webster Dictionary API",
  hosts: ["www.dictionaryapi.com"],
  auth: {
    apiKey: secrets({
      label: `API key and the reference it was issued for (reference: ${references.join(", ")})`,
      fields: object({
        reference: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  // The API has no account endpoint, so health does one lookup of a fixed word. An invalid key
  // is answered with a plain-text body rather than JSON, so a JSON decode failure signals a bad
  // key. This costs one quota-counted call per health run.
  async health({ account, fetch, signal }) {
    if (!isReference(account.fields.reference)) {
      throw new Error(`Unknown reference "${account.fields.reference}". Use one of: ${references.join(", ")}`);
    }
    const url = new URL(`https://www.dictionaryapi.com/api/v3/references/${account.fields.reference}/json/test`);
    url.searchParams.set("key", account.fields.token);
    await decodeJson(await fetch(url.toString(), { signal }), json());
  },
});

export default defineApp(
  { user: { accounts: { dictionary: dictionary.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dictionary ?? [],
        (account) => {
          const reference = account.fields.reference;
          if (!isReference(reference)) throw new Error(`Unknown reference "${reference}". Use one of: ${references.join(", ")}`);
          return router({
            lookup: query(
              {
                description: `Look up a word or phrase in the ${reference} reference. Returns entries (definitions, pronunciations, etymology, synonyms or antonyms depending on the reference) or, when nothing matches, an array of suggested spellings. Entry text uses {token} markup such as {bc} and {it}...{/it}.`,
                input: object({ word: string({ minLength: 1 }) }),
              },
              async (_ctx, { word }) => {
                const url = new URL(
                  `https://www.dictionaryapi.com/api/v3/references/${reference}/json/${encodeURIComponent(word)}`,
                );
                url.searchParams.set("key", account.fields.token);
                // Errors carry only the status, never the request URL, which holds the key.
                return decodeJson(await fetch(url.toString(), { signal }), json());
              },
            ),
          });
        },
        { signal },
      ),
      {
        title: "Merriam-Webster Dictionary API",
        description:
          "Merriam-Webster definitions, pronunciations, etymologies, synonyms and antonyms. Each API key covers specific references, so add one account per reference.",
        icons,
      },
    ),
  }),
);
