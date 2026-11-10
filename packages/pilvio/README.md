# Pilvio

Pilvio is an Estonian cloud provider. This package covers virtual machines (create, power, resize, clone, reinstall, snapshots and backups), block storage disks, S3 object storage buckets and keys, private networks, floating IPs, firewalls, load balancers, billing reads (accounts, credit, cards, invoices, usage, pricing), SSH keys, API tokens, and the locations, image and resource pool catalogues. Location-specific tools take an optional `location` slug; the config and image catalogues are not location-specific.

**Interface:** custom tools written with `fetch` against the official REST API at `https://api.pilvio.com/v1`. Pilvio publishes no OpenAPI document; the tools follow the vendor's API reference at https://api.pilvio.com/. The older endpoints take form-encoded bodies and the network endpoints take JSON, as the reference shows. Every mutation requires approval.

**Auth:** API token, sent in the `apikey` header. Create one in the Pilvio console (https://pilvio.com, user settings, API tokens). Pilvio has no OAuth. The health check reads the current user.

**Known gaps:** payments and card changes (pay invoice, buy credit, add or remove a card, recurring payments, deleting or updating billing accounts) are deliberately not exposed. The firewall rule and load balancer bodies follow the reference examples; the reference does not give every field's limits. Pilvio has no endpoint that lists VMs across locations, so list each location separately.
 Not exposed either: load balancer billing account changes and the `show_shadow` option on billing account listing.

**Unconfirmed details:** the reference does not say whether `deleteBucket` sends `name` as a query or form field (query is used). Firewall update naming (`display_name`) follows the create shape; the reference's update example uses `name` and `description`, so this is unconfirmed. `reserve_public_ip` is sent as a boolean though the reference example shows the string "true". `listReplicas` takes an optional `r_type` (default `snapshot`; `backup` for backups).
