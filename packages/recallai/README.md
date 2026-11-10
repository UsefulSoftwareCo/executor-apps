# Recall.ai

Recall.ai meeting-bot infrastructure: create bots that join Zoom, Google Meet, Microsoft Teams and Webex calls, control them in the call (chat, audio, video, screenshare, recording), and read recordings, transcripts, participant events, meeting metadata, calendars (v1 and v2), Zoom OAuth apps and credentials, Google logins and usage.

## Interface

OpenAPI, 103 tools (61 mutations). Recall.ai publishes no single spec file, but every endpoint page at `https://docs.recall.ai/reference/<operationId>.md` embeds that operation's official OpenAPI 3.0.3 definition. `spec.json` is those 111 definitions merged unchanged (paths and components) into one document; it was assembled from the vendor's own docs. Regenerate it by fetching each page listed in `https://docs.recall.ai/llms.txt` and merging the JSON blocks.

## Auth

- **API key** (`secrets`): create it in the Recall.ai dashboard under API Keys. Enter the key and the region of the workspace that issued it (`us-east-1`, `us-west-2`, `eu-central-1` or `ap-northeast-1`). Requests go to `https://<region>.recall.ai` with `Authorization: Token <key>`; no other host receives the key.

Recall.ai has no OAuth for API access.

## Known gaps

- 8 operations that authenticate only with a calendar-user token (`x-recallcalendarauthtoken`, for example Get Calendar User and List Calendar Meetings) are skipped: they take a short-lived per-user token, not the account API key.
- Webhooks and the Desktop SDK runtime are outside the REST API and are not covered.
