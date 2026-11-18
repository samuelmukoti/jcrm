package com.jcrm;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
class PageController {
    @GetMapping({"/", "/pipeline", "/relationships", "/work", "/ai", "/deals/{id}", "/accounts/{id}"})
    String app() { return "forward:/index.html"; }
}
