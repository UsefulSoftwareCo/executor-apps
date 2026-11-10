# Lattice

Reads Lattice people data (users, direct reports, departments, custom attributes, goals and goal updates, review cycles, reviewees and reviews, feedback, tasks, tags, updates, competencies) and creates or updates goals and goal progress updates.

Interface: OpenAPI, from Lattice's own public Talent API document at https://api.latticehq.com/v1/swagger (referenced in https://developers.lattice.com/reference/using-postman). 33 paths.

Auth: API key (`apiKey`). An admin creates it in the Lattice admin dashboard (see https://developers.lattice.com/docs/authentication-1); it is sent as a bearer token and carries the privileges of the user who created it. Lattice offers no OAuth for this API.

Known gaps: the spec only lists the US host `api.latticehq.com`. Accounts with EMEA data residency use `api.emea.latticehq.com`, which this package does not support. Most of the API is read-only; goals are the only writable resource. Mutations require approval.
