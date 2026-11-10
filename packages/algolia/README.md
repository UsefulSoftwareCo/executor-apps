# Algolia

All of Algolia in one package: search and browse indices, add, update and delete records, configure settings, synonyms and rules, manage API keys, dictionaries, clusters and user IDs, get Recommend results, read Analytics, run A/B tests, send Insights events, check cluster status, manage Data Ingestion connectors, Personalization and Query Suggestions.

**Interface:** OpenAPI, from Algolia's official bundled documents in https://github.com/algolia/api-clients-automation/tree/main/specs/bundled (`https://raw.githubusercontent.com/algolia/api-clients-automation/main/specs/bundled/<name>.yml`). Algolia splits its API into several specs on different hosts; each is mounted under its own key in one router (233 tools, none skipped):

| Key | Spec | Tools | Origin |
| --- | --- | --- | --- |
| `search` | `search.yml` | 78 | `https://<APPLICATION_ID>.algolia.net` |
| `recommend` | `recommend.yml` | 11 | `https://<APPLICATION_ID>.algolia.net` |
| `analytics` | `analytics.yml` | 30 | `https://analytics.algolia.com` (global; covers `us` and `de`) |
| `abtesting` | `abtesting.yml` | 11 | `https://analytics.algolia.com` (global; v2 operations, deprecated upstream in favour of v3 but still published) |
| `insights` | `insights.yml` | 7 | `https://insights.algolia.io` |
| `monitoring` | `monitoring.yml` | 14 | `https://status.algolia.com` (most operations are public; server inventory and infrastructure metrics use your credentials and need the Monitoring API key on plans that include it) |
| `ingestion` | `ingestion.yml` | 61 | `https://data.<region>.algolia.com` |
| `personalization` | `personalization.yml` | 9 | `https://personalization.<region>.algolia.com` |
| `querySuggestions` | `query-suggestions.yml` | 12 | `https://query-suggestions.<region>.algolia.com` |

**Auth:** API key. Enter your Application ID, your region (`us` or `eu`) and an API key. The Application ID and key are sent as `x-algolia-application-id` and `x-algolia-api-key` to every host; the region only selects the host for `ingestion`, `personalization` and `querySuggestions` (the other APIs ignore it). Find the ID and keys in the Algolia dashboard under Settings, API Keys (https://dashboard.algolia.com/account/api-keys). Use a key with only the ACLs the tools you need require: the Admin API key is required for settings, keys and other management calls, `analytics` for analytics and A/B test reads, `search` for recommendations and Insights events, `editSettings` for A/B tests, Recommend rules and Query Suggestions changes, and `recommendation` for Personalization. Algolia has no OAuth for customer applications.

**Approvals:** POST operations that only read or dry-run run without approval (this is set with the `kinds` override because the generator would otherwise treat every POST as a mutation): in `search` `searchSingleIndex`, `search`, `searchForFacetValues`, `browse`, `getObjects`, `searchSynonyms`, `searchRules`, `searchDictionaryEntries` and `searchUserIds`; in `recommend` `getRecommendations` and `searchRecommendRules`; in `analytics` the four `queryPatterns*` operations; in `abtesting` `estimateABTest`; in `ingestion` the `search*`, `validateSource*` and `tryTransformation*` operations. Every other non-GET operation (writes, deletes, `customPost`, `customPut`, `customDelete`) asks for approval.

**Known gaps:** the region field is required even if you only use the APIs that do not need it. Applications hosted in regions other than `us` and `eu` for the regional APIs are not supported.
