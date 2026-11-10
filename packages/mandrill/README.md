# Mandrill

Mandrill, now branded Mailchimp Transactional: send email and SMS (plain, template, raw MIME, scheduled), search messages and read their content, manage templates, senders and sending domains, tracking domains, rejects and allowlists, webhooks, inbound domains and routes, dedicated IPs and pools, subaccounts, tags, metadata and exports, plus time-series reports. 99 tools, 54 of them mutations (each mutation asks for approval). Read-only calls (list, info, search, render, reports, DNS checks) run without approval.

Interface: OpenAPI. Source is Mailchimp's official Swagger 2.0 description of the Transactional API, `https://raw.githubusercontent.com/mailchimp/mailchimp-client-lib-codegen/main/spec/transactional.json`. It is vendored as `spec.json`, edited as described in `openapi.ts`: the required `key` body field is removed from every request (the app sends it for you), a header apiKey scheme is declared so the credential reaches the request layer, the base path is set to `/api/1.4` (the file says 1.3; Mailchimp's docs serve 1.4), and the `x-doc-structure` index is dropped. Because the spec is a snapshot, new endpoints need a refresh of `spec.json`.

## Auth

- API key: in Mailchimp go to Transactional (Mandrill) > Settings > SMTP & API Info > Add API Key. A key can be limited to specific permission groups; a restricted key only works for those endpoints. Mandrill expects the key in the JSON body of every call as `key`; the app moves it there from an internal header, so nothing else is needed. Calls go to `https://mandrillapp.com/api/1.4`.
- OAuth: Mailchimp's OAuth (login.mailchimp.com) covers the Marketing API, not Transactional, so it is not offered.

## Gaps

- Mailchimp also runs an official remote MCP server at `https://mandrillapp.com/mcp` (Bearer API key; nine generic tools such as `call_api`, `describe_api` and `diagnose_failed_send`). It is not mounted because these tools wrap the REST endpoints already exposed here as typed tools; its `diagnose_failed_send` and template-building helpers are not available.
- The Marketing API (audiences, campaigns) is a separate product, covered by the `mailchimp` package.
- The key-injection path (header to body) and the `users/info` health check were typechecked, compiled and deployed but not run against a live key.
- Transactional is a paid Mailchimp add-on; accounts without it get 402 PaymentRequired.
- Icon: the product's own site (`mandrillapp.com/img/navigation/freddie.svg`) now uses Mailchimp's Freddie mark since the rebrand. The artwork is unchanged, placed on a teal tile so it shows on light and dark backgrounds. The older Mandrill wordmark is only published as a 173x28 PNG.
