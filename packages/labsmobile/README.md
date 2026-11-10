# LabsMobile

Send SMS with LabsMobile, cancel or immediately send scheduled sendings, check the credit balance and look up SMS prices per destination country.

## Interface

Hand-written tools over LabsMobile's JSON API (`https://api.labsmobile.com/json`), 5 tools: `sms.send`, `sms.cancelScheduled`, `sms.sendScheduledNow`, `account.balance`, `account.prices`. LabsMobile publishes no OpenAPI document or MCP server; the reference is the vendor's docs (https://www.labsmobile.com/en/sms-api/api-versions/http-rest-post-json and https://apidocs.labsmobile.com/). Sending and scheduled-sending changes require approval. `sms.send` accepts `test: 1` for a simulated send that uses no credit.

## Auth

Username and API token, sent as HTTP Basic to `api.labsmobile.com`. The username is your LabsMobile account email; create the API token under API Settings in the LabsMobile dashboard (https://www.labsmobile.com/en/api, "API tokens"). It is not your web password. There is no OAuth. The API allows at most 10 requests per second. The health check calls `GET /balance`.

## Known gaps

- HLR lookup (`/hlr`) is documented on a separate page and is not covered.
- Delivery status (ack), click and inbound SMS are callbacks to your own URLs, not endpoints, so there are no tools for them; the vendor has no list or status-query endpoint in the JSON API.
- The `parameters` (per-recipient placeholders) and certified-SMS (`crt*`) send options are not exposed.
- The icon is the official mark taken from LabsMobile's GitHub organization avatar (100px); the vendor publishes no SVG or larger logo.
