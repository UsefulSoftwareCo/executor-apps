# Siteleaf

Siteleaf CMS for Jekyll sites: list, create, update and delete sites, pages, collections and documents, upload static and source files, publish a site and follow its jobs, and manage users and roles (36 tools).

## Interface

Hand-written tools over Siteleaf's REST API v2 at `https://api.siteleaf.com/v2`. Siteleaf publishes no OpenAPI document, only its official docs at https://learn.siteleaf.com/api/, which are the source of every endpoint. Mutations require approval. File uploads (`collections.uploadFile`, `source.put`) take the file's text as `content`, so binary uploads are not supported.

`jobs.get` targets a Server-Sent Events endpoint; the tool reads the stream for up to 15 seconds and returns the last event (`status`, `message`, `updated_at`).

## Auth

- API key and secret: both are shown on the account page at https://manage.v2.siteleaf.com/account (per the vendor's Authentication docs). Requests use HTTP Basic auth with the key as username and the secret as password. Siteleaf offers no OAuth.

## Known gaps

- Binary file uploads (images) are not supported, only text content.
- The `/auth` endpoint (email and password exchange) is deliberately omitted.
- Not exercised against a live account, so the job stream reader and root source listing are unverified live.
- The icon is the official Siteleaf logo SVG (leaf with wordmark) from learn.siteleaf.com.
