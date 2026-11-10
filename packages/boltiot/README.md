# Bolt IoT

Control Bolt IoT devices through Bolt Cloud: digital and analog pin reads and writes, serial (UART) begin/read/write/write-read, device status (`isOnline`, `isAlive`), hardware/firmware `version` and `restart`. Every tool takes the `deviceName` (for example `BOLT12345678`).

**Interface:** hand-written tools over the documented Bolt Cloud remote API (`https://cloud.boltiot.com/remote/<api_key>/<command>?deviceName=...`, reference at https://cloud.boltiot.com/apiDoc). Bolt publishes no OpenAPI document and no remote MCP server, so the 12 commands (the 10 on the docs page plus `isOnline` and `serialWR`) are wrapped directly. Mutating commands (`digitalWrite`, `analogWrite`, `serialBegin`, `serialWrite`, `serialWriteRead`, `restart`) require approval. The vendor docs show `http://`; the API also serves `https://`, which this package uses. `isOnline` and `serialWR` are not on the vendor docs page; they are undocumented commands, so treat them as unofficial. Failures (HTTP 200 with `success` of `0`) and non-2xx or 429 responses are raised as errors.

**Auth:** API key. Generate it in the Bolt Cloud control panel (https://cloud.boltiot.com, API section, "Generate New API key") and make sure it is enabled. The key travels in the URL path, as the API requires. Bolt has no OAuth.

**Icon:** the Bolt signal mark cropped from the official app icon at https://boltiot.com/assets/images/favicon.png (not in Simple Icons).

**Health check:** Bolt has no account-level endpoint, so the health check calls the read-only `version` command with a placeholder device (`BOLT0`) and fails only on the vendor reply `Invalid API key` (confirmed for a bad key). The reply for a valid key with an unknown device was not verified (no real key available); any other reply counts as healthy.

**Known gaps:** vendor docs for pin ranges (0-7/A0-A3 vs 1-5 for analogWrite) and baud codes are inconsistent, so pin and baud inputs are passed through unvalidated. The vendor page says nothing about deprecating `isAlive`.
