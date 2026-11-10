# Perdoo

Objectives, key results, initiatives, teams and the rest of Perdoo's OKR platform, through its GraphQL API.

**Interface:** GraphQL at `https://eu.perdoo.com/graphql/` (Perdoo's public schema is published at
https://studio.apollographql.com/public/Perdoo-GQL/variant/current/home). Tools are generated from the schema by
introspection once an account is connected; every mutation requires approval.

**Auth:** API token (`apiKey`), sent as `Authorization: Bearer <token>`. Create it in Perdoo under profile icon >
Personal Settings > API Tokens > Generate; the 64-character token is shown once. Perdoo has no user-created OAuth apps.

**Known gaps:** Perdoo disables introspection for unauthenticated requests, so the tool catalog could not be
inspected without an account; it is built on first use with a connected token. The endpoint is the EU host
(`eu.perdoo.com`); accounts hosted elsewhere are not covered. The health check queries `me { id }`.
