# Container deployment

The multi-stage [Dockerfile](../Dockerfile) builds the React UI, runs the Java integration tests, and packages a Java 25 application serving both the UI and API. The runtime needs no Node, Maven, external database, or AI credentials. It runs as UID/GID `10001:10001` and stores SQLite at `/data/jcrm.db`.

## DevStation LivePreview

Select these settings when creating the preview from GitHub:

| Setting | Value |
| --- | --- |
| Branch | `main` |
| Build strategy | Compose |
| Repository/build directory | `.` (repository root) |
| Compose path | `docker-compose.preview.yml` |
| Public service | `jcrm` |
| Container port | `8080` |
| Health endpoint | `/api/health` |
| Resource allowance | At least 512 MB memory and 1 CPU |

No environment variables or `.env` file are required. The preview Compose file declares the runtime settings, public service, health check, and named SQLite volume. DevStation supplies the public URL, port mapping, and HTTPS routing. The app accepts the platform's `PORT` environment variable.

The preview builds entirely from the repository; it uses no host bind mounts. The UI and API share one origin, so no API URL or CORS setting is needed. Startup applies database migrations. Opening the app creates a complete seeded workspace for that browser; the health check does not create demo workspaces.

The named volume retains data when the same preview container is recreated with its volume attached. Preview deletion or volume cleanup can remove that data; a newly created preview can have a new volume. Treat previews as disposable demos.

For a local run with Docker Engine and Compose v2 or newer:

```bash
docker compose -f docker-compose.preview.yml up -d --build --wait
docker compose -f docker-compose.preview.yml port jcrm 8080
```

Open the reported host port in your browser. The host port is assigned dynamically to avoid conflicts with local development servers. To stop the preview:

```bash
docker compose -f docker-compose.preview.yml down
```

## Single-host production deployment

[docker-compose.prod.yml](../docker-compose.prod.yml) adds automatic restart, a read-only root filesystem, restricted container privileges, resource limits, and rotating logs. Its writable `/tmp` permits SQLite JDBC's native library to load; persistent data stays in the named `/data` volume. Keep one application replica on a single Docker host while using SQLite.

```bash
cp .env.production.example .env.production
# Edit .env.production for this host.
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build --wait
```

The defaults bind to `127.0.0.1:8080`. Put a trusted HTTPS reverse proxy in front of this listener. If your proxy runs in another container, provide a reachable binding/network for it; its own loopback address does not reach the app. `HTTP_BIND` and `HTTP_PORT` control the host listener; the application's container port remains `8080`.

`SERVER_FORWARD_HEADERS_STRATEGY=framework` accepts forwarded host/protocol headers from the proxy. The proxy should replace incoming forwarded headers. If serving directly without a proxy, set this variable to `none`; set `HTTP_BIND=0.0.0.0` if direct access from other machines is intended.

The `.env.production` file is ignored by Git. Compose reads it because the command explicitly selects it; the Java application does not load `.env` files itself. No application secrets are required for the current demo. Juno uses deterministic demo intelligence, and visitor workspaces are anonymous. This deployment retains those demo behaviors; production identity, permissions, live AI, and PostgreSQL remain future integrations.

To deploy a newer checkout, run the same `up -d --build --wait` command. Compose recreates the service while keeping its data volume. Do not use `down --volumes` or `down -v` unless you intend to delete the database. Keep the Compose project name stable so updates reuse the same volume.

Inspect status and logs with:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail 100 -f jcrm
```

### Backup

The runtime includes the SQLite CLI. Create a consistent online backup and copy it off the Docker host:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T jcrm sqlite3 /data/jcrm.db ".backup '/data/jcrm-backup.db'"
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T jcrm sqlite3 /data/jcrm-backup.db 'PRAGMA integrity_check;'
docker compose --env-file .env.production -f docker-compose.prod.yml cp jcrm:/data/jcrm-backup.db ./jcrm-backup.db
```

The integrity check should print `ok`. Store the copied file outside the repository/host as appropriate. Avoid copying just the live `jcrm.db` file, since recent writes may be in its WAL file. To restore, stop the application, replace the database in its existing volume from a verified backup, remove stale WAL/SHM files while stopped, preserve UID/GID `10001:10001` ownership, and start the service again. Keep the original volume/backup until the restore is verified.

## Verify the containers

```bash
npm run test:containers
```

Requires Docker Engine, Compose v2+, and a supported Node version. It builds the image, validates both Compose files, and starts isolated preview and production projects. Checks cover health, non-root execution, automatic demo seeding, bundled assets, deep links, the production read-only filesystem, saved edits across recreation, and SQLite backup integrity. Only the test projects' volumes are removed during cleanup.

To reuse an image you already built:

```bash
JCRM_IMAGE=jcrm:local npm run test:containers -- --skip-build
```

The preview file was also validated against DevStation's actual Compose parser: one public service on port 8080, 512 MB memory, 1 CPU, the health check, and the named volume were preserved. A hosted LivePreview deployment has not been created as part of this verification.
