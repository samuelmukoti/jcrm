package com.jcrm;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class Domain {
    private Domain() {}
    public static final List<String> STAGES = List.of("Qualified", "Discovery", "Proposal", "Negotiation", "Won", "Lost");
    public record Workspace(String id, String name, String timezone, LocalDate today) {}
    public record Member(String id, String name, String initials, String color, String role) {}
    public record Account(String id, String name, String industry, String website, String initials, String color,
                          int employees, String location, String description, String ownerId, String status, int version) {}
    public record Contact(String id, String accountId, String name, String email, String jobTitle, String phone, String initials, String color) {}
    public record Deal(String id, String accountId, String contactId, String name, long amountCents, String stage,
                       LocalDate closeDate, LocalDate actualCloseDate, String ownerId, Instant lastBuyerActivity, Instant createdAt, int version) {}
    public record Activity(String id, String dealId, String accountId, String kind, String title, String body, Instant happenedAt, String ownerId) {}
    public record Task(String id, String dealId, String accountId, String title, LocalDate dueDate, String ownerId, boolean completed, int version) {}
    public record Evidence(String label, String detail, String recordId) {}
    public record Insight(String dealId, int score, String level, String summary, List<Evidence> evidence) {}
    public record StageSummary(String stage, long amountCents, long count, int probability) {}
    public record TrendPoint(String label, long amountCents) {}
    public record Dashboard(long openPipelineCents, long weightedForecastCents, long wonValueCents, Double winRate,
                            long openCount, long wonCount, long lostCount, List<StageSummary> stages, List<TrendPoint> trend) {}
    public record Snapshot(Workspace workspace, List<Member> members, List<Account> accounts, List<Contact> contacts,
                           List<Deal> deals, List<Activity> activities, List<Task> tasks, List<Insight> insights, Dashboard dashboard) {}
    public record AiResult(String title, String body, String draft, List<Evidence> evidence, List<String> dealIds, String mode, Instant generatedAt) {}
}
