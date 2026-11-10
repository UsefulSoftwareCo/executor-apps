# Tisane Labs

Natural language analysis with Tisane: problematic-content and abuse detection, sentiment, entities, topics and phrase structure (`/parse`), language detection, semantic similarity, compound entity comparison, markup text extraction, translation (`/transform`), the supported-language list and inflection lookups.

**Interface:** OpenAPI. The tools come from Tisane's own published OpenAPI bundle, `https://docs.tisane.ai/_bundle/apis/tisane-api-short.yaml`, against `https://api.tisane.ai`.

**Auth:** a subscription key (primary or secondary) sent in the `Ocp-Apim-Subscription-Key` header. Create it by signing up at the Tisane Developer Portal (https://dev.tisane.ai) and copying a key from your profile. Tisane offers no OAuth.

**Approvals:** the analysis methods are POST requests, so Executor treats them as mutations and asks for approval on each call, although they change nothing.

**Known gaps:** the official bundle lists only `/lm/inflections` among the language model lookups. Operations such as `/senses`, `/values`, `/hypernyms`, `/hyponyms` and `/lm/family` are not in Tisane's published OpenAPI bundle or docs index, so they are not included.