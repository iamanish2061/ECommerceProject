package com.ecommerce.exception;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping("/error")
@RestController
public class MyErrorController implements ErrorController {

    @RequestMapping()
    public String errorController(){
        return "You have no permission to view this page";
    }

}
