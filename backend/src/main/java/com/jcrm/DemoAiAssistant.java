package com.jcrm;

import org.springframework.stereotype.Service;
import java.text.NumberFormat;
import java.time.Clock;
import java.time.LocalDate;
import java.util.*;
import static com.jcrm.Domain.*;

@Service
class DemoAiAssistant implements AiAssistant {
    private final Clock clock;
    DemoAiAssistant(Clock clock) { this.clock=clock; }
    private String money(long cents) { return NumberFormat.getCurrencyInstance(Locale.US).format(cents/100.0).replace(".00",""); }
    private AiResult result(String title,String body,String draft,List<Evidence> evidence,List<String> deals) { return new AiResult(title,body,draft,evidence,deals,"Demo intelligence",clock.instant()); }
    public AiResult generate(Snapshot s,String action,String dealId,String question) {
        if(List.of("draft","risk").contains(action)) {
            Deal d=s.deals().stream().filter(x->x.id().equals(dealId)).findFirst().orElseThrow(CrmService::missing);
            Account a=s.accounts().stream().filter(x->x.id().equals(d.accountId())).findFirst().orElseThrow();
            Contact c=s.contacts().stream().filter(x->x.id().equals(d.contactId())).findFirst().orElse(null);
            Insight insight=CrmService.insight(d,s.tasks(),s.workspace().today());
            List<Evidence> facts=new ArrayList<>(insight.evidence());
            facts.add(new Evidence("Opportunity",d.name()+" · "+money(d.amountCents())+" · "+d.stage(),d.id()));
            s.activities().stream().filter(x->d.id().equals(x.dealId())&&!x.kind().equals("task")&&!x.kind().equals("stage")&&!x.title().equals("Follow-up draft")).findFirst().ifPresent(x->facts.add(new Evidence(x.title(),x.body(),d.id())));
            if(action.equals("risk")) return result("A closer look at "+a.name(),insight.score()==0?"This opportunity is on track. Keep the scheduled next step and confirm the close date with the buyer.":insight.summary()+". A personal check-in is a useful next move. Confirm the buyer's timing before updating the close date or stage.",null,facts,List.of(d.id()));
            String recipient=c==null?"there":c.name().split(" ")[0];
            String owner=s.members().stream().filter(m->m.id().equals(d.ownerId())).findFirst().map(m->m.name().split(" ")[0]).orElse("Your account team");
            boolean rolloutContext=s.activities().stream().anyMatch(a1->d.id().equals(a1.dealId())&&a1.body().contains("150 seats")&&a1.title().contains("Proposal"));
            String intro=rolloutContext?"I wanted to follow up on the enterprise proposal for a phased rollout of 150 seats at "+a.name()+". I would be happy to walk through any questions about the scope or commercial terms.":"I wanted to check in on "+d.name().substring(d.name().indexOf('—')>=0?d.name().indexOf('—')+2:0).toLowerCase()+" for "+a.name()+". I would love to hear how your team is thinking about the next steps and whether there are any questions I can help with.";
            String draft="Hi "+recipient+",\n\n"+intro+"\n\nWould a short conversation this week be useful? We can walk through the details and confirm a timeline that works for your team.\n\nBest,\n"+owner;
            return result("A thoughtful follow-up for "+a.name(),"A starting point based on this opportunity. Make it yours before copying or saving it.",draft,facts,List.of(d.id()));
        }
        if(action.equals("briefing")) {
            var attention=s.insights().stream().filter(i->i.score()>=60).limit(3).toList();
            long due=s.tasks().stream().filter(t->!t.completed()&&!t.dueDate().isAfter(s.workspace().today())).count();
            return result("Your day, with a little more clarity",s.dashboard().openCount()+" open opportunities represent "+money(s.dashboard().openPipelineCents())+" in the selected period. "+attention.size()+" priority deals deserve a closer look, and "+due+" tasks are due today or overdue. Start with the opportunity that has no clear next step.",null,attention.stream().flatMap(i->i.evidence().stream().limit(1)).toList(),attention.stream().map(Insight::dealId).toList());
        }
        if(!action.equals("question")) throw CrmService.invalid("Choose briefing, risk, draft, or question.");
        String q=question==null?"":question.toLowerCase(Locale.ROOT);
        boolean risk=q.matches("(?s).*(risk|attention|stalled|priority|stuck).*");
        boolean close=q.matches("(?s).*(clos|pipeline|deal|opportunit).*");
        if(q.matches("(?s).*(task|upcoming|work today|due today).*")&&!close) {
            var tasks=s.tasks().stream().filter(t->!t.completed()).filter(t->!t.dueDate().isAfter(s.workspace().today().plusDays(7))).toList();
            return result("Your next steps",tasks.size()+" open tasks are due in the next week or overdue. Open My work to complete them or update a due date.",null,tasks.stream().limit(5).map(t->new Evidence("Due "+t.dueDate(),t.title(),t.dealId())).toList(),tasks.stream().map(Task::dealId).filter(Objects::nonNull).distinct().toList());
        }
        if(!risk&&!close) return result("Let's keep it close to your pipeline", "I can help with deals that need attention, opportunities closing this month, pipeline by owner, and upcoming work. Try one of the suggested questions below. This demo answers a focused set of CRM questions.",null,List.of(),List.of());
        LocalDate today=s.workspace().today();
        LocalDate from=q.contains("month")?today.withDayOfMonth(1):q.contains("quarter")?today.withMonth(((today.getMonthValue()-1)/3)*3+1).withDayOfMonth(1):today.minusYears(100);
        LocalDate to=q.contains("month")?from.plusMonths(1).minusDays(1):q.contains("quarter")?from.plusMonths(3).minusDays(1):q.contains("week")?today.plusDays(7):today.plusYears(100);
        var owner=s.members().stream().filter(m->q.contains(m.name().split(" ")[0].toLowerCase(Locale.ROOT))).findFirst();
        var deals=s.deals().stream().filter(CrmService::isOpen).filter(d->!d.closeDate().isBefore(from)&&!d.closeDate().isAfter(to)).filter(d->owner.isEmpty()||owner.get().id().equals(d.ownerId())).filter(d->!risk||s.insights().stream().anyMatch(i->i.dealId().equals(d.id())&&i.score()>=60)).sorted(Comparator.comparing(Deal::closeDate)).toList();
        String filters="Open deals"+(risk?" · needs attention":"")+(q.contains("month")?" · closing this month":q.contains("quarter")?" · closing this quarter":q.contains("week")?" · closing in the next 7 days":"")+owner.map(m->" · "+m.name()).orElse(" · all owners");
        return result(deals.isEmpty()?"A clear view of your pipeline":deals.size()+" opportunities to look at",deals.isEmpty()?"No deals match these filters. Try a broader period or another owner.":"These opportunities represent "+money(deals.stream().mapToLong(Deal::amountCents).sum())+" in open pipeline. Open a record to review its context and plan your next step.",null,List.of(new Evidence("Interpreted filters",filters,null)),deals.stream().map(Deal::id).toList());
    }
}
