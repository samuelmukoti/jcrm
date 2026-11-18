package com.jcrm;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import static com.jcrm.Domain.*;

@Service
class DemoSeed {
    private final CrmRepository repo;
    private final Clock clock;
    DemoSeed(CrmRepository repo, Clock clock) { this.repo=repo; this.clock=clock; }
    static String id(String workspace,String key) { return UUID.nameUUIDFromBytes((workspace+":"+key).getBytes(StandardCharsets.UTF_8)).toString(); }
    @Transactional
    public String create() {
        repo.deleteExpired(clock.instant().toString());
        String w=UUID.randomUUID().toString();
        seed(w);
        return w;
    }
    @Transactional
    public void reset(String w) { repo.deleteWorkspace(w); seed(w); }
    private void seed(String w) {
        Instant now=clock.instant();
        LocalDate today=LocalDate.now(clock);
        repo.createWorkspace(w,now.toString(),now.plus(7,ChronoUnit.DAYS).toString());
        String[] people={"Alex Morgan","Sarah Chen","James Wilson","Emily Davis","Marcus Reed"};
        String[] initials={"AM","SC","JW","ED","MR"};
        String[] colors={"#ded8f5","#f8dccd","#d6e6da","#f6dfeb","#d9e6f5"};
        for(int i=0;i<5;i++) repo.insertMember(w,new Member(id(w,"member"+i),people[i],initials[i],colors[i],i==0?"Sales lead":"Account executive"));
        String[] names={"Acme","Orbit","Lumina","Layers","Northstar","Spherule","Polaris","Arc","Eclipse","Nexa","Bloom","Aperture","Forma","Summit","Mosaic","Novu","Capsule","Evergreen","Relay","Monogram","Helio","Prism","Altitude","Solstice","Vista"};
        String[] brand={"#181c28","#e5dcfa","#fff0c9","#e2eafb","#deeee7","#efdef6","#f9e1d9","#d9e8f7"};
        String[] industries={"Technology","Design & creative","Financial services","Healthcare","Technology"};
        String[] locations={"San Francisco, CA","New York, NY","Austin, TX","London, UK","Seattle, WA"};
        String[] first={"Jordan","Taylor","Casey","Avery","Riley","Morgan","Cameron","Jamie","Quinn","Drew","Skyler","Parker","Reese","Sage","Blake","Rowan","Finley","Harper","Logan","Kendall","Hayden","Emerson","Robin","Dakota","Alexis"};
        for(int i=0;i<25;i++) {
            String a=id(w,"account"+i);
            repo.insertAccount(w,new Account(a,names[i],industries[i%5],names[i].toLowerCase()+".example",names[i].substring(0,1),brand[i%8],50+i*37,locations[i%5],names[i]+" is building thoughtful products for a more connected world. Our team is helping them bring their customer operations together.",id(w,"member"+(i%5)),i%4==0?"Customer":"Prospect",1));
            for(int j=0;j<2;j++) {
                String name=first[i]+(j==0?" Ellis":" Brooks");
                repo.insertContact(w,new Contact(id(w,"contact"+(i*2+j)),a,name,name.toLowerCase().replace(' ','.')+"@"+names[i].toLowerCase()+".example",j==0?"VP of Operations":"Head of Partnerships","+1 202-555-01"+String.format("%02d",i*2+j),""+first[i].charAt(0)+(j==0?'E':'B'),colors[(i+j)%5]));
            }
        }
        long[] amounts={84500,62000,48000,96000,32500,128000,54000,76000,43000,112000,28500,68000};
        String[] dealNames={"Enterprise rollout","Growth partnership","Platform expansion","Annual team plan","Customer success suite","Global operations"};
        for(int i=0;i<35;i++) {
            int ai=i%25;
            String deal=id(w,"deal"+i), account=id(w,"account"+ai), owner=id(w,"member"+(ai%5));
            String stage=i<23?STAGES.get(i%4):i<32?"Won":"Lost";
            LocalDate quarterEnd=today.withMonth(((today.getMonthValue()-1)/3+1)*3).withDayOfMonth(1).plusMonths(1).minusDays(1);
            LocalDate close=today.plusDays(i==0?7:i%7==0?3+i%6:(i%8)*4+3);
            if(close.isAfter(quarterEnd)) close=quarterEnd;
            LocalDate actual=null;
            if(i>=23) actual=today.minusMonths((i-23)%6).withDayOfMonth(Math.min(today.getDayOfMonth(),8+(i%16)));
            if(i>=32) actual=today.minusDays((i-32)*7+2);
            if(actual!=null && actual.isAfter(today)) actual=today;
            Instant last=now.minus(i==0?12:i%7==0?15:(i%6)+1,ChronoUnit.DAYS);
            if(i==0) stage="Proposal";
            if(i==1) stage="Discovery";
            repo.insertDeal(w,new Deal(deal,account,id(w,"contact"+(ai*2)),names[ai]+" — "+dealNames[i%6],amounts[i%12]*100,stage,actual==null?close:actual,actual,owner,last,now.minus(30+i*2,ChronoUnit.DAYS),1));
            repo.insertActivity(w,new Activity(id(w,"activity"+i+"a"),deal,account,"meeting","Discovery meeting", "Discussed the team's goals, current workflow, and rollout requirements. The operations team is the primary stakeholder.",(i==0?last:last.minus(3,ChronoUnit.DAYS)),owner));
            repo.insertActivity(w,new Activity(id(w,"activity"+i+"b"),deal,account,i==0?"email":"note",i==0?"Proposal shared with Jordan":"Account update",i==0?"Shared the enterprise proposal for 150 seats and a phased rollout. Awaiting Jordan's feedback on the commercial terms.":"Confirmed the opportunity scope and documented next steps for the team.",(i==0?last.plus(1,ChronoUnit.DAYS):last),owner));
            if(i>=23) repo.insertActivity(w,new Activity(id(w,"activity"+i+"c"),deal,account,"stage","Deal marked "+stage,"Opportunity moved to "+stage+".",actual.atTime(12,0).toInstant(java.time.ZoneOffset.UTC),owner));
            if(i>0 && i<20 && i%7!=0) {
                String[] tasks={"Prepare discovery talking points","Send the updated proposal","Check in on the rollout plan","Review commercial terms","Share customer success stories","Schedule a product walkthrough"};
                LocalDate due=i<5?today:today.plusDays(i%6-1);
                repo.insertTask(w,new Task(id(w,"task"+i),deal,account,tasks[i%6],due,owner,i%8==0,1),"seed-"+i);
            }
        }
    }
}
