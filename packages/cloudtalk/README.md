# CloudTalk

Cloud call center with CloudTalk: calls and recordings, contacts, agents and groups, campaigns, numbers, SMS, tags, notes, activities, blacklist, call flow analytics, CueCards, Conversation Intelligence (summaries, sentiment, topics, transcripts), VoiceAgents, knowledge bases and the Dialer (95 operations).

## Interface

CloudTalk's official OpenAPI 3.0.1 document, https://developers.cloudtalk.io/api-reference/openapi.json (REST API v1.7). The document spans four origins, so it is mounted four times, each keeping only the paths for its origin:

- `api`: `https://my.cloudtalk.io/api` (46 operations: calls, contacts, agents, groups, campaigns, numbers, SMS, tags, notes, activities, blacklist, countries, bulk contact actions, realtime statistics).
- `analytics`: `https://analytics-api.cloudtalk.io/api` (detailed call flow, 1 operation).
- `cuecards`: `https://platform-api.cloudtalk.io/api` (create CueCard, 1 operation).
- `ai`: `https://api.cloudtalk.io/v1` (Conversation Intelligence, VoiceAgents, knowledge bases, Dialer campaigns, scripts, surveys and exports, 47 operations).

Every mutation asks for approval. On the `api` origin CloudTalk uses PUT to create and POST to update (except `calls/create.json`); the tools follow the document. The rate limit is 60 requests per minute per company.

## Auth

API key only (HTTP Basic). In the CloudTalk dashboard open Account > Settings > API Keys (https://dashboard.cloudtalk.io/menu/account/settings/API-keys), create a key, and enter the Access Key ID and Access Key Secret. The same pair is used on every host. CloudTalk offers no OAuth for user-created apps. The connection check lists one agent from `my.cloudtalk.io`.

## Gaps

- The CloudTalk document is fetched live; if CloudTalk changes which origin an operation uses, update the path lists in `openapi.ts`.
- File upload (`knowledge-bases/files`) and recording download depend on how the host handles multipart and binary bodies.
