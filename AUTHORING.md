# Authoring an @executor.sh package

One directory per service under `packages/<id>/`, where `<id>` is lowercase
letters, digits and `-` (`google-calendar`, not `googlecalendar`). Copy the shape
of an existing package:

| Interface the service offers         | Copy                          |
| ------------------------------------ | ----------------------------- |
| Remote MCP server with one-click sign-in | `packages/linear` (MCP + GraphQL), `packages/posthog` |
| Public OpenAPI/Swagger document      | `packages/resend`, `packages/github` (OAuth + token) |
| GraphQL API                          | `packages/linear`             |
| Remote MCP server, nothing better    | see "MCP servers" below       |
| None of the above                    | queries/mutations with `fetch` |

## Choosing the interface

Expose as many working tools as possible. Prefer, in order:

1. The vendor's official remote MCP server when signing in to it needs no OAuth
   app of the user's own: the probe shows dynamic client registration or Client
   ID Metadata Documents, or Executor has a first-party client for its
   authorization server (GitHub). Any other OAuth method makes a Cloud user
   register an app first, and people stop there. Drop OAuth methods that need a
   user-owned app; keep the API-key methods and, for the accounts whose
   credentials it accepts, the OpenAPI/GraphQL router (MCP tokens usually work
   only on the MCP server).
2. The vendor's official OpenAPI document at a stable public URL (check
   integrations.sh's `domains/<domain>/integrations.json` `spec` field, the
   vendor's docs and GitHub). It must cover the API users expect; a stub with
   five operations loses to a good MCP server.
3. The vendor's GraphQL API when it is the primary API.
4. The vendor's official remote MCP server.
5. Hand-written tools with `fetch` for the 10–30 operations people use most.

One product is one package, even when the vendor splits its API into several
specs (Algolia's search, analytics, insights...): mount each spec under its own
key in one router, with one provider. A product's MCP server belongs in the
same package as its API: build or extend `packages/<x>` (no `mcp` suffix),
mounting the MCP server under an `mcp` key beside the API's `api` key. Use one
provider for both, so the app has one account slot and its first sign-in is the
one-click one; route each account to the interfaces its method works on. Never
use an unofficial or community spec or MCP server without saying so in the
README.

## Auth

Auth is the part that must be right. The vendor's own docs are the authority;
say in the README when a detail could not be confirmed there.

- Offer every method a normal user can complete themselves: usually an API key
  (`secrets`) and, when the vendor supports user-created OAuth apps, `oauth2`.
  The connect page starts with the first OAuth method, so a one-click method
  (an MCP server with registration, or one Executor has a first-party client
  for) goes first. Executor's GitHub App is offered only to a method on
  github.com's own authorize and token endpoints that declares no scopes.
- OAuth: use `discover` when the vendor publishes RFC 8414/OIDC metadata;
  otherwise declare `authorizationUrl`, `tokenUrl`, `tokenEndpointAuthMethod`,
  `scopes` and any quirks (`scopeSeparator`, `tokenRequestFormat`,
  `tokenResponse`, `authorizationParams`, `revocationUrl`). Pick scopes that cover the generated tools without asking for admin.
- With `discover`, leave `scopes` out by default. Executor requests the MCP
  challenge's `scope`, else the protected-resource `scopes_supported`, plus
  `offline_access` when the authorization server lists it. Declare `scopes`
  only when that misses scopes the tools need (an issuer-only `discover` such
  as Google or Microsoft, or a server that advertises none) or asks for admin
  scopes the tools do not use, and say which in a comment. Never declare a
  scope the server does not advertise: Descript's `full_access` broke every
  sign-in.
- Declare `hosts` with every host credentials go to.
- Give the provider a `health` check on a read-only current-user/account
  endpoint, decoding only fields that are always present (the schema builders
  have no optional or nullable). For MCP providers use `mcpHealth`.
- Approvals: every OpenAPI/GraphQL mutation gets `always()`; MCP tools get
  `always()` unless `readOnlyHint === true`.

## Required files

- `package.json`: `"name": "@executor.sh/<id>"`, `description`,
  `"private": true`, `"type": "module"`, `"executor": { "title": "<Product name>" }`,
  `dependencies.apps` exactly `0.0.1-beta.100` (plus `graphql` `16.11.0` or
  `@modelcontextprotocol/sdk` `1.32.1` when used).
- `index.ts`: declares the icons beside the accounts,
  `defineApp({ accounts: { ... }, icons }, ...)`, and wraps the tools in
  `router(..., { title, description, icons })`, adding `instructions` only for
  non-obvious usage rules. The dashboard reads the app's icons from
  `defineApp` without evaluating the app; without them an installed app falls
  back to the catalog or a generic domain logo.
- `openapi.ts` for OpenAPI packages (exports `options`, used by `scripts/tools.ts`).
- `icon.ts`, generated: `node scripts/icon.ts <id> <simple-icons-slug>` or
  `node scripts/icon.ts <id> path/to/official-logo.svg`.
- `README.md`: one paragraph on what it covers, the interface and its source URL,
  each auth method and where the user creates the key/OAuth app (including the
  redirect URI note for OAuth), and known gaps.

## Icons

The icon must be the product's own mark: Gmail's envelope, not Google's G;
Google Drive's triangle, not Google's G; Azure DevOps, not Microsoft. Find the
product in Simple Icons (`node -e 'const s=require("simple-icons");console.log(Object.values(s).filter(i=>/gmail/i.test(i.title)).map(i=>i.slug+" "+i.title))'`).
If Simple Icons lacks it, download the vendor's official SVG logo from its press
or brand page into a fresh directory under `/tmp`, check it is an SVG of the
product mark (not a wordmark when a mark exists), and pass that path. If the
vendor publishes no SVG, use its official PNG logo or app icon at 128px or
larger (`node scripts/icon.ts <id> logo.png`); never ship an empty `icons`.
Never use a 16/32px favicon, a third-party logo service, a generic glyph (an
envelope for an email product), or a parent company's logo.
`defineApp` accepts at most 8 icons totalling 32 KiB of JSON (base64
included) and refuses the package otherwise; `scripts/icon.ts` and
`scripts/check.sh` enforce this. Pass an SVG through `bunx svgo --multipass`,
or a PNG at 128px (`magick logo.png -resize '128x128>' -strip logo-128.png`).
`scripts/icon.ts` draws near-black marks white in the dark variant. Render both
variants (`scripts/icon-preview.sh <id>` writes a PNG of each on white and on
#111) and look at them: the mark must be fully visible on both.

## MCP servers

```ts
import { defineApp, defineProvider, oauth2, router, toolAnnotations, withApprovals, accountRouter } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
```

Probe first: `node scripts/mcp-probe.ts <url>`. `oauth` means declare
`oauth2({ discover: url })` and trust the server's metadata. It connects in one
click only when `registration_endpoint` or
`client_id_metadata_document_supported` is set; otherwise it needs a user-owned
OAuth app like any other. Check the vendor's docs for an allowlist of approved
MCP clients (Vercel has one) before relying on registration. Anything else: read
the vendor's docs for the header it expects. The probe is the only check for MCP
packages besides typecheck and deploy.

## Verify

Run `scripts/check.sh <id>`. It typechecks the package, compiles an OpenAPI
document and reports tool counts, and deploys to the throwaway local Executor.
An OpenAPI package with zero tools, or with many skipped operations you have not
explained, is not done. Large `multiple_hosts` skips usually mean the spec
spans several origins; note them in the README.

Do not connect real accounts or call vendor APIs with credentials.

## Listing

Add the package to `catalog/apps.json` as `{ "id": "<id>", "category": "<category>" }`
(category optional). The feed lists apps in that file's order, so place it near
comparable products. Packages not listed there are not published.
