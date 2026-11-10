# pVerify

US healthcare insurance verification through pVerify: real-time eligibility and benefits (including dental, same-or-similar, MBI lookup and SNF), claim status, insurance discovery, patient finder, estimates, CMN, payer list and status, pending inquiries, and PDF reports.

## Interface

OpenAPI. pVerify serves its own Swagger 2.0 document at https://api.pverify.com/swagger/docs/v1 (41 operations). The app downloads it, drops the `/Token` operation and the `Authorization` and `Client-Api-Id` header parameters (the app supplies those), and compiles the rest into tools. Every POST is a mutation and requires approval; the inquiry endpoints run real, billable payer transactions.

## Auth

Client credentials. Create a Client ID and Client Secret in pVerify's API management portal (https://apimgmt.pverify.com/). Connect with:

- `apiHost`: `api.pverify.com` (production) or `testapi.pverify.com` (test credentials).
- `clientId` and `clientSecret`.

The app exchanges them at `/Token` (form `Client_Id`, `Client_Secret`, `grant_type=client_credentials`) for a bearer token, caches it, and sends `Client-Api-Id: <clientId>` on every call. There is no OAuth redirect. Official docs: https://postman.pverify.com/.

## Known gaps

- The Swagger document types most responses as a bare `object`, so response shapes are not described in the tool output.
- Operation names are long because the document's operation ids repeat their controller names.
- Only `api.pverify.com` and `testapi.pverify.com` are accepted as hosts.
