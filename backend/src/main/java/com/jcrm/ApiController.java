package com.jcrm;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import java.util.Map;
import static com.jcrm.Domain.*;

@RestController
@RequestMapping("/api")
class ApiController {
    private final CrmService crm;
    private final DemoSeed seed;
    private final AiAssistant ai;
    ApiController(CrmService crm,DemoSeed seed,AiAssistant ai) {this.crm=crm;this.seed=seed;this.ai=ai;}
    private String w(HttpServletRequest request) { return (String)request.getAttribute("workspace"); }
    @GetMapping("/health") Map<String,String> health() { return Map.of("status","ok","application","jcrm"); }
    @GetMapping("/workspace") Snapshot workspace(HttpServletRequest r,@RequestParam(defaultValue="quarter") String period,@RequestParam(defaultValue="all") String owner) { return crm.snapshot(w(r),period,owner); }
    @PostMapping("/reset") Map<String,String> reset(HttpServletRequest r) { seed.reset(w(r));return Map.of("status","reset"); }
    @PostMapping("/deals") Map<String,String> createDeal(HttpServletRequest r,@Valid @RequestBody ApiInputs.DealInput in) { return Map.of("id",crm.saveDeal(w(r),null,in)); }
    @PutMapping("/deals/{id}") Map<String,String> updateDeal(HttpServletRequest r,@PathVariable String id,@Valid @RequestBody ApiInputs.DealInput in) { return Map.of("id",crm.saveDeal(w(r),id,in)); }
    @PatchMapping("/deals/{id}/stage") Map<String,String> stage(HttpServletRequest r,@PathVariable String id,@Valid @RequestBody ApiInputs.StageInput in) { crm.changeStage(w(r),id,in);return Map.of("id",id); }
    @PostMapping("/accounts") Map<String,String> createAccount(HttpServletRequest r,@Valid @RequestBody ApiInputs.AccountInput in) { return Map.of("id",crm.saveAccount(w(r),null,in)); }
    @PutMapping("/accounts/{id}") Map<String,String> updateAccount(HttpServletRequest r,@PathVariable String id,@Valid @RequestBody ApiInputs.AccountInput in) { return Map.of("id",crm.saveAccount(w(r),id,in)); }
    @PostMapping("/contacts") Map<String,String> createContact(HttpServletRequest r,@Valid @RequestBody ApiInputs.ContactInput in) { return Map.of("id",crm.saveContact(w(r),null,in)); }
    @PutMapping("/contacts/{id}") Map<String,String> updateContact(HttpServletRequest r,@PathVariable String id,@Valid @RequestBody ApiInputs.ContactInput in) { return Map.of("id",crm.saveContact(w(r),id,in)); }
    @PostMapping("/tasks") Map<String,String> createTask(HttpServletRequest r,@Valid @RequestBody ApiInputs.TaskInput in) { return Map.of("id",crm.saveTask(w(r),null,in)); }
    @PutMapping("/tasks/{id}") Map<String,String> updateTask(HttpServletRequest r,@PathVariable String id,@Valid @RequestBody ApiInputs.TaskInput in) { return Map.of("id",crm.saveTask(w(r),id,in)); }
    @PostMapping("/activities") Map<String,String> activity(HttpServletRequest r,@Valid @RequestBody ApiInputs.ActivityInput in) { return Map.of("id",crm.addActivity(w(r),in)); }
    @PostMapping("/ai") AiResult ai(HttpServletRequest r,@Valid @RequestBody ApiInputs.AiInput in) { return ai.generate(crm.snapshot(w(r),"quarter","all"),in.action(),in.dealId(),in.question()); }
}

@RestControllerAdvice
class ApiErrors {
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<?> domain(ResponseStatusException ex) { return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message",ex.getReason()==null?"The request could not be completed.":ex.getReason())); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> validation(MethodArgumentNotValidException ex) {
        var errors=new java.util.LinkedHashMap<String,String>();
        ex.getBindingResult().getFieldErrors().forEach(e->errors.put(e.getField(),e.getDefaultMessage()));
        return ResponseEntity.badRequest().body(Map.of("message","Please check the highlighted fields.","fields",errors));
    }
    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<?> unreadable() {return ResponseEntity.badRequest().body(Map.of("message","Check the dates and values, then try again."));}
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    ResponseEntity<?> integrity() {return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message","A related record changed. Refresh this view and try again."));}
}
