# Planyo

Planyo online reservation system: resources, reservations, availability, vacations, pricing, payments, additional products and custom properties.

## Interface

Hand-written tools over Planyo's REST API (`https://www.planyo.com/rest/`, documented at https://www.planyo.com/api.php). Planyo publishes no OpenAPI or MCP server, so 57 of its most-used methods are exposed as tools grouped by area. Each tool takes the common parameters as typed fields and a `params` object for any other parameter documented on the method's page (for example `rental_prop_*` form items or `prop_res_*` filters). Every write tool needs approval.

## Auth

API key only. Planyo has no OAuth. In the Planyo admin panel create or copy the API key (https://www.planyo.com/api-key.php). The key is sent as the `api_key` form field in a POST to the SSL endpoint.

## Known gaps

- API keys with the optional hash key (`hash_key` and `hash_timestamp`) enabled are not supported, because the runtime offers no MD5. Leave the hash key off for this key, or restrict it by IP address and allowed methods instead.
- Methods not exposed: users/agents, coupons, notification callbacks and messages, product and resource image upload, site moderators and admins, season and pricing rule writes, package and bundle setup, unit properties, and metasite site creation.
