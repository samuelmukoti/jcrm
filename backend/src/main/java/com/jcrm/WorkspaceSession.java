package com.jcrm;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.time.Duration;
import java.util.Arrays;

@Component
class WorkspaceSession extends OncePerRequestFilter {
    private final CrmRepository repo;
    private final DemoSeed seed;
    WorkspaceSession(CrmRepository repo,DemoSeed seed) { this.repo=repo;this.seed=seed; }
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) { return !request.getRequestURI().startsWith("/api/")||request.getRequestURI().equals("/api/health"); }
    protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
        response.setHeader("Cache-Control","no-store");
        if(!request.getMethod().equals("GET")&&"cross-site".equals(request.getHeader("Sec-Fetch-Site"))) { response.sendError(403);return; }
        String w=request.getCookies()==null?null:Arrays.stream(request.getCookies()).filter(c->c.getName().equals("jcrm_session")).map(c->c.getValue()).findFirst().orElse(null);
        if(w==null||!w.matches("[a-f0-9-]{36}")||!repo.workspaceExists(w)) {
            w=seed.create();
            response.addHeader("Set-Cookie",ResponseCookie.from("jcrm_session",w).httpOnly(true).secure(request.isSecure()).sameSite("Lax").path("/").maxAge(Duration.ofDays(7)).build().toString());
        }
        request.setAttribute("workspace",w);
        chain.doFilter(request,response);
    }
}
