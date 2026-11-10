# Speechmatics

Speechmatics batch speech-to-text: create transcription jobs, list and inspect them, delete jobs, fetch transcripts and alignments, and read usage (7 tools, 2 of which are mutations that require approval).

Interface: OpenAPI. Speechmatics publishes its batch ASR REST API as a Swagger 2.0 document in its official docs repository, <https://raw.githubusercontent.com/speechmatics/docs/main/spec/batch.yaml>. The document declares no host, so the package builds the base URL from the account's region: `https://<region>.asr.api.speechmatics.com/v2`, with region one of `eu1`, `us1`, `au1` (all customers) or `eu2`, `us2` (enterprise failover), per <https://docs.speechmatics.com/get-started/authentication>. A job lives in the region that created it, so add one account per region you use.

Auth: API key. Enter the region and the API key. Create the key in the Speechmatics portal (Settings, API Keys) at <https://portal.speechmatics.com/>. It is sent as `Authorization: Bearer <key>`.

Known gaps: the real-time (WebSocket), Flow and text-to-speech APIs are not covered. Uploading audio goes through the multipart `POST /jobs` operation; prefer a `fetch_data` URL in the job config for remote files.
