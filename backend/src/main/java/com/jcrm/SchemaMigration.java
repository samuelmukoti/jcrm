package com.jcrm;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HexFormat;

@Component
class SchemaMigration implements InitializingBean {
    private final JdbcTemplate jdbc;
    private final TransactionTemplate transactions;

    SchemaMigration(JdbcTemplate jdbc, TransactionTemplate transactions) {
        this.jdbc = jdbc;
        this.transactions = transactions;
    }

    public void afterPropertiesSet() throws Exception {
        jdbc.execute("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL)");
        var resources = new PathMatchingResourcePatternResolver().getResources("classpath:db/migration/sqlite/V*__*.sql");
        Arrays.sort(resources, Comparator.comparing(r -> r.getFilename()));
        for (var resource : resources) {
            String version = resource.getFilename();
            String checksum = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(resource.getContentAsByteArray()));
            var existing = jdbc.queryForList("SELECT checksum FROM schema_migrations WHERE version = ?", String.class, version);
            if (!existing.isEmpty()) {
                if (!existing.getFirst().equals(checksum)) throw new IllegalStateException("Migration changed after application: " + version);
                continue;
            }
            transactions.executeWithoutResult(status -> {
                jdbc.execute((org.springframework.jdbc.core.ConnectionCallback<Void>) connection -> {
                    ScriptUtils.executeSqlScript(connection, resource);
                    return null;
                });
                jdbc.update("INSERT INTO schema_migrations VALUES (?, ?, ?)", version, checksum, java.time.Instant.now().toString());
            });
        }
    }
}
