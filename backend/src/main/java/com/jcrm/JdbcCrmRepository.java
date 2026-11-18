package com.jcrm;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import static com.jcrm.Domain.*;

@Repository
class JdbcCrmRepository implements CrmRepository {
    private final JdbcTemplate jdbc;
    JdbcCrmRepository(JdbcTemplate jdbc, SchemaMigration migration) { this.jdbc = jdbc; }
    public boolean workspaceExists(String w) { return jdbc.queryForObject("SELECT COUNT(*) FROM workspaces WHERE id = ? AND expires_at > ?", Integer.class, w, Instant.now().toString()) > 0; }
    public String workspaceName(String w) { return jdbc.queryForObject("SELECT name FROM workspaces WHERE id = ?", String.class, w); }
    public void createWorkspace(String id, String now, String expires) { jdbc.update("INSERT INTO workspaces(id,name,created_at,expires_at) VALUES (?,'Acme workspace',?,?)", id, now, expires); }
    public void deleteWorkspace(String w) { jdbc.update("DELETE FROM workspaces WHERE id = ?", w); }
    public void deleteExpired(String now) { jdbc.update("DELETE FROM workspaces WHERE expires_at < ?", now); }

    public Records read(String w) {
        var members = jdbc.query("SELECT * FROM members WHERE workspace_id = ? ORDER BY rowid", (r,n) -> new Member(r.getString("id"),r.getString("name"),r.getString("initials"),r.getString("color"),r.getString("role")),w);
        var accounts = jdbc.query("SELECT * FROM accounts WHERE workspace_id = ? ORDER BY name", (r,n) -> new Account(r.getString("id"),r.getString("name"),r.getString("industry"),r.getString("website"),r.getString("initials"),r.getString("color"),r.getInt("employees"),r.getString("location"),r.getString("description"),r.getString("owner_id"),r.getString("status"),r.getInt("version")),w);
        var contacts = jdbc.query("SELECT * FROM contacts WHERE workspace_id = ? ORDER BY name", (r,n) -> new Contact(r.getString("id"),r.getString("account_id"),r.getString("name"),r.getString("email"),r.getString("job_title"),r.getString("phone"),r.getString("initials"),r.getString("color")),w);
        var deals = jdbc.query("SELECT * FROM opportunities WHERE workspace_id = ? ORDER BY created_at DESC,name", (r,n) -> new Deal(r.getString("id"),r.getString("account_id"),r.getString("contact_id"),r.getString("name"),r.getLong("amount_cents"),r.getString("stage"),LocalDate.parse(r.getString("close_date")),r.getString("actual_close_date")==null?null:LocalDate.parse(r.getString("actual_close_date")),r.getString("owner_id"),Instant.parse(r.getString("last_buyer_activity")),Instant.parse(r.getString("created_at")),r.getInt("version")),w);
        var activities = jdbc.query("SELECT * FROM activities WHERE workspace_id = ? ORDER BY happened_at DESC", (r,n) -> new Activity(r.getString("id"),r.getString("deal_id"),r.getString("account_id"),r.getString("kind"),r.getString("title"),r.getString("body"),Instant.parse(r.getString("happened_at")),r.getString("owner_id")),w);
        var tasks = jdbc.query("SELECT * FROM tasks WHERE workspace_id = ? ORDER BY due_date,title", (r,n) -> new Task(r.getString("id"),r.getString("deal_id"),r.getString("account_id"),r.getString("title"),LocalDate.parse(r.getString("due_date")),r.getString("owner_id"),r.getBoolean("completed"),r.getInt("version")),w);
        return new Records(members,accounts,contacts,deals,activities,tasks);
    }
    public void insertMember(String w, Member m) { jdbc.update("INSERT INTO members(id,workspace_id,name,initials,color,role) VALUES (?,?,?,?,?,?)",m.id(),w,m.name(),m.initials(),m.color(),m.role()); }
    public void insertAccount(String w, Account a) { jdbc.update("INSERT INTO accounts VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",a.id(),w,a.name(),a.industry(),a.website(),a.initials(),a.color(),a.employees(),a.location(),a.description(),a.ownerId(),a.status(),a.version()); }
    public int updateAccount(String w, Account a) { return jdbc.update("UPDATE accounts SET name=?,industry=?,website=?,employees=?,location=?,description=?,owner_id=?,status=?,initials=?,version=version+1 WHERE workspace_id=? AND id=? AND version=?",a.name(),a.industry(),a.website(),a.employees(),a.location(),a.description(),a.ownerId(),a.status(),a.initials(),w,a.id(),a.version()); }
    public void insertContact(String w, Contact c) { jdbc.update("INSERT INTO contacts VALUES (?,?,?,?,?,?,?,?,?)",c.id(),w,c.accountId(),c.name(),c.email(),c.jobTitle(),c.phone(),c.initials(),c.color()); }
    public void updateContact(String w, Contact c) { jdbc.update("UPDATE contacts SET account_id=?,name=?,email=?,job_title=?,phone=?,initials=? WHERE workspace_id=? AND id=?",c.accountId(),c.name(),c.email(),c.jobTitle(),c.phone(),c.initials(),w,c.id()); }
    public void insertDeal(String w, Deal d) { jdbc.update("INSERT INTO opportunities VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",d.id(),w,d.accountId(),d.contactId(),d.name(),d.amountCents(),d.stage(),d.closeDate().toString(),d.actualCloseDate()==null?null:d.actualCloseDate().toString(),d.ownerId(),d.lastBuyerActivity().toString(),d.createdAt().toString(),d.version()); }
    public int updateDeal(String w, Deal d) { return jdbc.update("UPDATE opportunities SET account_id=?,contact_id=?,name=?,amount_cents=?,stage=?,close_date=?,actual_close_date=?,owner_id=?,last_buyer_activity=?,version=version+1 WHERE workspace_id=? AND id=? AND version=?",d.accountId(),d.contactId(),d.name(),d.amountCents(),d.stage(),d.closeDate().toString(),d.actualCloseDate()==null?null:d.actualCloseDate().toString(),d.ownerId(),d.lastBuyerActivity().toString(),w,d.id(),d.version()); }
    public void insertActivity(String w, Activity a) { jdbc.update("INSERT INTO activities VALUES (?,?,?,?,?,?,?,?,?)",a.id(),w,a.dealId(),a.accountId(),a.kind(),a.title(),a.body(),a.happenedAt().toString(),a.ownerId()); }
    public void insertTask(String w, Task t, String key) { jdbc.update("INSERT INTO tasks VALUES (?,?,?,?,?,?,?,?,?,?)",t.id(),w,t.dealId(),t.accountId(),t.title(),t.dueDate().toString(),t.ownerId(),t.completed()?1:0,t.version(),key); }
    public String taskByRequestKey(String w,String key) { if(key==null) return null; return jdbc.query("SELECT id FROM tasks WHERE workspace_id=? AND request_key=?",(r,n)->r.getString(1),w,key).stream().findFirst().orElse(null); }
    public int updateTask(String w,Task t) { return jdbc.update("UPDATE tasks SET deal_id=?,account_id=?,title=?,due_date=?,owner_id=?,completed=?,version=version+1 WHERE workspace_id=? AND id=? AND version=?",t.dealId(),t.accountId(),t.title(),t.dueDate().toString(),t.ownerId(),t.completed()?1:0,w,t.id(),t.version()); }
    public void stageEvent(String w,String deal,String from,String to,String now) { jdbc.update("INSERT INTO stage_events VALUES (?,?,?,?,?,?)",UUID.randomUUID().toString(),w,deal,from,to,now); }
}
