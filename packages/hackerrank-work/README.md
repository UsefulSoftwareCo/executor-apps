# HackerRank Work

Covers HackerRank for Work: coding tests, candidate invites, reports and PDFs, CodePair interviews and transcripts, interview templates, questions and test cases, users, teams, and the audit log. 59 tools, 25 of them reads and 34 writes (every write needs approval).

Interface: OpenAPI (Swagger 2.0), the official document at https://www.hackerrank.com/apidoc, which backs https://www.hackerrank.com/work/apidocs. The document is not usable as published: it has no operation ids, writes query strings into path keys, and marks query parameters as path parameters. The app downloads it and normalizes it (`normalize.ts`) before generating tools: it strips query strings from path keys, renames parameters to the wire name given in the key (for example `search_string` becomes `search` on user search), declares query keys the document leaves undeclared (`user_id` on the audit log, `format=url` on candidate PDFs, with `url` as the default), and adds operation ids. Its SCIM section lives on `services.hackerrank.com` and is left out, as are the generic documentation-only `{resource_name}` entries.

HackerRank also runs an official remote MCP server (https://www.hackerrank.com/work/mcp, OAuth). It exposes 45 read-only tools, so the REST API is used instead because it can also invite candidates and edit tests, interviews and questions.

## Authentication

API key. In HackerRank for Work open your API token settings and generate a V3 API key. The app sends it as `Authorization: Bearer <key>`. Source for this: HackerRank's MCP doc (https://www.hackerrank.com/work/mcp/docs/) sends a personal V3 key as a Bearer credential, and probing the REST API with an invalid placeholder key showed the server parses Bearer and Basic headers ("Authentication header invalid") and ignores the `access_token` query parameter the Swagger document declares ("Authentication header not provided"). The REST docs do not state Bearer explicitly; this is unconfirmed with HackerRank support. Keys act as the user who created them, so permissions follow that user.

OAuth is not offered: HackerRank's OAuth is only for its MCP server and does not issue tokens for the REST API.

## Known gaps

- `POST /ats/codescreen` and `POST /ats/codepair` are left out: HackerRank says not to use a personal API token for ATS integrations, which get their tokens separately.
- The document is Swagger 2.0 with sparse schemas, so request and response bodies are loosely typed.
- The SCIM provisioning API (`services.hackerrank.com/scim/v2`) is not included.
