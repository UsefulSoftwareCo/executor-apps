# Oracle HCM

Oracle Fusion Cloud HCM: workers, employees, the public worker directory, absences, jobs, grades, positions, departments, locations, legal employers, business units, user accounts, payment methods, goals, performance documents, work relationships and recruiting, plus generic `resource.*` tools for any other HCM REST resource or child collection, a `describe` tool and custom actions.

Interface: hand-written tools over the Oracle HCM Cloud REST API (`https://<pod>.oraclecloud.com/hcmRestApi/resources/11.13.18.05/...`), documented at https://docs.oracle.com/en/cloud/saas/human-resources/farws/. Oracle publishes no stable public OpenAPI document and the API is tenant hosted, so the common resources are named and the rest are reachable through `resource.*`. Every write requires approval.

Auth: username and password (HTTP Basic), the method Oracle documents for the REST API. Connect with your pod host (for example `acme.fa.us2.oraclecloud.com`, no path) and the credentials of an Oracle Cloud user that has the HCM REST roles/privileges for the resources you want. Only `*.oraclecloud.com` hosts are accepted. Oracle Fusion applications do not let customers register OAuth apps for this API without Oracle Identity Cloud Service setup, so OAuth is not offered.

Known gaps: resource names and availability depend on the pod's release and enabled offerings; use `describe` to confirm. Version defaults to 11.13.18.05 and can be overridden per call (or `latest`). Not verified against a live pod.
