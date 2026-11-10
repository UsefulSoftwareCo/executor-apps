# Minerstat

Live crypto mining data from Minerstat's Data API: coins (network hashrate, difficulty, block reward, price, history), hardware (ASICs, GPUs, CPUs, FPGAs with benchmarks), algorithms, pools and ranked profitability for a hardware and electricity price. All 13 operations are read-only. This covers the public Data API, not the older worker Monitoring or Management APIs (those are not documented publicly).

**Interface:** Minerstat's official OpenAPI 3.1 document at https://api.minerstat.com/v3/openapi.json, compiled live into tools (10 `/v3` operations plus the legacy `/v2` coins, hardware and pools listings). Requests go to `https://api.minerstat.com`.

**Auth:** API key, sent as the `X-Api-Key` header. Create a free key at https://minerstat.com/developers (one email). Minerstat has no OAuth for this API. The free plan allows 100 requests a month with responses capped at 20 results; the profitability endpoint needs the Enterprise plan. The health check lists one coin.

**Icon:** the official Minerstat mark from https://minerstat.com/icon.svg (not in Simple Icons).

**Known gaps:** the spec also lists `https://minerstat.com` as a server; only `api.minerstat.com` is used. Worker monitoring and management endpoints are not exposed.
