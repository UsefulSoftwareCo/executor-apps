# Clari Copilot

Covers the Clari Copilot REST API: calls and call details, call creation, scorecards and templates, topics, users, and CRM accounts, contacts and deals (create, get, update, delete).

Interface: OpenAPI, from the vendor's official document at https://api-doc.copilot.clari.com/spec.yaml (API host https://rest-api.copilot.clari.com). All mutations require approval.

Auth: API key plus API password, sent as `X-Api-Key` and `X-Api-Password`. Find both in Clari Copilot under workspace settings > integrations > Clari Copilot API. The vendor offers no OAuth. Limits: 10 requests per second and 100k per week.

Icon: the mark cropped from Clari's official Clari Copilot logo (https://api-doc.copilot.clari.com/logo.png).

Known gaps: none known. The health check calls `GET /users`.
