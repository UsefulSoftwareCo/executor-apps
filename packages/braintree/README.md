# Braintree

Braintree payments: transactions, vaulted payment methods, customers, refunds, disputes and reports.

**Interface:** Braintree's official GraphQL API (`https://payments.braintree-api.com/graphql`, sandbox at `https://payments.sandbox.braintree-api.com/graphql`). Tools are generated from the schema by introspection at runtime. Every request sends the required `Braintree-Version: 2019-01-01` header. Mutations require approval.

**Auth:** gateway API keys. In the Braintree Control Panel go to Settings > API and create or copy a public and private key (use the sandbox control panel for sandbox keys). Choose the environment (`production` or `sandbox`), then enter the public key and private key. They are sent as HTTP Basic credentials.

**Known gaps:** OAuth is not offered. Braintree only issues OAuth tokens to registered partner integrations, and the authorization flow needs a merchant id in the redirect, which user-created OAuth apps cannot obtain. The older server-side gateway (XML) API is not covered, only GraphQL.
