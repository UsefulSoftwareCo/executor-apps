# Stedi

Stedi healthcare EDI: real-time eligibility checks, claim status, claim submission (professional, institutional, dental), claim validation and lifecycle, batch eligibility, transaction enrollment, payer directory search, event destinations, and EDI transactions and executions (94 tools).

**Interface:** OpenAPI. Stedi publishes seven official specs in https://github.com/Stedi/openApi (`healthcare`, `claims`, `manager`, `enrollment`, `payers`, `event-destinations`, `core`), linked from https://www.stedi.com/docs/api-reference. Each is mounted under its own key (`healthcare`, `claims`, `batchEligibility`, `enrollment`, `payers`, `eventDestinations`, `core`) in one app. The specs are fetched from raw.githubusercontent.com.

**Auth:** API key. Create one at https://portal.stedi.com/app/settings/api-keys (test keys work for test-mode operations). It is sent as-is in the `Authorization` header, with no `Bearer` prefix. Stedi does not offer OAuth. The health check lists one payer.

**Icon:** the Stedi "S" glyph from Stedi's own site (`icons.svg`, `stedi-glyph`), drawn dark on light and white on dark.

**Gaps:** every mutation, including the POST eligibility and claim-status checks, asks for approval. All hosts are `*.us.stedi.com`; Stedi has no other regions in its published specs.
