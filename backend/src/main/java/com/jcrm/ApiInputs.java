package com.jcrm;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

final class ApiInputs {
    private ApiInputs() {}
    record DealInput(@NotBlank @Size(max=180) String name,@NotBlank String accountId,String contactId,@Min(0) @Max(100000000000000L) long amountCents,@NotBlank String stage,@NotNull LocalDate closeDate,@NotBlank String ownerId,@Min(1) int version) {}
    record StageInput(@NotBlank String stage,@Min(1) int version,@PastOrPresent LocalDate restoreCloseDate) {}
    record AccountInput(@NotBlank @Size(max=120) String name,@NotBlank @Size(max=100) String industry,@Size(max=200) String website,@Min(0) @Max(10000000) int employees,@NotNull @Size(max=200) String location,@NotNull @Size(max=4000) String description,@NotBlank String ownerId,@NotBlank @Pattern(regexp="Prospect|Customer|Partner") String status,@Min(1) int version) {}
    record ContactInput(@NotBlank String accountId,@NotBlank @Size(max=120) String name,@NotBlank @Email @Size(max=200) String email,@NotNull @Size(max=120) String jobTitle,@NotNull @Size(max=60) String phone) {}
    record TaskInput(String dealId,@NotBlank String accountId,@NotBlank @Size(max=200) String title,@NotNull LocalDate dueDate,@NotBlank String ownerId,boolean completed,@Min(1) int version,@Size(max=100) String requestKey) {}
    record ActivityInput(String dealId,@NotBlank String accountId,@NotBlank String kind,@NotBlank @Size(max=180) String title,@NotBlank @Size(max=8000) String body,@NotBlank String ownerId,boolean buyerResponse) {}
    record AiInput(@NotBlank String action,String dealId,@Size(max=1000) String question) {}
}
