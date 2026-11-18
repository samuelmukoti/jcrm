package com.jcrm;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
class CrmIntegrationTest {
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) { registry.add("jcrm.database",()-> { try { return Files.createTempDirectory("jcrm-test-").resolve("crm.db").toString(); } catch(Exception e) {throw new RuntimeException(e);} }); }
    @Value("${local.server.port}") int port;
    @Autowired JsonMapper json;
    @Autowired CrmRepository repo;
    final HttpClient client=HttpClient.newHttpClient();
    record Session(String cookie,JsonNode snapshot) {}
    Session session() throws Exception {
        var response=request(null,"GET","/workspace",null);
        assertEquals(200,response.statusCode());
        return new Session(response.headers().firstValue("Set-Cookie").orElseThrow().split(";")[0],json.readTree(response.body()));
    }
    HttpResponse<String> request(String cookie,String method,String path,Object body) throws Exception {
        var builder=HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api"+path));
        if(cookie!=null)builder.header("Cookie",cookie);
        if(body!=null)builder.header("Content-Type","application/json");
        return client.send(builder.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body))).build(),HttpResponse.BodyHandlers.ofString());
    }
    JsonNode snapshot(Session s) throws Exception { return json.readTree(request(s.cookie(),"GET","/workspace",null).body()); }
    JsonNode primary(JsonNode s) {String account="";for(var a:s.get("accounts"))if(a.get("name").asString().equals("Acme"))account=a.get("id").asString();for(var d:s.get("deals"))if(d.get("accountId").asString().equals(account)&&d.get("stage").asString().equals("Proposal"))return d;throw new AssertionError("Primary story missing");}
    JsonNode find(JsonNode rows,String id) {for(var row:rows)if(row.get("id").asString().equals(id))return row;throw new AssertionError("Record not found: "+id);}
    @Test void seedAndForecastUsePersistedRecords() throws Exception {
        var s=session().snapshot();
        assertEquals(25,s.get("accounts").size());assertEquals(50,s.get("contacts").size());assertEquals(35,s.get("deals").size());
        long total=0,forecast=0;int count=0;
        for(var d:s.get("deals"))if(!List.of("Won","Lost").contains(d.get("stage").asString())){total+=d.get("amountCents").asLong();forecast+=d.get("amountCents").asLong()*CrmService.PROBABILITIES.get(d.get("stage").asString())/100;count++;}
        assertEquals(total,s.at("/dashboard/openPipelineCents").asLong());assertEquals(forecast,s.at("/dashboard/weightedForecastCents").asLong());assertEquals(count,s.at("/dashboard/openCount").asInt());
        assertTrue(s.at("/dashboard/winRate").asDouble()<1);assertTrue(s.get("insights").size()>0);
    }
    @Test void stageMoveUndoAndStaleEditAreTransactional() throws Exception {
        var s=session();var d=primary(s.snapshot());String id=d.get("id").asString();long before=s.snapshot().at("/dashboard/weightedForecastCents").asLong();
        assertEquals(200,request(s.cookie(),"PATCH","/deals/"+id+"/stage",Map.of("stage","Negotiation","version",1)).statusCode());
        var moved=snapshot(s);assertEquals("Negotiation",find(moved.get("deals"),id).get("stage").asString());assertEquals(before+d.get("amountCents").asLong()/5,moved.at("/dashboard/weightedForecastCents").asLong());
        assertEquals(409,request(s.cookie(),"PATCH","/deals/"+id+"/stage",Map.of("stage","Qualified","version",1)).statusCode());
        assertEquals(200,request(s.cookie(),"PATCH","/deals/"+id+"/stage",Map.of("stage","Proposal","version",2)).statusCode());
        var undone=snapshot(s);assertEquals(before,undone.at("/dashboard/weightedForecastCents").asLong());assertEquals(3,find(undone.get("deals"),id).get("version").asInt());
        long events=0;for(var a:undone.get("activities"))if(id.equals(a.get("dealId").asString())&&a.get("kind").asString().equals("stage"))events++;assertEquals(2,events);
    }
    @Test void undoRestoresHistoricalCloseDateAndReportingCohort() throws Exception {
        var s=session();JsonNode historical=null;
        String month=s.snapshot().at("/workspace/today").asString().substring(0,7);
        for(var d:s.snapshot().get("deals"))if(d.get("stage").asString().equals("Won")&&!d.get("actualCloseDate").asString().startsWith(month)){historical=d;break;}
        assertNotNull(historical);
        String id=historical.get("id").asString(), original=historical.get("actualCloseDate").asString();
        var before=json.readTree(request(s.cookie(),"GET","/workspace?period=month",null).body());
        assertEquals(200,request(s.cookie(),"PATCH","/deals/"+id+"/stage",Map.of("stage","Discovery","version",1)).statusCode());
        assertEquals(200,request(s.cookie(),"PATCH","/deals/"+id+"/stage",Map.of("stage","Won","version",2,"restoreCloseDate",original)).statusCode());
        var after=snapshot(s);
        assertEquals(original,find(after.get("deals"),id).get("actualCloseDate").asString());
        var reporting=json.readTree(request(s.cookie(),"GET","/workspace?period=month",null).body());
        assertEquals(before.at("/dashboard/wonValueCents"),reporting.at("/dashboard/wonValueCents"));
    }
    @Test void nextStepIsIdempotentAndDoesNotInventBuyerActivity() throws Exception {
        var s=session();var d=primary(s.snapshot());String id=d.get("id").asString();
        var task=Map.of("dealId",id,"accountId",d.get("accountId").asString(),"title","Confirm the commercial review","dueDate",s.snapshot().at("/workspace/today").asString(),"ownerId",d.get("ownerId").asString(),"completed",false,"version",1,"requestKey",UUID.randomUUID().toString());
        var created=request(s.cookie(),"POST","/tasks",task);assertEquals(200,created.statusCode());
        assertEquals(json.readTree(created.body()).get("id"),json.readTree(request(s.cookie(),"POST","/tasks",task).body()).get("id"));
        var after=snapshot(s);assertEquals(s.snapshot().get("tasks").size()+1,after.get("tasks").size());assertEquals(d.get("lastBuyerActivity"),find(after.get("deals"),id).get("lastBuyerActivity"));
        for(var i:after.get("insights"))if(i.get("dealId").asString().equals(id)){assertTrue(i.get("score").asInt()<70);assertTrue(i.toString().contains("No buyer activity"));assertFalse(i.toString().contains("No open follow-up"));}
    }
    @Test void visitorsAndResetAreIsolated() throws Exception {
        var a=session();var b=session();var d=primary(a.snapshot());String id=d.get("id").asString();
        assertNotEquals(a.snapshot().at("/workspace/id"),b.snapshot().at("/workspace/id"));
        assertEquals(404,request(b.cookie(),"PATCH","/deals/"+id+"/stage",Map.of("stage","Won","version",1)).statusCode());
        assertEquals(200,request(a.cookie(),"PATCH","/deals/"+id+"/stage",Map.of("stage","Negotiation","version",1)).statusCode());
        assertEquals(200,request(b.cookie(),"POST","/reset",Map.of()).statusCode());assertEquals("Negotiation",find(snapshot(a).get("deals"),id).get("stage").asString());
        assertEquals(200,request(a.cookie(),"POST","/reset",Map.of()).statusCode());assertEquals("Proposal",find(snapshot(a).get("deals"),id).get("stage").asString());
    }
    @Test void aiUsesSourcesAndHandlesUnsupportedQuestions() throws Exception {
        var s=session();var d=primary(s.snapshot());
        var draft=json.readTree(request(s.cookie(),"POST","/ai",Map.of("action","draft","dealId",d.get("id").asString())).body());
        assertTrue(draft.get("draft").asString().contains("Jordan"));assertTrue(draft.get("draft").asString().contains("Acme"));assertTrue(draft.get("evidence").size()>1);assertEquals("Demo intelligence",draft.get("mode").asString());
        var unsupported=json.readTree(request(s.cookie(),"POST","/ai",Map.of("action","question","question","Predict the weather on Mars")).body());assertEquals(0,unsupported.get("dealIds").size());assertTrue(unsupported.get("body").asString().contains("focused set"));
        var answer=json.readTree(request(s.cookie(),"POST","/ai",Map.of("action","question","question","Show Alex's pipeline")).body());assertTrue(answer.get("dealIds").size()>0);
        for(var deal:answer.get("dealIds"))assertEquals(s.snapshot().at("/members/0/id"),find(s.snapshot().get("deals"),deal.asString()).get("ownerId"));
    }
    @Test void validationRejectsBadValuesAndCrossWorkspaceReferences() throws Exception {
        var s=session();var d=primary(s.snapshot());
        var body=new HashMap<String,Object>();body.put("name","");body.put("accountId",d.get("accountId").asString());body.put("amountCents",-5);body.put("stage","Proposal");body.put("closeDate","2026-11-22");body.put("ownerId",d.get("ownerId").asString());body.put("version",1);
        assertEquals(400,request(s.cookie(),"POST","/deals",body).statusCode());
        body.put("name","Valid opportunity");body.put("amountCents",10000);body.put("ownerId",session().snapshot().at("/members/0/id").asString());assertEquals(400,request(s.cookie(),"POST","/deals",body).statusCode());
    }
    @ParameterizedTest @ValueSource(strings={"2026-03-31T10:00:00Z","2026-04-01T10:00:00Z","2026-12-31T10:00:00Z"})
    void storySurvivesQuarterBoundaries(String instant) {
        Clock clock=Clock.fixed(Instant.parse(instant),ZoneOffset.UTC);String w=new DemoSeed(repo,clock).create();
        var s=new CrmService(repo,clock).snapshot(w,"quarter","all");
        assertEquals(23,s.dashboard().openCount());assertTrue(s.insights().stream().anyMatch(i->i.score()>=60));
        repo.deleteWorkspace(w);
    }
}
