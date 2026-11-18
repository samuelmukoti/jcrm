# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS frontend-build
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --include=dev
COPY frontend/ ./
RUN npm run build

FROM eclipse-temurin:25-jdk-noble AS java-build
WORKDIR /src
# Bound JVM worker counts while building on shared preview hosts.
ENV JAVA_TOOL_OPTIONS="--enable-native-access=ALL-UNNAMED -XX:ActiveProcessorCount=2"
COPY .mvn/ .mvn/
COPY --chmod=0755 mvnw ./mvnw
COPY pom.xml ./
COPY backend/pom.xml backend/pom.xml
RUN ./mvnw -B -pl backend -am dependency:go-offline
COPY backend/src/ backend/src/
COPY --from=frontend-build /src/frontend/dist/ frontend/dist/
# Run the real SQLite/JUnit integration tests before producing the runtime image.
RUN ./mvnw -B -pl backend -am package

FROM eclipse-temurin:25-jre-noble AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl sqlite3 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 jcrm \
    && useradd --uid 10001 --gid jcrm --home-dir /app --no-create-home --shell /usr/sbin/nologin jcrm \
    && mkdir -p /app /data \
    && chown jcrm:jcrm /app /data
WORKDIR /app
COPY --from=java-build --chown=jcrm:jcrm /src/backend/target/jcrm-api-1.0.0.jar /app/jcrm.jar
COPY --chmod=0755 docker/healthcheck.sh /app/healthcheck.sh
ENV PORT=8080 \
    JCRM_DB_PATH=/data/jcrm.db
USER 10001:10001
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=45s --retries=4 CMD ["/app/healthcheck.sh"]
ENTRYPOINT ["java", "--enable-native-access=ALL-UNNAMED", "-XX:MaxRAMPercentage=60.0", "-XX:+ExitOnOutOfMemoryError", "-jar", "/app/jcrm.jar"]
