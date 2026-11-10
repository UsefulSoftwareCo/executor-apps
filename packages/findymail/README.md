# Findymail

Findymail is a B2B contact data provider. This package exposes its API as tools: email and phone finding, email verification, reverse email lookup, company and employee search, business profiles, Intellimatch and lookalike searches, contact lists, signals and monitors, technologies, and credit usage.

## Interface

OpenAPI, from Findymail's official document at <https://app.findymail.com/docs/openapi.yaml> (API base `https://app.findymail.com`). Mutations require approval.

## Auth

API key. Create it in Findymail under the user menu, API tokens (<https://app.findymail.com/user/api-tokens>). It is sent as `Authorization: Bearer <key>`. Findymail offers no OAuth for third-party apps.

## Known gaps

The team usage report endpoint is owner-only. Webhook-based callbacks are not modelled.
