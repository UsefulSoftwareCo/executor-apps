# Short Menu

Create, update and delete Short Menu short links (destination URL, domain, custom slug, tags).

## Interface

OpenAPI, from Short Menu's official document at https://docs.shortmenu.com/api-reference/openapi.json (loaded live). Three operations: create link, update link, delete link. Every mutation requires approval. The API has no list or read endpoints and no account endpoint.

## Auth

API key. Create one at https://shm.to/create-api-key. It is sent in the `x-api-key` header. No OAuth is documented. Because there is no read endpoint, the health check deletes a nil-UUID link: a 401 or 403 means the key is bad, a 404 means it is accepted.

## Icon

Short Menu's official bolt mark, from the favicon of its documentation site (https://docs.shortmenu.com/favicon.svg).

## Known gaps

The API cannot list links, domains or click statistics, so those are not available.
