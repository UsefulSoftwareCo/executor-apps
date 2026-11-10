# Contractbook

Contractbook is a contract lifecycle management platform. This package covers its Public API v3: documents (list, get, update, delete, send, share, withdraw, PDF, data field assignment), templates (list, get, create a document from a template), spaces, automations and file uploads.

**Interface:** OpenAPI, from Contractbook's official document at https://api.contractbook.com/v3/docs/public/v3/openapi-v3.json (human docs at https://api.contractbook.com/v3/docs). The tools target the production server `https://api.contractbook.com/v3/`; the staging server in the spec is not used.

**Auth:** API key only (sent as `Authorization: Bearer <key>`). The vendor spec describes no OAuth flow. Per the spec, create the key in Contractbook under your profile settings; it is shown only once, at creation. Staging and production are separate environments with separate accounts, and this package targets production only.

**Icon:** the Contractbook mark (two overlapping rounded rectangles), cropped from the vendor's older Black Logo SVG asset (mark plus wordmark), not the current site header lockup.

**Known gaps:** the spec has 18 operations on 15 paths. Space creation is limited to child spaces under a parent (`POST /spaces/{id}`); creating top-level (root) spaces and managing webhook subscriptions are not in the public v3 API.
