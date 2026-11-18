package com.jcrm;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import static com.jcrm.Domain.*;

@Service
class CrmService {
    private final CrmRepository repo;
    private final Clock clock;
    static final Map<String,Integer> PROBABILITIES=Map.of("Qualified",20,"Discovery",40,"Proposal",60,"Negotiation",80,"Won",100,"Lost",0);
    CrmService(CrmRepository repo,Clock clock) { this.repo=repo; this.clock=clock; }
    static boolean isOpen(Deal d) { return !d.stage().equals("Won")&&!d.stage().equals("Lost"); }
    static ResponseStatusException invalid(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST,message); }
    static ResponseStatusException missing() { return new ResponseStatusException(HttpStatus.NOT_FOUND,"That record is no longer available in this workspace."); }
    static void changed(int count) { if(count!=1) throw new ResponseStatusException(HttpStatus.CONFLICT,"This record changed in another view. Refresh it before saving again."); }
    static String initials(String name) { String[] words=name.trim().split("\\s+"); return (""+words[0].charAt(0)+(words.length>1?words[words.length-1].charAt(0):' ')).trim().toUpperCase(); }
    @Transactional(readOnly=true)
    public Snapshot snapshot(String w,String period,String owner) {
        var r=repo.read(w);
        LocalDate today=LocalDate.now(clock);
        LocalDate from=switch(period) {case "month"->today.withDayOfMonth(1);case "all"->LocalDate.of(1900,1,1);default->today.withMonth(((today.getMonthValue()-1)/3)*3+1).withDayOfMonth(1);};
        LocalDate to=switch(period) {case "month"->from.plusMonths(1).minusDays(1);case "all"->LocalDate.of(9999,12,31);default->from.plusMonths(3).minusDays(1);};
        var owned=r.deals().stream().filter(d->owner.equals("all")||owner.equals(d.ownerId())).toList();
        var open=owned.stream().filter(CrmService::isOpen).filter(d->!d.closeDate().isBefore(from)&&!d.closeDate().isAfter(to)).toList();
        var closed=owned.stream().filter(d->!isOpen(d)&&d.actualCloseDate()!=null).filter(d->!d.actualCloseDate().isBefore(from)&&!d.actualCloseDate().isAfter(to)).toList();
        long wins=closed.stream().filter(d->d.stage().equals("Won")).count();
        long lost=closed.size()-wins;
        var stages=STAGES.subList(0,4).stream().map(s->new StageSummary(s,open.stream().filter(d->d.stage().equals(s)).mapToLong(Deal::amountCents).sum(),open.stream().filter(d->d.stage().equals(s)).count(),PROBABILITIES.get(s))).toList();
        var trend=new ArrayList<TrendPoint>();
        for(int i=5;i>=0;i--) {
            LocalDate month=today.minusMonths(i).withDayOfMonth(1);
            long sum=owned.stream().filter(d->d.stage().equals("Won")&&d.actualCloseDate()!=null&&d.actualCloseDate().withDayOfMonth(1).equals(month)).mapToLong(Deal::amountCents).sum();
            trend.add(new TrendPoint(month.getMonth().getDisplayName(java.time.format.TextStyle.SHORT,Locale.ENGLISH),sum));
        }
        var metrics=new Dashboard(open.stream().mapToLong(Deal::amountCents).sum(),open.stream().mapToLong(d->Math.round(d.amountCents()*PROBABILITIES.get(d.stage())/100.0)).sum(),closed.stream().filter(d->d.stage().equals("Won")).mapToLong(Deal::amountCents).sum(),closed.isEmpty()?null:(double)wins/closed.size(),open.size(),wins,lost,stages,trend);
        var insights=r.deals().stream().filter(CrmService::isOpen).map(d->insight(d,r.tasks(),today)).sorted(Comparator.comparingInt(Insight::score).reversed()).toList();
        return new Snapshot(new Workspace(w,repo.workspaceName(w),"UTC",today),r.members(),r.accounts(),r.contacts(),r.deals(),r.activities(),r.tasks(),insights,metrics);
    }
    static Insight insight(Deal d,List<Task> tasks,LocalDate today) {
        var evidence=new ArrayList<Evidence>();
        long days=ChronoUnit.DAYS.between(d.lastBuyerActivity().atZone(java.time.ZoneOffset.UTC).toLocalDate(),today);
        int score=0;
        if(days>=7) { score+=30; evidence.add(new Evidence("Buyer activity","No buyer activity in "+days+" days",d.id())); }
        if(!d.closeDate().isAfter(today.plusDays(10))) {score+=20; evidence.add(new Evidence("Close date",(d.closeDate().isBefore(today)?"Target close date has passed: ":"Expected to close on ")+d.closeDate(),d.id()));}
        var pending=tasks.stream().filter(t->d.id().equals(t.dealId())&&!t.completed()).toList();
        if(pending.isEmpty()) {score+=20; evidence.add(new Evidence("Next step","No open follow-up task",d.id()));}
        if(pending.stream().anyMatch(t->t.dueDate().isBefore(today))) {score+=20;evidence.add(new Evidence("Overdue work","An overdue task needs attention",d.id()));}
        if(evidence.isEmpty()) evidence.add(new Evidence("On track","Recent buyer activity and a scheduled next step",d.id()));
        return new Insight(d.id(),score,score>=60?"Needs attention":score>=30?"Watch closely":"On track",evidence.getFirst().detail(),evidence);
    }
    private Account account(CrmRepository.Records r,String id) { return r.accounts().stream().filter(a->a.id().equals(id)).findFirst().orElseThrow(CrmService::missing); }
    private void owner(CrmRepository.Records r,String id) { if(r.members().stream().noneMatch(m->m.id().equals(id))) throw invalid("Choose an owner from this workspace."); }
    private Deal deal(CrmRepository.Records r,String id) { return r.deals().stream().filter(d->d.id().equals(id)).findFirst().orElseThrow(CrmService::missing); }
    @Transactional
    public String saveDeal(String w,String id,ApiInputs.DealInput input) {
        return saveDeal(w,id,input,null);
    }
    private String saveDeal(String w,String id,ApiInputs.DealInput input,LocalDate restoredCloseDate) {
        if(restoredCloseDate!=null&&!List.of("Won","Lost").contains(input.stage())) throw invalid("A close date can only be restored for a closed opportunity.");
        var r=repo.read(w); account(r,input.accountId());owner(r,input.ownerId());
        if(!STAGES.contains(input.stage())) throw invalid("Choose a valid pipeline stage.");
        if(input.contactId()!=null&&!input.contactId().isBlank()&&r.contacts().stream().noneMatch(c->c.id().equals(input.contactId())&&c.accountId().equals(input.accountId()))) throw invalid("The contact must belong to this account.");
        Deal old=id==null?null:deal(r,id);
        if(old!=null&&!old.accountId().equals(input.accountId())) throw invalid("An existing opportunity stays with its original account. Create a new opportunity for another account.");
        var d=new Deal(id==null?UUID.randomUUID().toString():id,input.accountId(),input.contactId()==null||input.contactId().isBlank()?null:input.contactId(),input.name().trim(),input.amountCents(),input.stage(),input.closeDate(),List.of("Won","Lost").contains(input.stage())?(restoredCloseDate!=null?restoredCloseDate:old!=null&&old.actualCloseDate()!=null?old.actualCloseDate():LocalDate.now(clock)):null,input.ownerId(),old==null?clock.instant():old.lastBuyerActivity(),old==null?clock.instant():old.createdAt(),old==null?1:input.version());
        if(old==null) repo.insertDeal(w,d); else changed(repo.updateDeal(w,d));
        if(old==null||!old.stage().equals(d.stage())) {
            if(old!=null) repo.stageEvent(w,d.id(),old.stage(),d.stage(),clock.instant().toString());
            repo.insertActivity(w,new Activity(UUID.randomUUID().toString(),d.id(),d.accountId(),"stage",old==null?"Opportunity created":"Moved to "+d.stage(),old==null?"A new opportunity was added to the pipeline.":old.stage()+" → "+d.stage(),clock.instant(),d.ownerId()));
        }
        return d.id();
    }
    @Transactional
    public void changeStage(String w,String id,ApiInputs.StageInput in) {
        var old=deal(repo.read(w),id);
        saveDeal(w,id,new ApiInputs.DealInput(old.name(),old.accountId(),old.contactId(),old.amountCents(),in.stage(),old.closeDate(),old.ownerId(),in.version()),in.restoreCloseDate());
    }
    @Transactional
    public String saveAccount(String w,String id,ApiInputs.AccountInput in) {
        var r=repo.read(w);owner(r,in.ownerId());
        var old=id==null?null:account(r,id);
        var a=new Account(id==null?UUID.randomUUID().toString():id,in.name().trim(),in.industry(),in.website()==null?"":in.website().trim(),initials(in.name()),old==null?"#e5dcfa":old.color(),in.employees(),in.location(),in.description(),in.ownerId(),in.status(),old==null?1:in.version());
        if(old==null) repo.insertAccount(w,a);else changed(repo.updateAccount(w,a));
        return a.id();
    }
    @Transactional
    public String saveContact(String w,String id,ApiInputs.ContactInput in) {
        var r=repo.read(w);account(r,in.accountId());
        if(id!=null&&r.contacts().stream().noneMatch(c->c.id().equals(id))) throw missing();
        if(id!=null&&r.deals().stream().anyMatch(d->id.equals(d.contactId())&&!d.accountId().equals(in.accountId()))) throw invalid("This contact belongs to a linked opportunity. Keep the original account or add a separate contact.");
        var c=new Contact(id==null?UUID.randomUUID().toString():id,in.accountId(),in.name().trim(),in.email().trim(),in.jobTitle(),in.phone(),initials(in.name()),"#ded8f5");
        if(id==null) repo.insertContact(w,c);else repo.updateContact(w,c);
        return c.id();
    }
    @Transactional
    public String saveTask(String w,String id,ApiInputs.TaskInput in) {
        var r=repo.read(w);owner(r,in.ownerId());account(r,in.accountId());
        if(in.dealId()!=null&&!in.dealId().isBlank()&&!deal(r,in.dealId()).accountId().equals(in.accountId())) throw invalid("The deal must belong to this account.");
        if(id==null) {String previous=repo.taskByRequestKey(w,in.requestKey());if(previous!=null)return previous;}
        Task old=id==null?null:r.tasks().stream().filter(t->t.id().equals(id)).findFirst().orElseThrow(CrmService::missing);
        var t=new Task(id==null?UUID.randomUUID().toString():id,in.dealId()==null||in.dealId().isBlank()?null:in.dealId(),in.accountId(),in.title().trim(),in.dueDate(),in.ownerId(),in.completed(),old==null?1:in.version());
        if(old==null) {
            repo.insertTask(w,t,in.requestKey());
            repo.insertActivity(w,new Activity(UUID.randomUUID().toString(),t.dealId(),t.accountId(),"task","Next step scheduled",t.title()+" · due "+t.dueDate(),clock.instant(),t.ownerId()));
        } else changed(repo.updateTask(w,t));
        return t.id();
    }
    @Transactional
    public String addActivity(String w,ApiInputs.ActivityInput in) {
        var r=repo.read(w);account(r,in.accountId());owner(r,in.ownerId());
        if(!List.of("note","email","meeting","call").contains(in.kind())) throw invalid("Choose a supported activity type.");
        Deal d=in.dealId()==null||in.dealId().isBlank()?null:deal(r,in.dealId());
        if(d!=null&&!d.accountId().equals(in.accountId())) throw invalid("The deal must belong to this account.");
        if(d!=null&&in.buyerResponse()) changed(repo.updateDeal(w,new Deal(d.id(),d.accountId(),d.contactId(),d.name(),d.amountCents(),d.stage(),d.closeDate(),d.actualCloseDate(),d.ownerId(),clock.instant(),d.createdAt(),d.version())));
        String id=UUID.randomUUID().toString();
        repo.insertActivity(w,new Activity(id,d==null?null:d.id(),in.accountId(),in.kind(),in.title().trim(),in.body().trim(),clock.instant(),in.ownerId()));
        return id;
    }
}
