# Pushpay ChMS (v1)

Pushpay ChMS v1 (formerly Church Community Builder, hosted at `<church>.ccbchurch.com`): individuals, families, groups, events, attendance, gifts and transactions, forms, saved searches, processes, queues and the configurable lookup tables (campuses, areas, group types, pulldowns and so on). 186 tools, one per documented API service; 77 of them write and always ask for approval.

## Interface

Hand-written tools over the vendor's XML API. Pushpay publishes no OpenAPI document for v1, so `services.ts` was generated from the official service reference at https://docs.pushpay.io/chms-v1/llms.txt (service names, required and optional parameters, which services must be sent by HTTP POST). Each tool calls `https://<subdomain>.ccbchurch.com/api.php?srv=<service>` and returns the raw XML response as `{ xml }`. Failures reported inside a 200 response are raised as errors. The three XML-upload services (`import_batches`, `import_online_gifts`, `create_event_attendance`) take the document in `xml` and send it as the `filedata` upload.

## Auth

One method, an API user (HTTP Basic). In Pushpay ChMS open **API Admin**, create a dedicated API login and grant it only the services you need (permissions are per service). This is not an API User Community login. Connect with the church subdomain (the part before `.ccbchurch.com`, shown in API Admin), the API username and its password. The credential health check calls `api_status`, which does not use the daily call quota. See https://docs.pushpay.io/chms-v1/docs/authentication. There is no OAuth for v1 (Pushpay ChMS v2 uses OAuth and is a separate API).

## Known gaps

- Responses are XML text, not parsed into JSON.
- Rate limits apply (60 request burst, 1 request per second, daily limit per church); a service the API user lacks access to returns an error.
- Parameter types are passed as documented strings or numbers; arrays use the vendor's comma-separated form.
- `api_status` and `describe_api` are not exposed as tools.
