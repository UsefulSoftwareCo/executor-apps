# College Football Data

Games, teams, rosters, play-by-play, drives, rankings, SP+/Elo/FPI ratings, recruiting, transfer portal, betting lines, advanced metrics and more from [CollegeFootballData.com](https://collegefootballdata.com). All operations are read-only.

## Interface

OpenAPI 3.0 (official), loaded live from https://api.collegefootballdata.com/api-docs.json. The vendor also has a GraphQL API, which is not used because the REST API is the complete one.

## Auth

- **API key** (bearer token). Create a free key at https://collegefootballdata.com/key. It is sent as `Authorization: Bearer <key>` to `api.collegefootballdata.com`. The vendor offers no OAuth.

## Known gaps

Free keys have a monthly call quota; `info` reports current usage.
