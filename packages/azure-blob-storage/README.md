# Azure Blob Storage

Containers and blobs in an Azure Storage account: list and create containers, list and find blobs (including by index tags), download and upload text blobs, copy, snapshot, undelete, delete, and read or set metadata and tags. 17 tools.

## Interface

Hand-written tools over the official Blob service REST API (https://learn.microsoft.com/rest/api/storageservices/blob-service-rest-api), service version 2025-05-05. Microsoft publishes no OpenAPI document for the data plane, so this covers the most-used operations. Requests go to `https://<account>.blob.core.windows.net`. List operations return Azure's XML as text; blob content is read and written as text.

## Auth

- SAS token: in the Azure portal open the storage account (or a container), Shared access signature, choose permissions and an expiry, and copy the SAS token (a leading `?` is accepted and stripped). Enter the storage account name and the token. A SAS account is tied to one storage account; `storageAccount` is then optional on tools.
- OAuth 2.0 (Microsoft Entra ID, delegated): register an app in Entra ID, add a Web redirect URI matching the one Executor shows on the connect page, create a client secret, and add the Azure Storage delegated permission `user_impersonation`. Enter the client id and secret on the connect page. Endpoints are declared explicitly (`https://login.microsoftonline.com/common/oauth2/v2.0/authorize` and `/token`, client secret in the POST body) because the `/common` OIDC metadata has a templated issuer that strict validation rejects. Executor's PKCE use is harmless here: Entra accepts PKCE alongside a client secret for web apps. The scope is the documented delegated `https://storage.azure.com/user_impersonation`. The signed-in user needs an Azure RBAC data role (for example Storage Blob Data Contributor) on the storage account. An OAuth account works with any storage account, so tools require `storageAccount`.

Shared Key (account key) auth needs request signing and is not supported.

## Known gaps

- Only public-cloud `*.blob.core.windows.net` accounts; sovereign clouds and custom domains are not covered.
- No binary upload/download, append or page blobs, block-level staging, leases, or service-level properties.
- The OAuth connection cannot be verified at connect time because the token is not tied to one account; the SAS connection is verified with Get Account Information.
- The icon is the Blob Block icon from Microsoft's official Azure architecture icon set.
