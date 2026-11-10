# Mezmo

Covers Mezmo's REST API: telemetry pipelines and their nodes, alerts, log views, boards, preset alerts, categories, archiving, log export, access tokens, service accounts, roles, and account and enterprise administration.

**Interface:** OpenAPI. Mezmo's official combined spec, linked from https://docs.mezmo.com/docs/api, at https://docs.mezmo.com/apis/combined-mezmo-api.yaml (all operations on https://api.mezmo.com).

**Auth:** API key (`apiKey`), sent as `Authorization: Token <key>`. Create a service account key or a personal access key in the Mezmo web app (the exact menu path is not verified here; see Mezmo's access token docs). Enterprise service account keys (`ste_` prefix) work too. Mezmo offers no user-created OAuth apps, so there is no OAuth method. The health check lists accounts via `/v3/auth/account`.

**Known gaps:** 20 of the spec's 229 operations are skipped by the generator, so 209 tools are generated.
- 10 skipped for auth: the deprecated `/v1/enterprise/*` endpoints, which use the `enterprise-servicekey` header (or basic/servicekey alternatives), and `POST /logs/ingest`, which uses an `apikey` header.
- 10 skipped for malformed schema references: the `$ref` values are non-JSON-pointer anchors such as `#alert_channels` with no matching `components.schemas` entry. All ten are writes, notably the pipeline-building ones: pipeline with-components and with-linked-components, transform create/update, transform-group transform create/update, tap, sample, and usage-threshold-alert create/update. These are not covered.
- The spec declares no `x-delegate-account-id` header on any operation, so enterprise delegation is not available.
- Log ingestion (`logs.mezmo.com`) uses a separate host and ingestion key, and is not covered.
