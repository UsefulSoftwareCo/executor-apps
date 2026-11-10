# IdentityCheck

Covers IDnow's iDCHECK.IO identity verification platform (the SDK-WEB REST API): onboarding sessions and their status,
captured document content, sending capture links, onboarding web app
configurations, and webhook notification endpoints (16 tools, covering every operation in the vendor reference, including the identity-proofing link).

**Interface:** hand-written tools over the vendor's REST API. IDnow publishes
only an AsciiDoc reference (https://sdkweb.idcheck.ariadnext.io/rest/api/index.html), not
a machine-readable OpenAPI document, so the paths and fields come from that
reference.

**Auth:** one method, an iDCHECK.IO customer account login. The API uses an
OAuth2 password grant against the `customer-identity` Keycloak realm; there are
no API keys and no user-created OAuth apps. Enter:

- `environment`: `production` or `sandbox`
- `client_id`: the OpenID client ID IDnow gave you for the token endpoint (the reference does not state it)
- `username` and `password`: your iDCHECK.IO API account credentials

The account is issued by IDnow when you sign up at https://www.idnow.io/. The
app signs in and caches the access token for a few minutes. Production hosts are
`sdkweb.idcheck.ariadnext.io` and `api.idcheck.ariadnext.io`; sandbox hosts end in
`idcheck-sandbox.ariadnext.io`. Legacy hosts (`*.idcheck.io`, `*.ariadnext.com`)
and PVID are not included.

**Auth sources:** the vendor reference (OAuth2 password flow, Keycloak
`customer-identity` token URL) is the authority. The reference never mentions
`client_id`; it is required by the Keycloak password grant, but how IDnow issues
it (and whether it is a fixed public value) is unconfirmed, so the field may be
unnecessary or may need a value from IDnow support. Sign-in has not been
validated against a real account.

**Icon:** IDnow publishes no iDCHECK.IO product mark (the vendor reference and
https://idnow.io/press/ only offer the IDnow company wordmark, as AVIF). The
icon is that wordmark, a documented exception to the product-mark rule; replace
it if IDnow supplies a product mark (press@idnow.io).

**Known gaps:** request bodies for configurations, endpoints and the two send-link
operations are free-form JSON following the vendor reference; legacy hosts and
PVID are not included.
