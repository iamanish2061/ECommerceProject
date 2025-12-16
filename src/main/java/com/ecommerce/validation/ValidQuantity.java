package com.ecommerce.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.lang.annotation.*;

@NotNull(message = "Quantity is required")
@Min(value = 0, message = "Quantity cannot be negative")
@Pattern(regexp = "^[1-9]\\d{0,2}$", message = "Invalid quantity format")
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = {})
public @interface ValidQuantity {
    String message() default "Invalid quantity";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}