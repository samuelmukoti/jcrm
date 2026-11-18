# Moving JCRM to PostgreSQL

SQLite is the implemented demo database. A PostgreSQL profile and data transfer tool are future work; switching the JDBC URL alone will not migrate this application.

1. Add the PostgreSQL JDBC dependency and a datasource profile. Keep the `CrmRepository` contract; replace SQLite connection pragmas and its single-connection pool configuration with PostgreSQL settings.
2. Add vendor-specific migrations under `db/migration/postgresql/` and let `SchemaMigration` select the configured vendor directory. Replace SQLite's member ordering by `rowid` with an explicit member display order.
3. Map application UUID strings to PostgreSQL UUID parameters, amounts to BIGINT cents, booleans to BOOLEAN, close/due dates to DATE, and instants to TIMESTAMPTZ. Preserve composite workspace/record keys, scoped foreign keys, record versions, and request-key uniqueness.
4. Export the SQLite workspace data into a stable format. Load parents before children, including activity and stage history. Validate row counts, relationships, amounts, date/time values, and dashboard totals. Expired demo sessions can be discarded intentionally.
5. Run repository/API contracts against PostgreSQL, including transaction rollback, stale edits, repeated task submissions, visitor isolation, reset, and the primary browser story.
6. Stop writes, take a SQLite-consistent backup, perform the final transfer and validation, then switch the deployment. Retain the original database for rollback until verification passes.

The API, frontend contracts, CRM service rules, and assistant interface remain independent of the database. Database-specific behavior belongs in datasource configuration, migrations, and repository SQL/mappings.
