package com.ecommerce.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.lang.annotation.*;

@NotBlank(message = "Username is required")
@Pattern(regexp = "^[A-Za-z0-9_]{4,20}$", message = "Username can contain a-z A-Z 0-9 and _")
@Target({ElementType.PARAMETER, ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = {})
public @interface ValidUsername {
    String message() default "Invalid username format";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}


