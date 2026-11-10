# HITL.sh

Human approval and review for AI agents through HITL.sh: create loops, send review requests to loop members (who answer in the mobile app), read structured responses, cancel requests, add feedback and manage loop membership.

## Interface

OpenAPI, the vendor's official document published with its docs: https://docs.hitl.sh/api-reference/openapi.json (API origin `https://api.hitl.sh/v1`). Every non-read operation requires approval.

## Auth

- API key (bearer token). Create it in the HITL.sh dashboard under API Keys (https://docs.hitl.sh/api-keys). The key is limited to 100 requests per hour by the vendor.

HITL.sh offers no OAuth.

## Known gaps

The OpenAPI document covers loops, loop members, requests, feedback and the key test endpoint. Webhook callbacks are set per request through its callback URL field, not as a separate API.
