# Canvas

Canvas LMS by Instructure: courses, assignments, submissions, grades, enrollments, modules, pages, discussions, quizzes, files, calendar events, conversations, accounts and the rest of the REST API (1,117 operations).

## Interface

OpenAPI, converted from Instructure's official API documentation. Instructure publishes that documentation as Swagger 1.2 resource files (https://canvas.instructure.com/doc/api/api-docs.json) and the hosted site has no OpenAPI 3 document. Instructure's canvas-lms source can generate one (`bundle exec rake doc:openapi` writes `public/doc/openapi/canvas.openapi.yaml`, with response schemas), but there is no stable public URL for it (canvas.instructure.com/doc/openapi/canvas.openapi.yaml returns 503) and producing it needs a local canvas-lms build, so `generate.mjs` fetches every resource file and converts it into `spec.ts`. Re-run `node packages/canvas/generate.mjs` to refresh it. The conversion is ours, not Instructure's: responses are untyped (Canvas documents them separately from the operations), request bodies are sent as JSON with nested objects built from names such as `course[name]`, and array query parameters keep Canvas's `name[]` spelling, for example `include[]`. Parameters with names that cannot be expressed (placeholders like `permissions[<X>][enabled]`) are left out.

Canvas is hosted per institution, so the account asks for the domain and every request goes to `https://<domain>/api`. Mutations ask for approval.

## Auth

Access token (`secrets`): the Canvas domain (for example `myschool.instructure.com`) and a token. Create the token in Canvas under Account > Settings > Approved Integrations > New Access Token. The token acts as that user with all of their permissions.

## Known gaps

- OAuth is not offered. Canvas OAuth (`https://<host>/login/oauth2/auth` and `/login/oauth2/token`) exists only with a developer key issued by an institution admin, so an end user cannot complete it alone, and the endpoints are per-school, which a provider with fixed URLs cannot declare.
- Only `*.instructure.com` hosts are allowed. Self-hosted Canvas and schools using a custom vanity domain are not supported.
- List endpoints return Canvas's first page; pagination `Link` headers are not exposed. Use `per_page`.
- Some institutions disable user-generated access tokens.
