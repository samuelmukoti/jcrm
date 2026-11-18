package com.jcrm;

import java.util.List;
import static com.jcrm.Domain.*;

interface CrmRepository {
    record Records(List<Member> members, List<Account> accounts, List<Contact> contacts, List<Deal> deals, List<Activity> activities, List<Task> tasks) {}
    boolean workspaceExists(String workspace);
    String workspaceName(String workspace);
    void createWorkspace(String id, String now, String expires);
    void deleteWorkspace(String workspace);
    void deleteExpired(String now);
    Records read(String workspace);
    void insertMember(String workspace, Member member);
    void insertAccount(String workspace, Account account);
    int updateAccount(String workspace, Account account);
    void insertContact(String workspace, Contact contact);
    void updateContact(String workspace, Contact contact);
    void insertDeal(String workspace, Deal deal);
    int updateDeal(String workspace, Deal deal);
    void insertActivity(String workspace, Activity activity);
    void insertTask(String workspace, Task task, String requestKey);
    String taskByRequestKey(String workspace, String key);
    int updateTask(String workspace, Task task);
    void stageEvent(String workspace, String dealId, String from, String to, String now);
}
