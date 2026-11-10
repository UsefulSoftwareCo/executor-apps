# CrowdStrike

CrowdStrike Falcon: hosts and host groups, alerts, legacy detections, incidents, custom IOCs, Falcon Intelligence (actors, indicators, reports, rules), Spotlight vulnerabilities, Discover assets, prevention/sensor-update/response policies, sensor installers, quarantine, Real Time Response, users and roles, and Identity Protection (GraphQL). 79 hand-written tools plus `request`, a generic call for any other Falcon endpoint.

## Interface

Custom tools over the Falcon REST API (`https://api.<cloud>.crowdstrike.com`). CrowdStrike publishes its Swagger document only inside the logged-in Falcon console (it returns 403 publicly), so no OpenAPI document could be used. Paths and parameters come from CrowdStrike's developer documentation. Queries return IDs and `get` tools return details; mutations (all POST/PATCH/DELETE writes, including RTR commands) require approval. POST endpoints that only read (`alerts.get`, `incidents.get`, ...) are queries.

## Auth

API client (client credentials). In the Falcon console go to Support and resources > API clients and keys, create a client with the scopes you need (Hosts, Alerts, Incidents, IOCs, Real time response, ...), and copy the client ID and secret. Enter the API host of your cloud as the Base URL: `api.crowdstrike.com` (US-1), `api.us-2.crowdstrike.com`, `api.eu-1.crowdstrike.com`, `api.laggar.gcw.crowdstrike.com` (US-GOV-1) or `api.us-gov-2.crowdstrike.mil`. The app exchanges the client ID and secret at `/oauth2/token` for a bearer token. Falcon has no authorization-code OAuth for third parties, so no `oauth2` method is offered. Scopes on the API client decide which tools work; a 403 names the missing scope.

## Known gaps

Falcon has well over a thousand operations; only the commonly used ones have dedicated tools, the rest go through `request`. Cloud security, NG-SIEM, sandbox, file upload and event streams have no dedicated tools. The health check only verifies that a token can be minted, because available scopes vary per client.
