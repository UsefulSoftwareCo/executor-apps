# GoTable

Restaurant reservations on GoTable: restaurants, accounts, reservations (create, update, cancel, notes), guests, offers, tables and table combinations, availability, reviews and webhooks.

**Interface:** OpenAPI. GoTable's official definition is published at https://en.gotable.app/api/docs/v1/swagger.yaml (linked from https://en.gotable.app/developer/rest-api). Requests go to `https://gotable.app/api/v1`.

**Auth:** API key sent as a Bearer token. Create a Restaurant API key on the restaurant's integrations page, or an Account API key on your personal account settings page (access to every restaurant on the account). Partner keys require contacting GoTable. GoTable has no user-created OAuth apps.

**Known gaps:** none known; every mutation asks for approval. Cancelling a reservation is irreversible and creating one may notify the guest.
