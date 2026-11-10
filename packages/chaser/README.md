# Chaser

Chaser is accounts receivable automation software. This package exposes Chaser's public Open API: customers and contact persons, invoices (and their history and PDFs), credit notes, overpayments, customer notes, chasing pause/resume, chasing schedules, tasks, templates and organisation sync, including the bulk upsert endpoints.

Interface: OpenAPI, the vendor's own document at https://openapi.chaserhq.com/docs/json (docs at https://openapi.chaserhq.com/docs/). Every mutation requires approval.

## Auth

API key and secret (HTTP Basic, key as username and secret as password). Create them in Chaser under Organisation settings > Integrations > Get API keys (https://my.chaserhq.com/settings/integrations). Chaser offers no OAuth for this API; keys are per organisation.

## Icon

Chaser publishes only its orange wordmark (no separate symbol); the icon is the official SVG from chaserhq.com.

## Known gaps

None known; the health check calls `GET /v1/organisation`.
