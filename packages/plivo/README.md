# Plivo

Send SMS, MMS and WhatsApp messages, make and control voice calls (live-call transfer, record, play, speak, DTMF), and manage phone numbers, applications, SIP endpoints, recordings, conferences, subaccounts, usage, pricing and number lookup.

**Interface:** hand-written tools over Plivo's REST API (`https://api.plivo.com/v1/Account/{auth_id}/...`) and the Lookup API (`https://lookup.plivo.com/v1/Number/{number}`), written from the vendor's docs at https://www.plivo.com/docs. Plivo publishes no OpenAPI document and no official remote MCP server for the API (only a documentation MCP server), so the most-used operations are written by hand. Every mutation requires approval.

**Auth:** Auth ID and Auth Token, sent as HTTP Basic auth. Find both on the Plivo console overview page (https://console.plivo.com/dashboard/). Plivo has no user-created OAuth apps. A subaccount's Auth ID and Token also work and scope the tools to that subaccount.

**Known gaps:** 10DLC brand and campaign registration, Powerpack and number pools, toll-free verification, WhatsApp templates, SIP trunking, number masking, multiparty calls, transcriptions and media upload are not covered.
