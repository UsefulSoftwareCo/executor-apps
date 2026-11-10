# CallerAPI

Caller ID and telecom fraud intelligence from CallerAPI: spam score and business identity for a phone number, optional carrier (HLR) data, porting date and porting history, and the enterprise daily spam-report webhooks.

**Interface:** hand-written tools over CallerAPI's REST API at `https://api.callerapi.com`. CallerAPI publishes per-endpoint OpenAPI fragments only on its Apidog docs site (https://docs.callerapi.com, index at https://docs.callerapi.com/llms.txt), no single document, so the endpoints are written by hand from those pages and the official repo https://github.com/dimondevceo/caller-id-api. 28 tools:

- Top level: `account`, `lookup`, `ported`, `portingHistory`.
- `fraud`: `onlinePresence`, `kyc`.
- `signers`: `reputation`, `ranked` (STIR/SHAKEN signer reputation).
- `spamReports`: `daily`, `csvSnapshot`, `subscriptions`, `subscribe`, `unsubscribe`, `testWebhook`, `dispatch`.
- `businessCallerId`: `verify`, `logo`, `announce`.
- `voiceFirewall`: `capabilities`, `categories`, `personas`, `scan`, `sessions`, `session`, `twilioFilterUrl`, `telnyxFilterUrl`, `twilioHoneypotUrl`, `telnyxHoneypotUrl`.

Free or single-lookup reads are queries. Anything that mutates, creates a session, scores audio, sends personal data (`kyc`) or spends credits as a side effect (`scan`, `verify`, `announce`) requires approval. The four `*Url` tools build the Twilio/Telnyx voice URL locally with the placeholder `YOUR_KEY` (the docs put the key in the `key` query parameter); they make no request and never reveal your key.

**Host:** the docs' server URL is `https://api.callerapi.com`, while the README samples and the official repo use `https://callerapi.com/api`. Verified on 2026-10-12, without credentials, that both hosts resolve and answer HTTP 401 for `/api/me`, `/api/lookup/{phone}`, `/api/ported/{phone}`, `/api/webhooks/complaints/subscriptions`, `/api/voice/capabilities` and `/api/signer-reputation`. The package uses `api.callerapi.com`; the health check calls `GET /api/me` there.

**Auth:** API key. Create it in the dashboard at https://callerapi.com/dashboard. It is sent in the `x-auth` header (the repo writes `X-Auth`; headers are case-insensitive). Credentials go to `api.callerapi.com` and `callerapi.com`. CallerAPI has no OAuth. The Business Caller ID `announce` call uses a separate publish token (header `X-BCID-Publish-Token`, shown once in the dashboard); store it in the optional `publishToken` field of the connection.

**Gaps:** the spam-reports tools are enterprise-only (the CSV snapshot needs an Enterprise+ or Partner plan). Not covered: the voice firewall WebSocket streams (live filter and honeypot), the GET TwiML preview endpoints, multipart audio upload for `scan` (use base64), mobile SDK and data-partner uploads. Lookups cost credits; `ported`, `portingHistory`, `onlinePresence` and `kyc` are billed per lookup.
