# Daily

Daily's video and audio platform: rooms, meeting tokens, recordings, transcripts, meetings and participants, presence, logs, webhooks, phone numbers, dial-in/dial-out, SIP trunks, live streaming and transcription control.

**Interface:** OpenAPI, Daily's official document at https://docs.daily.co/openapi.json (server `https://api.daily.co/v1`). Tools are generated live from it. Mutations require approval.

**Auth:** API key (Bearer token). Create it in the Daily dashboard under Developers > API keys (https://dashboard.daily.co/developers). The key is scoped to one Daily domain. Daily offers no user-created OAuth apps for the REST API.

**Known gaps:** The official document covers 50 paths; some newer endpoints in the docs (for example parts of SIP trunk management) may be absent from it.
