# Apilio

Smart home logic with Apilio: read and set boolean, numeric and string variables, list and inspect variable, time and Tuya conditions, and list, evaluate, activate or deactivate logicblocks.

## Interface

Hand-written tools over the Apilio REST API (`https://api.apilio.com/api/v1`), 19 tools. Apilio publishes no OpenAPI document or MCP server; the only reference is the vendor's Postman documentation (https://documenter.getpostman.com/view/13480928/TzCHAVD2). Tools that change data (set variable, evaluate logicblock, activate/deactivate) require approval.

## Auth

API username and password, sent as HTTP Basic to `api.apilio.com`. They are not your web login: open your profile page at https://apilio.herokuapp.com/user to see (or regenerate) them. The API may be limited to certain plans and is rate limited to 60 requests per minute (a 5 minute lockout follows). There is no OAuth. The health check calls `GET /boolean_variables`.

## Known gaps

- The API cannot create or delete variables, conditions or logicblocks, and cannot change conditions.
- Verbs and request bodies (PUT `{"boolean_variable":{"value":..}}`, `numeric_variable`, `string_variable`; PATCH `{"logicblock":{"active":..}}`; POST `/logicblocks/{id}/evaluate` with no body) match the example requests in the vendor's Postman collection (read from its public JSON at https://documenter.gw.postman.com/api/collections/13480928/TzCHAVD2). They were not exercised against a live account. Numeric values come back as strings such as "5.0".
- Apilio's inbound webhooks (GET URLs with a per-variable key) are separate and not covered.
