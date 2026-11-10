# listmonk

Manage a self-hosted [listmonk](https://listmonk.app) newsletter and mailing list server: subscribers, lists, campaigns, templates, media, bounces, import and settings.

## Interface

OpenAPI, from the official document in the listmonk repository: https://raw.githubusercontent.com/knadh/listmonk/master/docs/swagger/collections.yaml. The document only names a localhost server, so the package targets the `/api` path of the domain you enter.

## Auth

API user and token. In listmonk go to Admin > Users, create a user of type API and copy the generated token (shown once). Enter the domain of your install (for example `listmonk.example.com`), the API user name and the token. Requests are sent as `Authorization: token <user>:<token>` and only to that domain. The user's role decides which tools succeed. listmonk has no OAuth.

## Known gaps

The upstream document is hand-maintained and may lag the server; some response shapes can differ. Installs served over plain http are accepted as entered, so prefer https.
