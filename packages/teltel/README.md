# TelTel

Voice and SMS through TelTel's own API: place calls and read call lists, send and receive SMS (single, bulk, campaigns, delivery reports), manage autodialers and their contacts, contact groups, users and user statuses, phone numbers (lookup, owned DIDs, ordering) and account balance. 71 tools; 40 of them require approval: the 38 mutations plus the two GET endpoints that send SMS (`smsOutbox.getSmsActionSendText`, `smsInbox.getSmsActionSendInboxText`), which the framework would otherwise treat as read-only queries.

**Interface:** OpenAPI. TelTel's official description is at https://api.teltel.io/v2/api.user.0d9ae995324f03f254d3da8d963d46b2.json (linked from https://apidoc.teltel.io/). It splits every path and schema into relative-file `$ref`s that the compiler cannot follow and declares no servers, so `spec.json` is that same document with the external references inlined and the `%{...}%` placeholders filled in; requests go to `https://api.teltel.io/v2`.

**Auth:** API key. Find it under Settings in your TelTel account (https://teltel.io/v2/login). It is sent as the `apikey` query parameter, as the spec declares (TelTel also accepts an `X-API-KEY` header, which the health check uses). Note that the two GET send-SMS endpoints can only carry the key in the query string, so it may appear in TelTel's or intermediaries' access logs; this is a vendor limitation.

**Icon:** the mark (without wordmark) from TelTel's official logo SVG, https://www.teltel.io/v2/static/assets/img/logo.svg.

**Gaps:** Webhooks and WebSocket call events are push channels and are not exposed as tools. If TelTel republishes the spec, regenerate `spec.json` by inlining its `./apidoc/...` references.
