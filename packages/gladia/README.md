# Gladia

Speech-to-text with Gladia: upload audio files, start and manage pre-recorded and live transcriptions, fetch results and download source audio.

## Interface

OpenAPI, from Gladia's official document at https://api.gladia.io/openapi.json (https://docs.gladia.io).

## Auth

- API key: create one in the Gladia app at https://app.gladia.io (API keys). It is sent as the `x-gladia-key` header. Gladia offers no OAuth.

## Known gaps

The real-time WebSocket streaming session itself is not a REST operation; the live endpoints only start and manage sessions. Legacy v1 endpoints in the spec are included as published.

## Icon

The official Gladia app mark from https://www.gladia.io/favicon.svg, with the rounded-square background removed so it works on light and dark (Simple Icons has no Gladia entry).
