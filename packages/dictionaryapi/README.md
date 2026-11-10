# Merriam-Webster Dictionary API

Looks up words in Merriam-Webster's Dictionary API: definitions, pronunciations, etymologies, synonyms and antonyms. Supported references are Collegiate Dictionary, Collegiate Thesaurus, Learner's, Medical, Spanish-English, Elementary (`sd2`), Intermediate (`sd3`) and School (`sd4`) dictionaries, and the Intermediate Thesaurus (`ithesaurus`).

Interface: hand-written tool over the vendor's JSON API, `https://www.dictionaryapi.com/api/v3/references/{reference}/json/{word}` (docs: https://dictionaryapi.com/products/json). Merriam-Webster publishes no OpenAPI document or official MCP server.

Auth: API key only. Register at https://dictionaryapi.com/register/index and request a key for the reference you want; each key is issued for specific references (at most two). The key travels as the `key` query parameter, which is the only method the API documents. Add one account per reference, entering the reference name (`collegiate`, `thesaurus`, `learners`, `medical`, `spanish`, `sd2`, `sd3`, `sd4`, `ithesaurus`) and the key. There is no OAuth.

Known gaps: one `lookup` tool per account (the API has a single endpoint). Entry text keeps Merriam-Webster's `{token}` markup. Audio and artwork are linked by URL pattern in the entries but not fetched. Health makes no network call because the API has no account endpoint and lookups count against a daily quota.
