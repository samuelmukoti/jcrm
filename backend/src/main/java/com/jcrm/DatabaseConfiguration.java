package com.jcrm;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.sqlite.SQLiteConfig;
import org.sqlite.SQLiteDataSource;
import javax.sql.DataSource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;

@Configuration
class DatabaseConfiguration {
    @Bean
    Clock clock() { return Clock.systemUTC(); }

    @Bean
    DataSource dataSource(@Value("${jcrm.database}") String location) throws Exception {
        Path file = Path.of(location).toAbsolutePath();
        Files.createDirectories(file.getParent());
        SQLiteConfig sqlite = new SQLiteConfig();
        sqlite.enforceForeignKeys(true);
        sqlite.setBusyTimeout(5000);
        sqlite.setJournalMode(SQLiteConfig.JournalMode.WAL);
        SQLiteDataSource source = new SQLiteDataSource(sqlite);
        source.setUrl("jdbc:sqlite:" + file);
        HikariConfig pool = new HikariConfig();
        pool.setDataSource(source);
        pool.setMaximumPoolSize(1);
        pool.setConnectionTimeout(10000);
        pool.setPoolName("jcrm-sqlite");
        return new HikariDataSource(pool);
    }
}
