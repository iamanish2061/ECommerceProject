package com.ecommerce.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@NotBlank(message = "Number is required")
@Pattern(regexp = "^9[78][0-9]{8}$", message = "Invalid number format")
@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = {})
public @interface ValidNumber {

    String message() default "Please provide a valid phone number";

    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}