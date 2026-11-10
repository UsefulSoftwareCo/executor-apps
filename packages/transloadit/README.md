# Transloadit

Covers Transloadit's REST API: creating, inspecting, replaying and cancelling Assemblies, Templates, Template Credentials (stored S3/GCS/FTP/Dropbox/etc. access), billing, and queue slot stats.

**Interface:** hand-written tools over the REST API at https://api2.transloadit.com (docs: https://transloadit.com/docs/api/). Transloadit publishes no OpenAPI document, so each endpoint is written by hand. Requests use Signature Authentication: the package signs every request's `params` with HMAC-SHA384 using the Auth Secret, with a one-hour expiry and a random nonce.

**Auth:** API key. In the Transloadit console open Credentials (https://transloadit.com/c/template-credentials/) and copy the Auth Key and Auth Secret into the connect form. Bearer tokens are not used because they cannot call Template Credentials endpoints. No OAuth app is needed.

**Known gaps:** Assemblies are created from URLs or storage imports; local file upload (multipart/tus) is not supported. Live update streams, webhook signature verification and Smart CDN URL signing are not exposed. `region` selection uses the default api2 endpoint.
