# beaconcha.in

Ethereum staking data from the beaconcha.in V2 API: validators and their balances, rewards, APY/ROI and performance, proposal/attestation/sync-committee/deposit/withdrawal slots, epochs, slots and blocks, staking queues and request fees, MEV timing and bids, ETH.STORE, entities and machine metrics.

**Interface:** OpenAPI. The spec is the official bundle published with the vendor docs, https://docs.beaconcha.in/v3/bundled.yaml (OpenAPI 3.0.4, all operations on `https://beaconcha.in`).

**Auth:** API key (`apiKey`), sent as `Authorization: Bearer <key>`. Create one at https://beaconcha.in/user/api-key-management (a 30-day free trial key is available). beaconcha.in offers no OAuth for its API.

**Notes and gaps:**
- Only the V2 API is covered. The legacy V1 API has no published OpenAPI document and is not exposed.
- Endpoints marked with the diamond in the docs (entities, MEV bids, validator metadata, etc.) need the Scale or Enterprise plan.
- Every V2 endpoint is a POST with a JSON body, but they only read data. The read operations are marked as queries and run without approval; only `SelfReportValidators` (`POST /validators/self-report`, which submits validator data to beaconcha.in) is a mutation and requires approval.
- `GetValidatorMetadata` is marked `x-internal` in the official spec and is excluded.
- `GetValidatorPtcSlots` and `GetSlotPtcDuties` are marked `x-hidden` in the spec (Payload Timeliness Committee, not yet generally available); they are exposed but may return nothing or change.
- `GetStakingQueues` (`/queues`): the vendor's Deprecation Notice says the legacy v2 response schema was sunset on 2026-07-02 23:59:59 UTC and all requests now receive the v2.1 schema. The package repoints the `application/json` response at the v2.1 schema (`QueueStats2.Container`).
- The health check calls `POST /api/v2/ethereum/config` on mainnet.
