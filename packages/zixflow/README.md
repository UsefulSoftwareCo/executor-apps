# Zixflow

Zixflow's CRM and messaging API: collections and their records (people, companies, deals, custom), lists and list entries, activities, attributes with select and status options, workspace members, and sending SMS, email, WhatsApp (template, text and other session messages), RCS and OTPflow, plus delivery reports.

## Interface

Custom, hand-written tools over the REST API at `https://api.zixflow.com/api/v1`. Zixflow publishes no OpenAPI document (its docs at https://docs.zixflow.com/api-reference/introduction are Mintlify pages without a spec), so the endpoints come from the official API reference. Every mutation requires approval.

## Auth

API key only, sent as `Authorization: Bearer <key>`. Create it in Zixflow under Workspace Settings > Developer > API Keys > Create an API (https://docs.zixflow.com/api-reference/authentication). Zixflow documents no OAuth for third-party apps.

## Known gaps

- Zixflow AI endpoints on `api-ai.zixflow.com` (Sendflow triggers and reports, CSV imports, unified messaging) and the Events API on `api-events.zixflow.com` use other hosts and, for events, write keys; they are not included.
- Email attachment upload (multipart) is not included; `sendEmail` accepts existing attachment IDs.
- Less common WhatsApp message types and RCS and OTPflow bodies take a raw `payload` object per the vendor docs.
- Record, entry and attribute bodies are free-form objects because their shape depends on the workspace's attributes.
