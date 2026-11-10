# OSV

Looks up known vulnerabilities in open source packages using the public OSV database (osv.dev), operated by Google: query by package version (name and ecosystem, or purl) or git commit, batch queries of up to 1000, fetch a full OSV record by ID (GHSA, CVE, PYSEC, RUSTSEC and so on), plus two experimental endpoints (Ubuntu binary-to-source mapping and import findings).

Interface: hand-written tools over the official OSV REST API at https://api.osv.dev (documented at https://google.github.io/osv.dev/api/). Google's published Swagger 2.0 file (https://github.com/google/osv.dev/blob/master/docs/osv_service_v1.swagger.json) has no base URL or schemes, so it is not compiled directly. The POST search endpoints are exposed as queries because they change nothing.

Auth: none. The API is public and needs no key or account, so the package declares no account.

Known gaps: `determineversion` (hash-based version detection, experimental) is not exposed. The vulnerability list endpoint does not exist upstream; bulk data is published as per-ecosystem zip files in the `osv-vulnerabilities` Google Cloud Storage bucket.
