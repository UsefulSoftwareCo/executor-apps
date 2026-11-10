# Roboflow

Manage Roboflow computer vision work: projects, image upload and search, annotation batches and jobs, auto labeling, dataset versions, training, Workflows, model deployment, and the in-app Roboflow agent. About 140 tools.

**Interface:** Roboflow's official remote MCP server, `https://mcp.roboflow.com/mcp` (docs: https://docs.roboflow.com/agents/mcp-server). Roboflow's REST API publishes no OpenAPI document; the only public one belongs to the self-hostable inference server, which is not the workspace API. Tools other than those annotated read-only require approval.

**Auth:** OAuth 2.0 only; the server supports dynamic client registration and does not accept API keys. The authorization server is `https://app.roboflow.com` and Executor discovers it from the MCP server's metadata and explicitly requests the full scope set from the server's 401 challenge (workspace, project, workflow, folder, image, model, device, vision-events, batch, version, training, annotation-job, video-inference, integration, credentials, api-key, datasource, data-staging and batch-processing scopes, plus `openid profile email`) together with `offline_access`. `offline_access` is advertised only by the authorization-server metadata, not the MCP server's, and Roboflow requires it to issue refresh tokens, so it is requested explicitly to keep connections from expiring. Sign in with your Roboflow account on connect. If your Executor needs a pre-registered client, create an OAuth App under Workspace Settings > Developer in Roboflow and set its redirect URI to the one Executor shows.

**Gaps:** No API-key mode. Running inference on the serverless inference endpoints (`serverless.roboflow.com`, keyed by a private API key) is not included.
