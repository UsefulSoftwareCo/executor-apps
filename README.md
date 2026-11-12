# Executor apps

The official app catalog for [Executor](https://executor.sh): ready-made apps that connect
Executor to third-party services. Each directory under `packages/` is one app, published as
`@executor.sh/<service>`, with its tools, sign-in methods and icon.

## Using these apps

You don't need this repo to use them. In Executor, open **Add app**, pick a service and sign in.
Executor's Add app page reads its catalog from this repo. Each app's `README.md` says what it
covers, how to get its API key or set up OAuth, and its known gaps.

To run your own copy of an app, or a modified one, deploy its directory with the Executor CLI:

```sh
executor apps create --name "Resend" --files packages/resend
```

`scripts/deploy.sh <id>...` does the same for several packages and updates apps that already
exist (`EXECUTOR_HOST` selects the Executor; `.local/env` can set it).

## Layout

- `packages/<id>/`: one app. `index.ts` defines it with the `apps` SDK, `package.json` names it,
  `icon.ts` holds its icons and `README.md` documents it. OpenAPI apps add `openapi.ts`.
- `catalog/apps.json`: the apps the catalog lists, in display order, with their categories.
- `shared/google-tools/`: tool sources copied into the Google packages by
  `scripts/google-vendor.ts`.
- `scripts/`: authoring and publishing tools.

## Contributing an app

Start with Executor's [app authoring guide](https://executor.sh/docs/author-an-app).
[AUTHORING.md](AUTHORING.md) is this repo's contract for a package: choosing the interface, auth, required
files, icons and verification. Then:

```sh
bun install
scripts/check.sh <id>    # typecheck, compile the OpenAPI document, deploy to a local Executor
```

## Catalog feed

`bun scripts/feed.ts --out feed` builds the feed Executor's Add app page reads (`index.json`,
`apps/<id>.json`, `icons/<hash>.<ext>`). On every push to `main`, `.github/workflows/publish.yml`
builds it and `scripts/publish.ts` syncs it to the bucket served at `https://catalog.executor.sh`.
It uploads changed files first, then `index.json`, then deletes objects the new index no longer
names.

## Google Discovery conversions

Google publishes its REST APIs as Discovery documents, not OpenAPI. `scripts/google-discovery.ts`
fetches Google's own documents and writes each package's `openapi.json` (Gmail, Sheets, Forms, Tasks,
Classroom, YouTube); each file records its Discovery URL and revision in `info.x-executor-discovery`.
Rerun it to pick up Google's changes, then `node scripts/google-vendor.ts` to refresh the copies in
`packages/google`. Output is sorted, so an unchanged revision regenerates without a diff. Its header
lists the conversion rules (tool names, JSON bodies, media upload, the standard `fields` and
`quotaUser` parameters). Methods left out, such as uploads that need a file beside their JSON body
or methods whose scopes the app does not request, are listed with their reasons in
`info.x-executor-discovery.excluded`.

## Microsoft Graph slices

`packages/microsoft-teams/openapi.json` and `packages/excel/graph-excel.json` are generated from
Microsoft's Graph v1.0 OpenAPI document by `scripts/graph-slice.ts` (path filter, pruned
components, bounded schema depth so the hosted tool listing stays small). The script's header
has the regeneration commands; each file records its source commit in `info.x-executor-slice`.

## License

[MIT](LICENSE)
