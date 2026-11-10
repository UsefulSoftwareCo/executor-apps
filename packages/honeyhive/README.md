# HoneyHive

HoneyHive AI observability and evaluation: events and sessions, datasets and datapoints, metrics, experiment runs, annotation queues and configurations (Data Plane), plus projects, workspaces, virtual data planes and alerts (Control Plane).

**Interface:** OpenAPI, from HoneyHive's official documents at https://github.com/honeyhiveai/honeyhive-openapi (`data_plane_openapi.json` on https://api.dp1.us.honeyhive.ai and `control_plane_openapi.json` on https://api.cp.us.honeyhive.ai), pinned to commit `43ad8a888736482b7eb655ab3a33441be4dd9a64`. HoneyHive describes these specs as a preview of an upcoming major API release, so they may change; bump the pin deliberately. The data plane has 80 operations and the control plane 15 (95 in total).

**Auth:** four API key methods, each sent as a Bearer token and each mounting only the operations HoneyHive accepts that key for. Create keys in the HoneyHive app under Settings, API Keys (https://docs.honeyhive.ai/v2/workspace/api-keys.md).
- Project API key (`hh_...`): the classic project key. Mounts the 58 BearerAuth operations (datasets, datapoints, event reads and search, metrics, runs, queues, configurations, charts). This is the key the health check uses (`GET /v1/queues`).
- Fine-grained data plane key (`hh_fgdp_...`, Data Plane tab): works only on project-scoped `/v1/projects/{project_id}/...` routes. Mounts the 10 DataPlaneApiKey operations (charts, datasets list, datapoints, API key creation).
- Ingestion key (`hh_ingst_...`, Ingestion tab): ingestion-only. Mounts the 12 IngestionApiKey operations (events, sessions); every other endpoint refuses it.
- Control plane key (`hh_fgcp_...`), created at organization or workspace level: mounts the 15 control plane operations under `controlPlane`. Project keys do not work on the control plane.

**Known gaps:** only the US hosts are used; self-hosted or other-region data planes are not configurable. Only project key accounts have a health check: the fine-grained, ingestion and control plane keys have no argument-free read endpoint (every control plane operation and every `/v1/projects/...` route needs an id), so a bad key of those types is only detected on first use. Mutations require approval, including POST endpoints that only read (such as `/v1/events/search` and `/v1/events/export`). Many operations are marked deprecated in the spec but are still mounted.
