# Wappalyzer

Wappalyzer's v2 API: technology lookup for websites, lead lists, subdomain discovery, email verification and credit balance.

Interface: OpenAPI 3.1, Wappalyzer's official document at https://www.wappalyzer.com/openapi/v2-public.yaml (server https://api.wappalyzer.com/v2).

Auth: API key only (sent as `x-api-key`). Create one in your Wappalyzer account's API dashboard at https://www.wappalyzer.com/api/. The API requires a Business plan. Wappalyzer offers no OAuth.

Notes: lookups and list finalization spend credits. Mutating operations (creating, finalizing and deleting lists) require approval. Asynchronous results delivered by callback URL are not received by the tools; poll by repeating the request (free within an hour) or fetch a list by id.
